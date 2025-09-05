import { MapData, MatchDraftSequence, Prisma } from '../../.prisma';
import { prisma } from '../config';

export const fullMatchPlayerInclude = { include: { member: true } };

export const fullMatchTeamInclude = {
    include: {
        players: fullMatchPlayerInclude,
        picks: { include: { champion: true } },
        bans: { include: { champion: true } },
    },
};

export const fullMatchInclude = {
    include: {
        map: true,
        draftSequence: { include: { steps: true } },
        teams: fullMatchTeamInclude,
    },
};

export type FullMatch = Prisma.MatchGetPayload<typeof fullMatchInclude>;
export type FullMatchTeam = Prisma.MatchTeamGetPayload<
    typeof fullMatchTeamInclude
>;
export type FullMatchPlayer = Prisma.MatchPlayerGetPayload<
    typeof fullMatchPlayerInclude
>;

export class MatchRepository {
    private static matches: Map<number, MatchRepository> = new Map();

    private constructor(private dbMatch: FullMatch) {}

    get data(): FullMatch {
        return this.dbMatch;
    }

    get teams(): FullMatchTeam[] {
        return this.dbMatch.teams;
    }

    get players(): FullMatchPlayer[] {
        return this.teams.flatMap((t) => t.players);
    }

    get winReportCounts() {
        return new Map(
            Object.entries(
                Object.groupBy(this.players, (u) =>
                    u.teamWinReport !== null ? u.teamWinReport : -1,
                ),
            ).map(([k, v]) => [parseInt(k), v?.length || 0]),
        );
    }

    get dropReportCount() {
        return this.players.map((u) => u.dropReport).filter((r) => r === true)
            .length;
    }

    public static async get(id: number): Promise<MatchRepository> {
        return (
            this.matches.get(id) || new MatchRepository(await this.fetch(id))
        );
    }

    private static async fetch(id: number): Promise<FullMatch> {
        return await prisma.match.findFirstOrThrow({
            where: { id: id },
            include: fullMatchInclude.include,
        });
    }

    public static async discard(id: number) {
        return this.matches.delete(id);
    }

    public static async create(
        map: MapData,
        teams: Prisma.MatchTeamCreateManyMatchInput[],
        draftSequence: MatchDraftSequence,
    ) {
        const newMatch: FullMatch = await prisma.match.create({
            data: {
                mapId: map.id,
                teams: {
                    createMany: {
                        data: teams,
                    },
                },
                draftSequenceId: draftSequence.id,
            },
            include: fullMatchInclude.include,
        });

        if (!newMatch) {
            throw new Error('[Match Repository] Could not create match!');
        }

        const match = new MatchRepository(newMatch);

        this.matches.set(match.dbMatch.id, match);

        return match;
    }

    private async refreshMatch() {
        this.dbMatch = await MatchRepository.fetch(this.dbMatch.id);
    }

    public async createPlayers(
        playerData: Prisma.MatchPlayerCreateManyInput[],
    ): Promise<FullMatchPlayer[]> {
        const players = await prisma.matchPlayer.createManyAndReturn({
            data: playerData,
            include: { member: true },
        });

        if (!players) {
            throw new Error('[Match Repository] Could not create players!');
        }

        await this.refreshMatch();

        return players;
    }

    public async update(data: Prisma.MatchUpdateInput) {
        this.dbMatch = await prisma.match.update({
            where: { id: this.dbMatch.id },
            data: data,
            include: fullMatchInclude.include,
        });
    }

    public async updateTeam(teamId: number, data: Prisma.MatchTeamUpdateInput) {
        const team = await prisma.matchTeam.update({
            where: { id: teamId },
            data: data,
            include: fullMatchTeamInclude.include,
        });

        await this.refreshMatch();

        return team;
    }

    public async updatePlayer(
        playerId: number,
        data: Prisma.MatchPlayerUpdateInput,
    ) {
        const player = await prisma.matchPlayer.update({
            where: { id: playerId },
            data: data,
            include: fullMatchPlayerInclude.include,
        });

        await this.refreshMatch();

        return player;
    }
}

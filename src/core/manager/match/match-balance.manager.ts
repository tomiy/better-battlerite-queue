import { DraftStepType, Match, MatchTeam } from '../../../../.prisma';
import { DebugUtils } from '../../../debug.utils';
import {
    DraftSequenceWithSteps,
    PlayerWithRating,
    RatingData,
} from '../../data-types.type';
import { Manager } from '../manager';

export class MatchBalanceManager extends Manager {
    async pickRandomTerrain(match: Match) {
        const terrains = await this.prisma.gameModeTerrain.findMany({
            where: { gameModeId: match.gameModeId },
        });
        const totalWeights = terrains.reduce((c, t) => c + t.weight, 0);
        terrains.sort(() => Math.random() - 0.5);

        let r = Math.random() * totalWeights;
        for (const terrain of terrains) {
            if (r < terrain.weight) {
                return terrain;
            }
            r -= terrain.weight;
        }

        return null;
    }

    async balanceTeams(
        draftSequence: DraftSequenceWithSteps,
        matchTeams: MatchTeam[],
        playersWithRatings: PlayerWithRating[],
    ) {
        if (
            draftSequence.steps.find(
                (s) => s.type === DraftStepType.PLAYER_PICK,
            )
        ) {
            DebugUtils.debug(
                '[Match Balance Manager] Found player draft in sequence, skipping team balance',
            );

            const captains = playersWithRatings
                .sort((a, b) => b.rating.elo - a.rating.elo)
                .splice(0, matchTeams.length);

            for (const index in captains) {
                const captain = captains[index];

                await this.setPlayerTeam(
                    captain.player.id,
                    matchTeams[index].id,
                    true,
                );
            }

            return;
        }

        const playerPermutations =
            this.createPlayerPermutations(playersWithRatings);

        const bestConfig: {
            diff: number;
            teams: PlayerWithRating[][];
        } = {
            diff: Infinity,
            teams: [],
        };

        for (const playerPermutation of playerPermutations) {
            const teams = [];

            for (
                let i = 0;
                i < playerPermutation.length;
                i += draftSequence.teamSize
            ) {
                teams.push(
                    playerPermutation.slice(i, i + draftSequence.teamSize),
                );
            }

            const teamsAverageElo = teams.map((t) => this.getTeamAverageElo(t));

            const diff =
                Math.max(...teamsAverageElo) - Math.min(...teamsAverageElo);

            if (diff < bestConfig.diff) {
                bestConfig.diff = diff;
                bestConfig.teams = teams;
            }
        }

        for (const index in bestConfig.teams) {
            const balancedTeam = bestConfig.teams[index].sort(
                (a, b) => b.rating.elo - a.rating.elo,
            );
            const destinationTeam = matchTeams[index];

            for (let i = 0; i < balancedTeam.length; i++) {
                const playerWithRating = balancedTeam[i];
                const isCaptain = i === 0;

                await this.setPlayerTeam(
                    playerWithRating.player.id,
                    destinationTeam.id,
                    isCaptain,
                );
            }
        }
    }

    async setPlayerTeam(id: number, teamId: number, captain: boolean = false) {
        try {
            const updatedPlayer = await this.prisma.matchPlayer.update({
                where: { id },
                data: { teamId, captain },
            });

            if (updatedPlayer) {
                DebugUtils.debug(
                    `[Match Balance Manager] Updated player team for player id ${id}`,
                );
                return updatedPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Balance Manager] Error setting player team: ${e}`,
            );
        }

        return null;
    }

    createPlayerPermutations(a: PlayerWithRating[]) {
        const result: PlayerWithRating[][] = [];

        const permute = (a: PlayerWithRating[], m: PlayerWithRating[] = []) => {
            if (a.length === 0) {
                result.push(m);
            } else {
                for (let i = 0; i < a.length; i++) {
                    const curr = a.slice();
                    const next = curr.splice(i, 1);
                    permute(curr.slice(), m.concat(next));
                }
            }
        };

        permute(a);

        return result;
    }

    getTeamAverageElo(team: PlayerWithRating[]) {
        return team.reduce((s, p) => s + p.rating.elo, 0) / team.length;
    }

    computeRatingChanges(ratingData: RatingData[], winningTeam: number) {
        const n = ratingData.length;
        const k = 32 / (n - 1);

        const updatedRatingData = [...ratingData];

        for (let i = 0; i < n; i++) {
            const currentElo = this.getTeamAverageElo(ratingData[i].ratings);

            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const opponentElo = this.getTeamAverageElo(
                        ratingData[j].ratings,
                    );

                    const win =
                        ratingData[i].team.order === winningTeam ? 1 : 0;
                    const probability =
                        1 /
                        (1 + Math.pow(10, (opponentElo - currentElo) / 400));

                    updatedRatingData[i].team.players.forEach(
                        (p) =>
                            (p.ratingChange += Math.round(
                                k * (win - probability),
                            )),
                    );
                }
            }
        }

        return updatedRatingData;
    }
}

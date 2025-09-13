import { Guild } from 'discord.js';
import { Guild as dbGuild, Prisma, Region } from '../../.prisma';
import { defaultDraftSequenceName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { MatchRepository } from '../repository/match.repository';
import { initDraft } from './draft/init-draft';
import { getTeamAverageElo } from './rating-functions';

const validRegionStrings = Object.values(Region);

type QueueWithMember = Prisma.QueueGetPayload<{
    include: { member: { include: { regions: true } } };
}>;

const matchSize = 6;
const teamSize = 3;

export async function tryMatchCreation(dbGuild: dbGuild, guild: Guild) {
    if (matchSize % teamSize) {
        throw new Error(
            '[Match Creation] Invalid config, match size has to be a multiple of team size',
        );
    }

    const queuedMembers: QueueWithMember[] = await prisma.queue.findMany({
        where: { member: { guildId: dbGuild.id } },
        orderBy: { createdAt: 'asc' },
        include: { member: { include: { regions: true } } },
    });

    const ongoingMatches = await prisma.match.findMany({
        where: { state: { notIn: ['DROPPED', 'FINISHED'] } },
        include: { teams: { include: { players: true } } },
    });

    const matchesMemberIds = ongoingMatches.flatMap((m) =>
        m.teams.flatMap((t) => t.players.map((u) => u.memberId)),
    );
    const queuedMemberIds = queuedMembers.map((q) => q.memberId);

    if (matchesMemberIds.some((u) => queuedMemberIds.includes(u))) {
        DebugUtils.debug(
            '[Match Creation] Members in queue and match at the same time, this could be due to multiple quick queue interactions',
        );
        return;
    }

    if (queuedMembers.length < matchSize) {
        DebugUtils.debug(
            '[Match Creation] Not enough members in queue to create match',
        );
        return;
    }

    const membersByRegion: Map<Region, QueueWithMember[]> = new Map();
    validRegionStrings.forEach((region) => {
        if (!membersByRegion.has(region)) {
            membersByRegion.set(region, []);
        }

        queuedMembers.forEach((queuedMember) => {
            if (
                queuedMember.member.regions
                    .map((r) => r.region)
                    .includes(region)
            ) {
                membersByRegion.get(region)?.push(queuedMember);
            }
        });
    });

    const firstQueuedMembersByRegion = [...membersByRegion.values()].find(
        (u) => u.length >= matchSize,
    );
    if (!firstQueuedMembersByRegion) {
        DebugUtils.debug(
            '[Match Creation] Not enough members grouped by region to create match',
        );
        return;
    }

    const matchMembers = firstQueuedMembersByRegion.splice(0, matchSize);
    const matchMembersPermutations = permuteMatchMembers(matchMembers);

    const bestConfig: {
        diff: number;
        teams: QueueWithMember[][];
    } = {
        diff: Infinity,
        teams: [],
    };

    for (const matchMemberPermutation of matchMembersPermutations) {
        const teams = [];
        for (let i = 0; i < matchMemberPermutation.length; i += teamSize) {
            teams.push(matchMemberPermutation.slice(i, i + teamSize));
        }

        const teamsAverageElo = teams.map((t) =>
            getTeamAverageElo(t.map((u) => u.member)),
        );

        const diff =
            Math.max(...teamsAverageElo) - Math.min(...teamsAverageElo);

        if (diff < bestConfig.diff) {
            bestConfig.diff = diff;
            bestConfig.teams = teams;
        }
    }

    DebugUtils.debug('[Match Creation] Found best config, creating match...');

    const map = await selectRandomMap(dbGuild);

    if (!map) {
        throw new Error('[Match Creation] Could not pick a map!');
    }

    const draftSequence = await prisma.matchDraftSequence.findFirstOrThrow({
        where: { name: defaultDraftSequenceName },
        include: { steps: { orderBy: { order: 'asc' } } },
    });

    const match = await MatchRepository.create(
        dbGuild.id,
        map.id,
        bestConfig.teams.map((_, i) => ({ order: i })),
        draftSequence.id,
    );

    const teamsPlayerData: Prisma.MatchPlayerCreateManyInput[] = [];
    bestConfig.teams.forEach((team, teamIndex) => {
        teamsPlayerData.push(
            ...team
                .sort((a, b) => b.member.elo - a.member.elo)
                .map((player, playerIndex) => ({
                    teamId: match.teams[teamIndex].id,
                    memberId: player.memberId,
                    captain: playerIndex === 0,
                })),
        );
    });

    const playerData = await match.createPlayers(teamsPlayerData);

    for (const player of playerData) {
        const discordMember = guild.members.cache.get(player.member.discordId);

        if (!discordMember) {
            throw new Error(
                `[Match Creation] Could not find match discord member for discord id ${player.member.discordId}`,
            );
        }

        await discordMember.roles.remove(dbGuild.queueRole || '');
        await discordMember.roles.add(dbGuild.matchRole || '');
    }

    const deleted = await prisma.queue.deleteMany({
        where: { memberId: { in: playerData.map((u) => u.memberId) } },
    });

    if (!deleted) {
        throw new Error(
            '[Match Creation] Could not remove members from queue!',
        );
    }

    await initDraft(match);
}

function permuteMatchMembers(a: QueueWithMember[]) {
    const result: QueueWithMember[][] = [];

    const permute = (a: QueueWithMember[], m: QueueWithMember[] = []) => {
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

async function selectRandomMap(dbGuild: dbGuild) {
    const maps = await prisma.mapData.findMany({
        where: { guildId: dbGuild.id },
    });
    const totalMapWeights = maps.reduce((t, m) => t + m.weight, 0);
    maps.sort(() => Math.random() - 0.5);

    let r = Math.random() * totalMapWeights;
    for (const map of maps) {
        if (r < map.weight) {
            return map;
        }
        r -= map.weight;
    }

    return null;
}

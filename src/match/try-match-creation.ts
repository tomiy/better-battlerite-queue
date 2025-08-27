import { Guild } from 'discord.js';
import { Guild as dbGuild, Prisma, Region } from '../../.prisma';
import { defaultDraftSequenceName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { initDraft } from './init-draft';

const validRegionStrings = Object.values(Region);

type QueueWithUser = Prisma.QueueGetPayload<{
    include: { user: { include: { regions: true } } };
}>;

const matchSize = 6;
const teamSize = 3;

export async function tryMatchCreation(dbGuild: dbGuild, guild: Guild) {
    if (matchSize % teamSize) {
        throw new Error(
            '[Match Creation] Invalid config, match size has to be a multiple of team size',
        );
    }

    const queuedUsers: QueueWithUser[] = await prisma.queue.findMany({
        where: { user: { guildId: dbGuild.id } },
        orderBy: { createdAt: 'asc' },
        include: { user: { include: { regions: true } } },
    });

    if (queuedUsers.length < matchSize) {
        DebugUtils.debug(
            '[Match Creation] Not enough users in queue to create match',
        );
        return;
    }

    const usersByRegion: Map<Region, QueueWithUser[]> = new Map();
    validRegionStrings.forEach((region) => {
        if (!usersByRegion.has(region)) {
            usersByRegion.set(region, []);
        }

        queuedUsers.forEach((queuedUser) => {
            if (queuedUser.user.regions.map((r) => r.region).includes(region)) {
                usersByRegion.get(region)?.push(queuedUser);
            }
        });
    });

    const firstQueuedUsersByRegion = [...usersByRegion.values()].find(
        (u) => u.length >= matchSize,
    );
    if (!firstQueuedUsersByRegion) {
        DebugUtils.debug(
            '[Match Creation] Not enough users grouped by region to create match',
        );
        return;
    }

    const matchUsers = firstQueuedUsersByRegion.splice(0, matchSize);
    const matchUsersPermutations = permuteMatchUsers(matchUsers);

    const bestConfig: {
        diff: number;
        teams: QueueWithUser[][];
    } = {
        diff: Infinity,
        teams: [],
    };

    for (const matchUserPermutation of matchUsersPermutations) {
        const teams = [];
        for (let i = 0; i < matchUserPermutation.length; i += teamSize) {
            teams.push(matchUserPermutation.slice(i, i + teamSize));
        }

        const teamsAverageElo = teams.map(
            (t) => t.reduce((s, t) => s + t.user.elo, 0) / t.length,
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

    const match = await prisma.match.create({
        data: {
            mapId: map.id,
            teams: {
                createMany: {
                    data: bestConfig.teams.map((_, i) => ({ order: i })),
                },
            },
            draftSequenceId: draftSequence.id,
        },
        include: { teams: true },
    });

    if (!match) {
        throw new Error('[Match Creation] Could not create match!');
    }

    const teamsUserData: Prisma.MatchUserCreateManyInput[] = [];
    bestConfig.teams.forEach((team, teamIndex) => {
        teamsUserData.push(
            ...team
                .sort((a, b) => b.user.elo - a.user.elo)
                .map((teamUser, teamUserIndex) => ({
                    teamId: match.teams[teamIndex].id,
                    userId: teamUser.userId,
                    captain: teamUserIndex === 0,
                })),
        );
    });

    const matchUserData = await prisma.matchUser.createManyAndReturn({
        data: teamsUserData,
        include: { user: true },
    });

    if (!matchUserData) {
        throw new Error('[Match Creation] Could not create match users!');
    }

    for (const matchUser of matchUserData) {
        const discordMember = guild.members.cache.get(
            matchUser.user.userDiscordId,
        );

        if (!discordMember) {
            throw new Error(
                `[Match Creation] Could not find match discord member for user discord id ${matchUser.user.userDiscordId}`,
            );
        }

        await discordMember.roles.remove(dbGuild.queueRole!);
        await discordMember.roles.add(dbGuild.matchRole!);
    }

    const deleted = await prisma.queue.deleteMany({
        where: { userId: { in: matchUserData.map((u) => u.userId) } },
    });

    if (!deleted) {
        throw new Error('[Match Creation] Could not remove users from queue!');
    }

    await initDraft(match.id, guild, dbGuild);
}

function permuteMatchUsers(a: QueueWithUser[]) {
    const result: QueueWithUser[][] = [];

    const permute = (a: QueueWithUser[], m: QueueWithUser[] = []) => {
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

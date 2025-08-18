import { Queue, User } from '../../.prisma';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { initDraft } from './init-draft';

type QueueWithUser = Queue & { user: User };

const matchSize = 6;
const teamSize = 3;

export async function tryMatchCreation(guildId: number) {
    const queuedUsers: QueueWithUser[] = await prisma.queue.findMany({
        where: { user: { guildId: guildId } },
        orderBy: { createdAt: 'asc' },
        include: { user: true },
    });

    if (queuedUsers.length < 6) {
        DebugUtils.debug(
            '[Match Creation] not enough users in queue to create match',
        );
        return;
    }

    const matchUsers = queuedUsers.splice(0, matchSize);
    const matchUsersPermutations = permuteMatchUsers(matchUsers);

    const bestConfig: {
        diff: number;
        team1: QueueWithUser[];
        team2: QueueWithUser[];
    } = {
        diff: Infinity,
        team1: [],
        team2: [],
    };

    for (const matchUserPermutation of matchUsersPermutations) {
        const team1 = matchUserPermutation.splice(0, teamSize);
        const team2 = matchUserPermutation;

        const diff =
            team1.reduce((s, t) => s + t.user.elo, 0) / team1.length -
            team2.reduce((s, t) => s + t.user.elo, 0) / team2.length;

        if (diff < bestConfig.diff) {
            bestConfig.diff = diff;
            bestConfig.team1 = team1;
            bestConfig.team2 = team2;
        }
    }

    DebugUtils.debug(`[Match Creation] best config found: ${bestConfig}`);

    const match = await prisma.match.create({
        data: {
            teams: { createMany: { data: [{}, {}] } },
        },
        include: { teams: { include: { users: true } } },
    });

    if (!match) {
        throw new Error('[Match Creation] could not create match!');
    }

    const team1UserData = bestConfig.team1.map((t) => ({
        teamId: match.teams[0].id,
        userId: t.userId,
    }));
    const team2UserData = bestConfig.team2.map((t) => ({
        teamId: match.teams[1].id,
        userId: t.userId,
    }));

    const matchUserData = await prisma.matchUser.createManyAndReturn({
        data: [...team1UserData, ...team2UserData],
    });

    if (!matchUserData) {
        throw new Error('[Match Creation] could not create match users!');
    }

    match.teams[0].users = matchUserData.splice(0, teamSize);
    match.teams[1].users = matchUserData;

    await initDraft(match);
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

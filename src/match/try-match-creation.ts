import { Queue, User } from '../../.prisma';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';

type QueueUser = Queue & { user: User };

export async function tryMatchCreation(guildId: number) {
    const queuedUsers: QueueUser[] = await prisma.queue.findMany({
        where: { user: { guildId: guildId } },
        orderBy: { queueTime: 'asc', user: { elo: 'desc' } },
        include: { user: true },
    });

    if (queuedUsers.length < 6) {
        DebugUtils.debug('[Match Creation] not enough users in queue to create match');
        return;
    }

    const matchUsers = queuedUsers.splice(0, 6);
    const matchUsersPermutations = permuteMatchUsers(matchUsers);

    const bestConfig: { diff: number; config: QueueUser[] } = { diff: Infinity, config: [] };

    for (const matchUserPermutation of matchUsersPermutations) {
        const team1 = matchUserPermutation.splice(0, 3);
        const team2 = matchUserPermutation;

        const diff = team1.reduce((s, t) => s + t.user.elo, 0) / team1.length - team2.reduce((s, t) => s + t.user.elo, 0) / team2.length;

        if (diff < bestConfig.diff) {
            bestConfig.diff = diff;
            bestConfig.config = matchUserPermutation;
        }
    }

    DebugUtils.debug(`[Match Creation] best config found: ${bestConfig}`);
}

function permuteMatchUsers(a: QueueUser[]) {
    const result: QueueUser[][] = [];

    const permute = (a: QueueUser[], m: QueueUser[] = []) => {
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

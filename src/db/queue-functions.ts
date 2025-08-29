import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Queue, Region, User } from '../../.prisma';
import { prisma } from '../config';
import { tempReply } from '../interaction-utils';

export async function joinQueue(
    queuedUser: Queue | null,
    user: User,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    const matchUser = await prisma.match.findFirst({
        where: {
            state: { notIn: ['DROPPED', 'FINISHED'] },
            teams: { some: { users: { some: { userId: user.id } } } },
        },
    });

    if (matchUser) {
        tempReply(i, 'You are in a match!');
        return false;
    }

    if (queuedUser) {
        tempReply(i, 'You are already in queue!');
        return false;
    }

    const userRegion = await prisma.userRegion.findFirst({
        where: { userId: user.id },
    });

    if (!userRegion) {
        tempReply(i, 'You need to enable at least one region to queue!');
        return false;
    }

    await prisma.queue.create({ data: { userId: user.id } });
    await i.member.roles.add(queueRoleId);
    tempReply(i, 'Queue joined!');

    return true;
}
export async function leaveQueue(
    queuedUser: Queue | null,
    user: User,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    if (!queuedUser) {
        if (!i.replied) {
            tempReply(i, 'You are not in queue!');
        }
        return false;
    }

    await prisma.queue.delete({ where: { userId: user.id } });
    await i.member.roles.remove(queueRoleId);

    if (!i.replied) {
        tempReply(i, 'Queue left!');
    }

    return true;
}
export async function toggleRegion(
    user: User,
    region: Region,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    const existingRegion = await prisma.userRegion.findFirst({
        where: { userId: user.id, region: region },
    });

    if (!existingRegion) {
        const created = await prisma.userRegion.create({
            data: {
                userId: user.id,
                region: region,
            },
        });

        if (!created) {
            throw new Error('[Launch command] Could not create user region!');
        }

        tempReply(i, `Region ${region} enabled!`);

        return true;
    } else {
        const deleted = await prisma.userRegion.delete({
            where: { id: existingRegion.id },
        });

        if (!deleted) {
            throw new Error('[Launch command] Could not delete user region!');
        }

        tempReply(i, `Region ${region} disabled!`);

        const userRegion = await prisma.userRegion.findFirst({
            where: { userId: user.id },
        });

        if (!userRegion) {
            const queuedUser = await prisma.queue.findFirst({
                where: { userId: user.id },
            });

            if (await leaveQueue(queuedUser, user, i, queueRoleId)) {
                i.followUp({
                    content: 'No regions selected, unqueuing',
                    flags: MessageFlags.Ephemeral,
                }).then((msg) => setTimeout(() => msg.delete(), 3000));
            }
        }

        return false;
    }
}

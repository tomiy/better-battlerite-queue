import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Queue, Region, User } from '../../.prisma';
import { prisma } from '../config';

export async function joinQueue(
    queuedUser: Queue | null,
    user: User,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    const matchUser = await prisma.match.findFirst({
        where: {
            state: { not: 'FINISHED' },
            teams: { some: { users: { some: { userId: user.id } } } },
        },
    });

    if (matchUser) {
        await i.reply({
            content: 'You are in a match!',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    if (queuedUser) {
        await i.reply({
            content: 'You are already in queue!',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    const userRegion = await prisma.userRegion.findFirst({
        where: { userId: user.id },
    });

    if (!userRegion) {
        await i.reply({
            content: 'You need to enable at least one region to queue!',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    await prisma.queue.create({ data: { userId: user.id } });
    await i.member.roles.add(queueRoleId);
    await i.reply({
        content: 'Queue joined!',
        flags: MessageFlags.Ephemeral,
    });

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
            await i.reply({
                content: 'You are not in queue!',
                flags: MessageFlags.Ephemeral,
            });
        }
        return false;
    }

    await prisma.queue.delete({ where: { userId: user.id } });
    await i.member.roles.remove(queueRoleId);

    if (!i.replied) {
        await i.reply({
            content: 'Queue left!',
            flags: MessageFlags.Ephemeral,
        });
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

        await i.reply({
            content: `Region ${region} enabled!`,
            flags: MessageFlags.Ephemeral,
        });
    } else {
        const deleted = await prisma.userRegion.delete({
            where: { id: existingRegion.id },
        });

        if (!deleted) {
            throw new Error('[Launch command] Could not delete user region!');
        }

        await i.reply({
            content: `Region ${region} disabled!`,
            flags: MessageFlags.Ephemeral,
        });

        const userRegion = await prisma.userRegion.findFirst({
            where: { userId: user.id },
        });

        if (!userRegion) {
            const queuedUser = await prisma.queue.findFirst({
                where: { userId: user.id },
            });

            if (await leaveQueue(queuedUser, user, i, queueRoleId)) {
                await i.followUp({
                    content: 'No regions selected, unqueuing',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    }
}

import { ButtonInteraction, MessageFlags } from 'discord.js';
import { Member, Queue, Region } from '../../.prisma';
import { prisma } from '../config';
import { tempReply } from '../interaction-utils';

export async function joinQueue(
    queuedMember: Queue | null,
    member: Member,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    const player = await prisma.match.findFirst({
        where: {
            state: { notIn: ['DROPPED', 'FINISHED'] },
            teams: { some: { players: { some: { memberId: member.id } } } },
        },
    });

    if (player) {
        tempReply(i, 'You are in a match!');
        return false;
    }

    if (queuedMember) {
        tempReply(i, 'You are already in queue!');
        return false;
    }

    const memberRegion = await prisma.memberRegion.findFirst({
        where: { memberId: member.id },
    });

    if (!memberRegion) {
        tempReply(i, 'You need to enable at least one region to queue!');
        return false;
    }

    await prisma.queue.create({ data: { memberId: member.id } });
    await i.member.roles.add(queueRoleId);
    tempReply(i, 'Queue joined!');

    return true;
}
export async function leaveQueue(
    queuedMember: Queue | null,
    member: Member,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    if (!queuedMember) {
        if (!i.replied) {
            tempReply(i, 'You are not in queue!');
        }
        return false;
    }

    await prisma.queue.delete({ where: { memberId: member.id } });
    await i.member.roles.remove(queueRoleId);

    if (!i.replied) {
        tempReply(i, 'Queue left!');
    }

    return true;
}
export async function toggleRegion(
    member: Member,
    region: Region,
    i: ButtonInteraction<'cached'>,
    queueRoleId: string,
) {
    const existingRegion = await prisma.memberRegion.findFirst({
        where: { memberId: member.id, region: region },
    });

    if (!existingRegion) {
        const created = await prisma.memberRegion.create({
            data: {
                memberId: member.id,
                region: region,
            },
        });

        if (!created) {
            throw new Error('[Launch command] Could not create member region!');
        }

        tempReply(i, `Region ${region} enabled!`);

        return true;
    } else {
        const deleted = await prisma.memberRegion.delete({
            where: { id: existingRegion.id },
        });

        if (!deleted) {
            throw new Error('[Launch command] Could not delete member region!');
        }

        tempReply(i, `Region ${region} disabled!`);

        const memberRegion = await prisma.memberRegion.findFirst({
            where: { memberId: member.id },
        });

        if (!memberRegion) {
            const queuedMember = await prisma.queue.findFirst({
                where: { memberId: member.id },
            });

            if (await leaveQueue(queuedMember, member, i, queueRoleId)) {
                await i.followUp({
                    content: 'No regions selected, unqueuing',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        return false;
    }
}

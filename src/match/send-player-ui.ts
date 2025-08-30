import { TextChannel } from 'discord.js';
import { Prisma } from '../../.prisma';

export async function sendPlayerUI(
    team: Prisma.MatchTeamGetPayload<{
        include: { players: { include: { member: true } } };
    }>,
    teamChannel: TextChannel,
) {
    for (const player of team.players) {
    }
}

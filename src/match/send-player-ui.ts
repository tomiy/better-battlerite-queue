import { EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { Prisma } from '../../.prisma';

export async function sendPlayerUI(
    team: Prisma.MatchTeamGetPayload<{
        include: { players: { include: { member: true } } };
    }>,
    teamChannel: TextChannel,
    guild: Guild,
) {
    const playerEmbeds: EmbedBuilder[] = [];
    for (const player of team.players) {
        playerEmbeds.push(
            new EmbedBuilder()
                .setAuthor({
                    name: `Player ${player.member.inGameName}`,
                    iconURL: guild.iconURL() || '',
                })
                .setColor('Aqua')
                .addFields([
                    {
                        name: 'Description',
                        value: player.member.description || '',
                    },
                    {
                        name: 'Elo',
                        value: player.member.elo.toString(),
                    },
                ])
                .setTimestamp(),
        );
    }

    await teamChannel.send({ embeds: playerEmbeds });
}

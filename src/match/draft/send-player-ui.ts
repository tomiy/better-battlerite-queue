import {
    EmbedAuthorOptions,
    EmbedBuilder,
    Guild,
    TextChannel,
} from 'discord.js';
import { FullMatchTeam } from '../../repository/match.repository';

export async function sendPlayerUI(
    team: FullMatchTeam,
    teamChannel: TextChannel,
    guild: Guild,
) {
    const playerEmbeds: EmbedBuilder[] = [];
    for (const player of team.players) {
        const discordUser = guild.members.cache.get(player.member.discordId);
        const icon = discordUser?.avatarURL();

        const author: EmbedAuthorOptions = {
            name: `Player ${player.member.inGameName}`,
        };

        if (icon) {
            author.iconURL = icon;
        }

        playerEmbeds.push(
            new EmbedBuilder()
                .setAuthor(author)
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

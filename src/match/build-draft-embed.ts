import { EmbedBuilder, Guild, userMention } from 'discord.js';
import { Prisma } from '../../.prisma';

export function buildDraftEmbed(
    match: Prisma.MatchGetPayload<{
        include: { teams: { include: { users: { include: { user: true } } } } };
    }>,
    guild: Guild,
) {
    return new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .addFields(
            {
                name: 'Team 1',
                value: `
                    ${userMention(match.teams[0].users[0].user.userDiscordId)}
                    ${userMention(match.teams[0].users[1].user.userDiscordId)}
                    ${userMention(match.teams[0].users[2].user.userDiscordId)}
                `,
            },
            {
                name: 'Team 2',
                value: `
                    ${userMention(match.teams[1].users[0].user.userDiscordId)}
                    ${userMention(match.teams[1].users[1].user.userDiscordId)}
                    ${userMention(match.teams[1].users[2].user.userDiscordId)}
                `,
            },
        )
        .setTimestamp();
}

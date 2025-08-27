import {
    EmbedBuilder,
    Guild,
    MessageCreateOptions,
    userMention,
} from 'discord.js';
import { Prisma } from '../../.prisma';

export function buildDraftUI(
    match: Prisma.MatchGetPayload<{
        include: { teams: { include: { users: { include: { user: true } } } } };
    }>,
    guild: Guild,
): MessageCreateOptions {
    const teamsFields = match.teams.map((t) => {
        const userMentions = t.users
            .map((u) => userMention(u.user.userDiscordId))
            .join('');
        return {
            name: `Team ${t.order + 1}`,
            value: userMentions,
        };
    });

    const mainEmbed = new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .addFields(teamsFields)
        .setTimestamp();

    return { embeds: [mainEmbed] };
}

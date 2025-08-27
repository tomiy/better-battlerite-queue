import {
    EmbedBuilder,
    Guild,
    MessageCreateOptions,
    userMention,
} from 'discord.js';
import { Prisma } from '../../.prisma';
import { DebugUtils } from '../debug-utils';

export function buildDraftUI(
    match: Prisma.MatchGetPayload<{
        include: { teams: { include: { users: { include: { user: true } } } } };
    }>,
    guild: Guild,
): MessageCreateOptions {
    DebugUtils.debug(
        `[Build Draft UI] Building draft UI for match ${match.id}`,
    );

    const teamsFields = match.teams.map((t) => {
        const userMentions = t.users
            .map(
                (u) =>
                    `${userMention(u.user.userDiscordId)} ${u.captain ? '- Captain' : ''}`,
            )
            .join('\n');
        return {
            name: `Team ${t.order + 1}`,
            value: userMentions,
        };
    });

    const mainEmbed = new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .addFields(teamsFields)
        .setTimestamp();

    DebugUtils.debug(
        `[Build Draft UI] Successfully built draft UI for match ${match.id}`,
    );

    return { embeds: [mainEmbed] };
}

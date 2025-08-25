import {
    CategoryChannel,
    ChannelType,
    Guild,
    PermissionsBitField,
} from 'discord.js';
import { MatchUser, Prisma, User } from '../../.prisma';
import { categoryChannelName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { buildDraftEmbed } from './build-draft-embed';

export async function initDraft(
    match: Prisma.MatchGetPayload<{
        include: { teams: { include: { users: { include: { user: true } } } } };
    }>,
    guild: Guild,
) {
    DebugUtils.debug(`[Init Draft] initializing draft for match ${match.id}`);

    const categoryChannel = guild.channels.cache.find(
        (c) => c.name === categoryChannelName,
    ) as CategoryChannel | undefined;

    const mapTeamUsersToPermissionOverwrites = (
        users: (MatchUser & { user: User })[],
    ) => {
        return [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: guild.members.me?.id || '',
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            ...users.map((u) => ({
                id: u.user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            })),
        ];
    };

    const team1Channel = await guild.channels.create({
        name: `${match.id}-team-1`,
        parent: categoryChannel,
        type: ChannelType.GuildText,
        permissionOverwrites: mapTeamUsersToPermissionOverwrites(
            match.teams[0].users,
        ),
    });

    const team2Channel = await guild.channels.create({
        name: `${match.id}-team-2`,
        parent: categoryChannel,
        type: ChannelType.GuildText,
        permissionOverwrites: mapTeamUsersToPermissionOverwrites(
            match.teams[1].users,
        ),
    });

    await prisma.match.update({
        where: { id: match.id },
        data: {
            state: 'DRAFT',
            team1Channel: team1Channel.id,
            team2Channel: team2Channel.id,
        },
    });

    const draftEmbed = buildDraftEmbed(match, guild);

    await team1Channel.send({ embeds: [draftEmbed] });
    await team2Channel.send({ embeds: [draftEmbed] });
}

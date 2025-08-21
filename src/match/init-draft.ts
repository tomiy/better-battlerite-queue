import {
    CategoryChannel,
    ChannelType,
    EmbedBuilder,
    Guild,
    PermissionsBitField,
    userMention,
} from 'discord.js';
import {
    Guild as dbGuild,
    Match,
    MatchTeam,
    MatchUser,
    User,
} from '../../.prisma';
import { categoryChannelName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';

type MatchTeamWithUsers = MatchTeam & { users: (MatchUser & { user: User })[] };
type MatchWithTeams = Match & { teams: MatchTeamWithUsers[] };

export async function initDraft(
    match: MatchWithTeams,
    dbGuild: dbGuild,
    guild: Guild,
) {
    DebugUtils.debug(`[Init Draft] initializing draft for match ${match.id}`);

    const categoryChannel = guild.channels.cache.find(
        (c) => c.name === categoryChannelName,
    ) as CategoryChannel | undefined;

    const team1Channel = await guild.channels.create({
        name: `${match.id}-team-1`,
        parent: categoryChannel,
        type: ChannelType.GuildText,
        permissionOverwrites: [
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
            {
                id: match.teams[0].users[0].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: match.teams[0].users[1].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: match.teams[0].users[2].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
        ],
    });

    const team2Channel = await guild.channels.create({
        name: `${match.id}-team-2`,
        parent: categoryChannel,
        type: ChannelType.GuildText,
        permissionOverwrites: [
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
            {
                id: match.teams[1].users[0].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: match.teams[1].users[1].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: match.teams[1].users[2].user.userDiscordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
        ],
    });

    await prisma.match.update({
        where: { id: match.id },
        data: {
            state: 'DRAFT',
            team1Channel: team1Channel.id,
            team2Channel: team2Channel.id,
        },
    });

    const matchEmbed = new EmbedBuilder()
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

    await team1Channel.send({ embeds: [matchEmbed] });
    await team2Channel.send({ embeds: [matchEmbed] });
}

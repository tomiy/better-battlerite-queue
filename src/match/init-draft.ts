import {
    CategoryChannel,
    ChannelType,
    Guild,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import { MatchUser, User, Guild as dbGuild } from '../../.prisma';
import { categoryChannelName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { sendDraftUI } from './build-draft-ui';

export async function initDraft(
    matchId: number,
    guild: Guild,
    dbGuild: dbGuild,
) {
    DebugUtils.debug(`[Init Draft] initializing draft for match ${matchId}`);

    const match = await prisma.match.findFirstOrThrow({
        where: { id: matchId },
        include: {
            draftSequence: true,
            teams: { include: { users: { include: { user: true } } } },
        },
    });

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

    const teamChannels: TextChannel[] = [];
    for (const team of match.teams) {
        const teamChannel = await guild.channels.create({
            name: `match-${matchId}-team-${team.order + 1}`,
            parent: categoryChannel,
            type: ChannelType.GuildText,
            permissionOverwrites: mapTeamUsersToPermissionOverwrites(
                team.users,
            ),
        });

        teamChannels.push(teamChannel);

        await prisma.matchTeam.update({
            where: { id: team.id },
            data: {
                teamChannel: teamChannel.id,
            },
        });
    }

    await prisma.match.update({
        where: { id: match.id },
        data: {
            state: 'DRAFT',
        },
    });

    await sendDraftUI(match.id, guild, dbGuild, teamChannels);
}

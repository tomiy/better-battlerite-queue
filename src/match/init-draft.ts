import {
    CategoryChannel,
    ChannelType,
    Guild,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import { MatchUser, User } from '../../.prisma';
import { categoryChannelName, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { buildDraftUI } from './build-draft-ui';

export async function initDraft(matchId: number, guild: Guild) {
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
    for (const team in match.teams) {
        const teamChannel = await guild.channels.create({
            name: `${matchId}-team-${team + 1}`,
            parent: categoryChannel,
            type: ChannelType.GuildText,
            permissionOverwrites: mapTeamUsersToPermissionOverwrites(
                match.teams[team].users,
            ),
        });

        teamChannels.push(teamChannel);

        await prisma.matchTeam.update({
            where: { id: match.teams[team].id },
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

    const draftUI = buildDraftUI(match, guild);

    teamChannels.forEach(async (tc) => await tc.send(draftUI));
}

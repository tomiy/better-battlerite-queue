import {
    CategoryChannel,
    ChannelType,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import { MatchPlayer, Member } from '../../../.prisma';
import { categoryChannelName, client } from '../../config';
import { DebugUtils } from '../../debug-utils';
import { MatchRepository } from '../../repository/match.repository';
import { sendDraftUI } from './send-draft-ui';
import { sendPlayerUI } from './send-player-ui';

export async function initDraft(match: MatchRepository) {
    DebugUtils.debug(
        `[Init Draft] initializing draft for match ${match.data.id}`,
    );

    const guild = client.guilds.cache.get(match.data.guild.discordId);

    if (!guild) {
        throw new Error(`[Init Draft] No guild for match ${match.data.id}`);
    }

    const categoryChannel = guild.channels.cache.find(
        (c) => c.name === categoryChannelName,
    ) as CategoryChannel | undefined;

    const mapPlayersToPermissionOverwrites = (
        players: (MatchPlayer & { member: Member })[],
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
            ...players.map((u) => ({
                id: u.member.discordId,
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
            name: `match-${match.data.id}-team-${team.order + 1}`,
            parent: categoryChannel,
            type: ChannelType.GuildText,
            permissionOverwrites: mapPlayersToPermissionOverwrites(
                team.players,
            ),
        });

        teamChannels.push(teamChannel);

        await match.updateTeam(team.id, { teamChannel: teamChannel.id });

        await sendPlayerUI(team, teamChannel, guild);
    }

    await match.update({ state: 'DRAFT' });

    await sendDraftUI(match, teamChannels);
}

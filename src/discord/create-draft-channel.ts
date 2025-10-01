import {
    CategoryChannel,
    ChannelType,
    PermissionsBitField,
    RepliableInteraction,
} from 'discord.js';
import { categoryChannelName } from '../config/defaults';
import {
    MatchPlayerWithProfile,
    TeamWithPlayers,
} from '../core/data-types.type';

export async function createDraftChannel(
    interaction: RepliableInteraction,
    team: TeamWithPlayers,
) {
    const guild = interaction.guild;

    if (!guild) {
        throw new Error('No guild for interaction');
    }

    const categoryChannel = guild.channels.cache.find(
        (c) => c.name === categoryChannelName,
    ) as CategoryChannel | undefined;

    const mapPlayersToPermissionOverwrites = (
        players: MatchPlayerWithProfile[],
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
                id: u.serverGameProfile.discordId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            })),
        ];
    };

    await guild.members.fetch({
        user: team.players.map((u) => u.serverGameProfile.discordId),
    });

    const teamChannel = await guild.channels.create({
        name: `match-${team.matchId}-team-${team.order + 1}`,
        parent: categoryChannel,
        type: ChannelType.GuildText,
        permissionOverwrites: mapPlayersToPermissionOverwrites(team.players),
    });

    if (!teamChannel) {
        throw new Error('Could not create team channel');
    }

    return teamChannel;
}

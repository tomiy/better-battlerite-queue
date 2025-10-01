import { Guild } from 'discord.js';
import { Server } from '../../.prisma';
import { matchManager } from '../config/state';
import { DebugUtils } from '../debug.utils';
import { buildMatchEmbed } from './embed/build-match-embed';

export async function cleanupMatchVisuals(
    matchId: number,
    server: Server,
    guild: Guild,
) {
    const match = await matchManager.getFullMatch(matchId);

    if (match) {
        for (const team of match.teams) {
            for (const player of team.players) {
                const member = await guild.members.fetch(
                    player.serverGameProfile.discordId,
                );

                if (!member) {
                    DebugUtils.warning(
                        `No matching member for player id ${player.id}`,
                    );
                }

                if (server.matchRoleId) {
                    await member.roles.remove(server.matchRoleId);
                } else {
                    DebugUtils.warning('No match role configured');
                }
            }

            if (team.draftChannelId) {
                try {
                    const draftChannel = await guild.channels.fetch(
                        team.draftChannelId,
                    );

                    if (draftChannel) {
                        await draftChannel.delete();
                    }
                } catch (e) {
                    DebugUtils.warning(e);
                }
            }
        }

        const matchEmbed = await buildMatchEmbed(match.id, guild);

        if (server.matchHistoryChannelId) {
            const matchHistoryChannel = await guild.channels.fetch(
                server.matchHistoryChannelId,
            );

            if (!matchHistoryChannel || !matchHistoryChannel.isTextBased()) {
                DebugUtils.warning(
                    `History channel not found for match ${match.id}!`,
                );
                return;
            }

            if (match.historyMessageId) {
                try {
                    const historyMessage =
                        await matchHistoryChannel.messages.fetch(
                            match.historyMessageId,
                        );

                    if (historyMessage) {
                        await historyMessage.edit({
                            embeds: [matchEmbed],
                            components: [],
                        });
                    }
                } catch (e) {
                    DebugUtils.warning(`Message not found: ${e}`);
                }
            } else {
                const historyMessage = await matchHistoryChannel.send({
                    embeds: [matchEmbed],
                    components: [],
                });

                await matchManager.updateHistoryMessage(
                    match.id,
                    historyMessage.id,
                );
            }
        }
    }
}

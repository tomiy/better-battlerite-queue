import {
    ActionRowBuilder,
    EmbedBuilder,
    Guild,
    MessageActionRowComponentBuilder,
} from 'discord.js';
import { Server } from '../../../../.prisma';
import { matchManager, matchTeamManager } from '../../../config/state';
import { FullTeam } from '../../../core/data-types.type';
import { DebugUtils } from '../../../debug.utils';
import { buildMatchEmbed } from '../../embed/build-match-embed';
import { buildReportUI } from './build-report-ui';

export async function updateReportUI(
    matchId: number,
    server: Server,
    guild: Guild,
) {
    const match = await matchManager.getFullMatch(matchId);

    if (!match) {
        throw new Error(`No matching match for id ${matchId}`);
    }

    const matchEmbed = await buildMatchEmbed(matchId, guild);
    const reportUI = await buildReportUI(matchId, 0);

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
                const historyMessage = await matchHistoryChannel.messages.fetch(
                    match.historyMessageId,
                );

                if (historyMessage) {
                    await historyMessage.edit({
                        embeds: [matchEmbed],
                        components: reportUI,
                    });
                }
            } catch (e) {
                DebugUtils.warning(`Message not found: ${e}`);
            }
        } else {
            const historyMessage = await matchHistoryChannel.send({
                embeds: [matchEmbed],
                components: reportUI,
            });

            await matchManager.updateHistoryMessage(
                match.id,
                historyMessage.id,
            );
        }
    }

    for (const team of match.teams) {
        await updateTeamReportUI(team, matchEmbed, reportUI, guild);
    }
}

async function updateTeamReportUI(
    team: FullTeam,
    matchEmbed: EmbedBuilder,
    reportUI: ActionRowBuilder<MessageActionRowComponentBuilder>[],
    guild: Guild,
) {
    if (team.draftChannelId) {
        const draftChannel = await guild.channels.fetch(team.draftChannelId);

        if (!draftChannel || !draftChannel.isTextBased()) {
            DebugUtils.warning(`Draft channel not found for team ${team.id}!`);
            return;
        }

        if (team.draftMessageId) {
            try {
                const draftMessage = await draftChannel.messages.fetch(
                    team.draftMessageId,
                );

                if (draftMessage) {
                    await draftMessage.edit({
                        embeds: [matchEmbed],
                        components: reportUI,
                    });
                }
            } catch (e) {
                DebugUtils.warning(`Message not found: ${e}`);
            }
        } else {
            const newDraftMessage = await draftChannel.send({
                embeds: [matchEmbed],
                components: reportUI,
            });

            await matchTeamManager.updateDraftMessage(
                team.id,
                newDraftMessage.id,
            );
        }
    }
}

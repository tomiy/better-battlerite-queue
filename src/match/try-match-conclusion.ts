import { Message, TextChannel } from 'discord.js';
import { client, prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { MatchRepository } from '../repository/match.repository';
import { buildMatchEmbed } from './build-match-embed';
import { computeRatingChanges } from './rating-functions';

export async function tryMatchConclusion(
    match: MatchRepository,
    reportUIMessages: Message<true>[] = [],
) {
    const guild = client.guilds.cache.get(match.data.guild.discordId);

    if (!guild) {
        throw new Error(
            `[Match Conclusion] No guild for match ${match.data.id}`,
        );
    }

    let updated = false;

    if (match.dropReportCount > match.players.length / 2) {
        DebugUtils.debug(
            `[Match Conclusion] Majority vote for dropping match ${match.data.id}`,
        );

        await match.update({ state: 'DROPPED' });

        updated = true;
    }

    for (const [teamNumber, count] of match.winReportCounts) {
        if (teamNumber > -1 && count > match.players.length / 2) {
            DebugUtils.debug(
                `[Match Conclusion] Majority vote for team ${teamNumber + 1} in match ${match.data.id}`,
            );

            const updatedPlayers = computeRatingChanges(
                match.teams,
                teamNumber,
            );

            for (const updatedPlayer of updatedPlayers) {
                const player = await match.updatePlayer(updatedPlayer.id, {
                    ratingChange: updatedPlayer.ratingChange,
                });

                await prisma.member.update({
                    where: { id: player.memberId },
                    data: {
                        elo: player.member.elo + player.ratingChange,
                    },
                });
            }

            match.update({ state: 'FINISHED', teamWin: teamNumber });

            updated = true;
        }
    }

    if (updated) {
        const updatedEmbed = buildMatchEmbed(match);

        if (!reportUIMessages.length) {
            const matchHistoryChannel = guild.channels.resolve(
                match.data.guild.matchHistoryChannel || '',
            );

            if (matchHistoryChannel instanceof TextChannel) {
                if (!match.data.historyMessage) {
                    const historyMessage = await matchHistoryChannel.send({
                        embeds: [updatedEmbed],
                        components: [],
                    });
                    await match.update({
                        historyMessage: historyMessage.id,
                    });
                } else {
                    const historyMessage =
                        await matchHistoryChannel.messages.fetch(
                            match.data.historyMessage,
                        );

                    if (historyMessage) {
                        historyMessage.edit({
                            embeds: [updatedEmbed],
                            components: [],
                        });
                    }
                }
            }
        }

        for (const message of reportUIMessages) {
            await message.edit({ embeds: [updatedEmbed], components: [] });
        }

        for (const team of match.teams) {
            for (const player of team.players) {
                await guild.members.cache
                    .get(player.member.discordId)
                    ?.roles.remove(match.data.guild.matchRole || '');
            }

            await guild.channels.delete(team.teamChannel || '');
        }

        MatchRepository.discard(match.data.id);
    } else {
        DebugUtils.debug(
            `[Match Conclusion] No majority votes for match ${match.data.id}`,
        );
    }
}

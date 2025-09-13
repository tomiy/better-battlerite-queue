import { ComponentType, Message, MessageFlags, TextChannel } from 'discord.js';
import { client } from '../../config';
import { tempReply } from '../../interaction-utils';
import { MatchRepository } from '../../repository/match.repository';
import { buildMatchEmbed } from '../build-match-embed';
import { buildReportButtons } from '../build-match-ui';
import { tryMatchConclusion } from '../try-match-conclusion';

export async function sendReportUI(
    match: MatchRepository,
    teamChannels: TextChannel[],
) {
    const guild = client.guilds.cache.get(match.data.guild.discordId);

    if (!guild) {
        throw new Error(`[Report UI] No guild for match ${match.data.id}`);
    }

    await match.update({ state: 'ONGOING' });

    const mainEmbed = buildMatchEmbed(match);
    const reportButtons = buildReportButtons(match.teams.length);

    const reportUIMessages: Message<true>[] = [];

    for (const tc of teamChannels) {
        reportUIMessages.push(
            await tc.send({ embeds: [mainEmbed], components: [reportButtons] }),
        );
    }

    const matchHistoryChannel = guild.channels.resolve(
        match.data.guild.matchHistoryChannel || '',
    );

    if (matchHistoryChannel instanceof TextChannel) {
        const historyMessage = await matchHistoryChannel.send({
            embeds: [mainEmbed],
            components: [reportButtons],
        });
        reportUIMessages.push(historyMessage);

        await match.update({ historyMessage: historyMessage.id });
    }

    for (const reportMessage of reportUIMessages) {
        const buttonCollector = reportMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        buttonCollector?.on('collect', async (i) => {
            await i.deferReply({ flags: MessageFlags.Ephemeral });

            const matchingPlayer = match.players.find(
                (u) => u.member.discordId === i.member.id,
            );
            if (matchingPlayer) {
                if (i.customId === 'reportButtonDrop') {
                    await match.updatePlayer(matchingPlayer.id, {
                        teamWinReport: null,
                        dropReport: true,
                    });
                } else {
                    const teamWinReport = parseInt(
                        i.customId.replace(/[^0-9]/g, ''),
                    );

                    await match.updatePlayer(matchingPlayer.id, {
                        teamWinReport: teamWinReport,
                        dropReport: false,
                    });
                }

                const updatedEmbed = buildMatchEmbed(match);

                for (const message of reportUIMessages) {
                    await message.edit({
                        embeds: [updatedEmbed],
                        components: [reportButtons],
                    });
                }

                await tempReply(i, 'Vote registered!');

                await tryMatchConclusion(match, reportUIMessages);

                return;
            }

            await tempReply(i, 'You are not in this match!');
        });
    }
}

import { ComponentType, Guild, Message, TextChannel } from 'discord.js';
import { Guild as dbGuild } from '../../../.prisma';
import { prisma } from '../../config';
import { tempReply } from '../../interaction-utils';
import { buildMatchEmbed } from '../build-match-embed';
import { buildReportButtons } from '../build-match-ui';
import { fullMatchInclude } from '../match.type';
import { tryMatchConclusion } from '../try-match-conclusion';

export async function sendReportUI(
    matchId: number,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
) {
    const match = await prisma.match.update({
        where: { id: matchId },
        data: { state: 'ONGOING' },
        include: fullMatchInclude,
    });

    const mainEmbed = buildMatchEmbed(match, guild);
    const reportButtons = buildReportButtons(match.teams.length);

    const reportUIMessages: Message<true>[] = [];

    for (const tc of teamChannels) {
        reportUIMessages.push(
            await tc.send({ embeds: [mainEmbed], components: [reportButtons] }),
        );
    }

    const matchHistoryChannel = guild.channels.resolve(
        dbGuild.matchHistoryChannel || '',
    );

    if (matchHistoryChannel instanceof TextChannel) {
        const historyMessage = await matchHistoryChannel.send({
            embeds: [mainEmbed],
            components: [reportButtons],
        });
        reportUIMessages.push(historyMessage);

        await prisma.match.update({
            where: { id: matchId },
            data: { matchHistoryMessage: historyMessage.id },
        });
    }

    const allPlayers = match.teams.flatMap((t) => t.players);

    for (const reportMessage of reportUIMessages) {
        const buttonCollector = reportMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        buttonCollector?.on('collect', async (i) => {
            const matchingPlayer = allPlayers.find(
                (u) => u.member.discordId === i.member.id,
            );
            if (matchingPlayer) {
                if (i.customId === 'reportButtonDrop') {
                    await prisma.matchPlayer.update({
                        where: { id: matchingPlayer.id },
                        data: { teamWinReport: null, dropReport: true },
                    });
                } else {
                    const teamWinReport = parseInt(
                        i.customId.replace(/[^0-9]/g, ''),
                    );

                    await prisma.matchPlayer.update({
                        where: { id: matchingPlayer.id },
                        data: {
                            teamWinReport: teamWinReport,
                            dropReport: false,
                        },
                    });
                }

                const updatedMatch = await prisma.match.findFirstOrThrow({
                    where: { id: match.id },
                    include: fullMatchInclude,
                });

                const updatedEmbed = buildMatchEmbed(updatedMatch, guild);

                for (const message of reportUIMessages) {
                    await message.edit({
                        embeds: [updatedEmbed],
                        components: [reportButtons],
                    });
                }

                tempReply(i, 'Vote registered!');

                await tryMatchConclusion(
                    updatedMatch,
                    guild,
                    dbGuild,
                    reportUIMessages,
                );

                return;
            }

            tempReply(i, 'You are not in this match!');
        });
    }
}

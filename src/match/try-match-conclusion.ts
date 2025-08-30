import { Guild, Message } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { buildMatchEmbed } from './build-match-embed';
import { computeRatingChanges } from './compute-rating-changes';
import { FullMatch, fullMatchInclude } from './match.type';

export async function tryMatchConclusion(
    match: FullMatch,
    guild: Guild,
    dbGuild: dbGuild,
    reportUIMessages: Message<true>[],
) {
    const players = match.teams.flatMap((t) => t.players);
    const winReports = Object.groupBy(players, (u) =>
        u.teamWinReport !== null ? u.teamWinReport : -1,
    );
    const dropReportCount = players
        .map((u) => u.dropReport)
        .filter((r) => r === true).length;

    let updated: FullMatch | null = null;

    if (dropReportCount > players.length / 2) {
        DebugUtils.debug(
            `[Match Conclusion] Majority vote for dropping match ${match.id}`,
        );

        updated = await prisma.match.update({
            where: { id: match.id },
            data: { state: 'DROPPED' },
            include: fullMatchInclude,
        });
    }

    for (const [teamNumber, reports] of Object.entries(winReports)) {
        if (
            parseInt(teamNumber) > -1 &&
            reports &&
            reports.length > players.length / 2
        ) {
            DebugUtils.debug(
                `[Match Conclusion] Majority vote for team ${parseInt(teamNumber) + 1} in match ${match.id}`,
            );

            const updatedPlayers = computeRatingChanges(
                match.teams,
                parseInt(teamNumber),
            );

            for (const updatedPlayer of updatedPlayers) {
                const player = await prisma.matchPlayer.update({
                    where: { id: updatedPlayer.id },
                    data: { ratingChange: updatedPlayer.ratingChange },
                    include: { member: true },
                });

                await prisma.member.update({
                    where: { id: player.memberId },
                    data: {
                        elo: player.member.elo + player.ratingChange,
                    },
                });
            }

            updated = await prisma.match.update({
                where: { id: match.id },
                data: { state: 'FINISHED', teamWin: parseInt(teamNumber) },
                include: fullMatchInclude,
            });
        }
    }

    if (updated) {
        const updatedEmbed = buildMatchEmbed(updated, guild);

        for (const message of reportUIMessages) {
            await message.edit({ embeds: [updatedEmbed], components: [] });
        }

        for (const team of match.teams) {
            for (const player of team.players) {
                await guild.members.cache
                    .get(player.member.discordId)
                    ?.roles.remove(dbGuild.matchRole || '');
            }

            await guild.channels.delete(team.teamChannel || '');
        }
    } else {
        DebugUtils.debug(
            `[Match Conclusion] No majority votes for match ${match.id}`,
        );
    }
}

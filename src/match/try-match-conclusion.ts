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
    const matchUsers = match.teams.flatMap((t) => t.users);
    const winReports = Object.groupBy(matchUsers, (u) =>
        u.teamWinReport !== null ? u.teamWinReport : -1,
    );
    const dropReportCount = matchUsers
        .map((u) => u.dropReport)
        .filter((r) => r === true).length;

    let updated = null;

    if (dropReportCount > matchUsers.length / 2) {
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
            reports.length > matchUsers.length / 2
        ) {
            DebugUtils.debug(
                `[Match Conclusion] Majority vote for team ${parseInt(teamNumber) + 1} in match ${match.id}`,
            );

            const updatedUsers = computeRatingChanges(
                match.teams,
                parseInt(teamNumber),
            );

            for (const updatedUser of updatedUsers) {
                const matchUser = await prisma.matchUser.update({
                    where: { id: updatedUser.id },
                    data: { ratingChange: updatedUser.ratingChange },
                    include: { user: true },
                });

                await prisma.user.update({
                    where: { id: matchUser.userId },
                    data: { elo: matchUser.user.elo + matchUser.ratingChange },
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
            for (const user of team.users) {
                await guild.members.cache
                    .get(user.user.userDiscordId)
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

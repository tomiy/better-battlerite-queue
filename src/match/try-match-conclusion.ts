import { Guild, Message } from 'discord.js';
import { Prisma, Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { buildMatchEmbed } from './build-match-embed';
import { computeRatingChanges } from './compute-rating-changes';

export async function tryMatchConclusion(
    match: Prisma.MatchGetPayload<{
        include: {
            map: true;
            teams: {
                include: {
                    users: { include: { user: true } };
                    bans: { include: { champion: true } };
                    picks: { include: { champion: true } };
                };
            };
        };
    }>,
    guild: Guild,
    dbGuild: dbGuild,
    reportUIMessages: Message<true>[],
) {
    const matchUsers = match.teams.flatMap((t) => t.users);
    const winReports = Object.groupBy(matchUsers, (u) => u.teamWinReport || -1);
    const dropReportCount = matchUsers
        .map((u) => u.dropReport)
        .filter((r) => r === true).length;

    let updated = null;

    if (dropReportCount > matchUsers.length / 2) {
        updated = await prisma.match.update({
            where: { id: match.id },
            data: { state: 'DROPPED' },
            include: {
                map: true,
                teams: {
                    include: {
                        users: { include: { user: true } },
                        bans: { include: { champion: true } },
                        picks: { include: { champion: true } },
                    },
                },
            },
        });
    }

    for (const [teamNumber, reports] of Object.entries(winReports)) {
        if (
            parseInt(teamNumber) > -1 &&
            reports &&
            reports.length > matchUsers.length / 2
        ) {
            const updatedUsers = computeRatingChanges(
                match.teams,
                parseInt(teamNumber),
            );

            updated = await prisma.match.update({
                where: { id: match.id },
                data: { state: 'FINISHED', teamWin: parseInt(teamNumber) },
                include: {
                    map: true,
                    teams: {
                        include: {
                            users: { include: { user: true } },
                            bans: { include: { champion: true } },
                            picks: { include: { champion: true } },
                        },
                    },
                },
            });

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
        }
    }

    if (updated) {
        const updatedEmbed = buildMatchEmbed(updated, guild);

        for (const message of reportUIMessages) {
            await message.edit({
                embeds: [updatedEmbed],
            });
        }

        for (const team of match.teams) {
            for (const user of team.users) {
                await guild.members.cache
                    .get(user.user.userDiscordId)
                    ?.roles.remove(dbGuild.matchRole || '');
            }
        }
    }
}

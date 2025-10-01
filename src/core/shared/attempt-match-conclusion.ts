import {
    CommandContext,
    ensureContext,
} from '../../command/command-context.type';
import {
    matchBalanceManager,
    matchManager,
    matchPlayerManager,
    profileManager,
} from '../../config/state';
import { DebugUtils } from '../../debug.utils';
import { RatingData } from '../data-types.type';
import { cleanupMatchVisuals } from '../../discord/cleanup-match-embeds';
import { updateReportUI } from '../../discord/ui/report/update-report-ui';

export async function attemptMatchConclusion(context: CommandContext) {
    ensureContext(context, ['guild', 'server', 'match']);

    const updatedMatch = await matchManager.getFullMatch(context.match.id);

    if (!updatedMatch) {
        throw new Error(
            `Could not find updated match with id ${context.match.id}`,
        );
    }

    const players = updatedMatch.teams.flatMap((t) => t.players);

    const winReports = new Map(
        Object.entries(
            Object.groupBy(players, (p) =>
                p.winReport !== null ? p.winReport : -1,
            ),
        ).map(([k, v]) => [parseInt(k), v?.length || 0]),
    );

    for (const [teamNumber, count] of winReports) {
        if (teamNumber > -1 && count > players.length / 2) {
            DebugUtils.debug(
                `Majority vote for team ${teamNumber + 1} in match ${updatedMatch.id}`,
            );

            const teamRatingData: RatingData[] = [];
            for (const team of updatedMatch.teams) {
                const ratings = await profileManager.getTeamRatings(
                    [team],
                    updatedMatch,
                );

                teamRatingData.push({ team, ratings });
            }

            const updatedRatingData = matchBalanceManager.computeRatingChanges(
                teamRatingData,
                teamNumber,
            );

            for (const teamRatingData of updatedRatingData) {
                for (let i = 0; i < teamRatingData.ratings.length; i++) {
                    const player = teamRatingData.team.players[i];
                    const playerRating = teamRatingData.ratings[i];
                    const updatedPlayer =
                        await matchPlayerManager.setRatingChange(
                            player.id,
                            player.ratingChange,
                        );

                    if (updatedPlayer) {
                        await profileManager.computeRating(
                            playerRating.rating,
                            player.ratingChange,
                        );
                    }
                }
            }

            await matchManager.finishMatch(updatedMatch.id, teamNumber);

            await cleanupMatchVisuals(
                context.match.id,
                context.server,
                context.guild,
            );

            return;
        }
    }

    await updateReportUI(updatedMatch.id, context.server, context.guild);
}

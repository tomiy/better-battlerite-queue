import {
    CommandContext,
    ensureContext,
} from '../../command/command-context.type';
import { matchManager } from '../../config/state';
import { DebugUtils } from '../../debug.utils';
import { cleanupMatchVisuals } from '../../discord/cleanup-match-embeds';

export async function attemptMatchDrop(context: CommandContext) {
    ensureContext(context, ['server', 'guild', 'match']);

    const updatedMatch = await matchManager.getFullMatch(context.match.id);

    if (!updatedMatch) {
        throw new Error(
            `Could not find updated match with id ${context.match.id}`,
        );
    }

    const players = updatedMatch.teams.flatMap((t) => t.players);

    const dropReportCount = players.filter((p) => p.dropReport).length;

    if (dropReportCount > players.length / 2) {
        DebugUtils.debug(`Majority vote for dropping match ${updatedMatch.id}`);

        await matchManager.dropMatch(updatedMatch.id);

        await cleanupMatchVisuals(
            updatedMatch.id,
            context.server,
            context.guild,
        );

        return true;
    }

    return false;
}

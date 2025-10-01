import { RepliableInteraction } from 'discord.js';
import {
    CommandContext,
    ensureContext,
} from '../../command/command-context.type';
import {
    matchManager,
    matchPlayerManager,
    matchTeamManager,
    queueManager,
    regionManager,
} from '../../config/state';
import { ServerGameRegion } from '../../../.prisma';
import { QueueEntryWithData } from '../data-types.type';
import { DebugUtils } from '../../debug.utils';
import { attemptMatchLaunch } from './attempt-match-launch';
import { matchingMatch } from '../../command/guard/match/matching-match.guard';
import { tempReply } from '../../discord/interaction.utils';

export async function attemptQueueMatchCreation(
    interaction: RepliableInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['guild', 'server', 'serverGame', 'gameMode']);

    const draftSequence = context.gameMode.draftSequence;

    if (!draftSequence) {
        await tempReply(
            interaction,
            `No draft sequence found for game mode ${context.gameMode.name}!`,
        );
        return;
    }

    const availableRegions = await regionManager.findGameRegions(
        context.serverGame.id,
    );

    const queueEntries = await queueManager.getQueueEntriesForMode(
        context.gameMode.id,
    );

    const entriesByRegion: Map<ServerGameRegion, QueueEntryWithData[]> =
        new Map();

    availableRegions.forEach((region) => {
        if (!entriesByRegion.has(region)) {
            entriesByRegion.set(region, []);
        }

        queueEntries.forEach((entry) => {
            if (
                entry.serverGameProfile.regions
                    .map((r) => r.serverGameRegionId)
                    .includes(region.id)
            ) {
                entriesByRegion.get(region)?.push(entry);
            }
        });
    });

    const eligibleEntries = [...entriesByRegion.values()].find(
        (u) => u.length >= context.gameMode.teamCount * draftSequence.teamSize,
    );

    if (!eligibleEntries) {
        DebugUtils.debug(
            '[Match Creation] Not enough entries grouped by region to create match',
        );
        return;
    }

    const createdMatch = await matchManager.createMatch(
        context.gameMode,
        false,
    );

    if (createdMatch) {
        for (const eligibleEntry of eligibleEntries) {
            const validNextTeam = await matchTeamManager.findNextValidTeam(
                createdMatch.id,
            );

            if (validNextTeam) {
                const eligibleEntryMember = await context.guild.members.fetch(
                    eligibleEntry.serverGameProfile.discordId,
                );

                await queueManager.deleteQueueEntries(
                    context.server,
                    eligibleEntryMember,
                );

                await matchPlayerManager.joinMatch(
                    eligibleEntryMember,
                    context.server,
                    validNextTeam.id,
                    eligibleEntry.serverGameProfile.id,
                );
            }
        }

        context.matchId = createdMatch.id;
        await matchingMatch(interaction, context);

        await attemptMatchLaunch(interaction, context, draftSequence);
    }
}

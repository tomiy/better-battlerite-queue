import { RepliableInteraction } from 'discord.js';
import { DraftStepType } from '../../../.prisma';
import {
    CommandContext,
    ensureContext,
} from '../../command/command-context.type';
import {
    matchBalanceManager,
    matchManager,
    matchTeamManager,
    profileManager,
} from '../../config/state';
import { createDraftChannel } from '../../discord/create-draft-channel';
import { updateDraftUI } from '../../discord/ui/draft/update-draft-ui';
import { DraftSequenceWithSteps } from '../data-types.type';
import { buildPlayerEmbed } from '../../discord/embed/build-player-embed';
import { DebugUtils } from '../../debug.utils';

export async function attemptMatchLaunch(
    interaction: RepliableInteraction,
    context: CommandContext,
    draftSequence: DraftSequenceWithSteps,
) {
    ensureContext(context, ['guild', 'member', 'match', 'profile']);

    const nextTeam = await matchTeamManager.findNextValidTeam(context.match.id);

    if (!nextTeam) {
        const matchTeams = await matchTeamManager.findTeams(context.match.id);

        if (!matchTeams.length) {
            throw new Error(
                `Could not find teams for match with match id ${context.match.id}`,
            );
        }

        const playersWithRatings = await profileManager.getTeamRatings(
            matchTeams,
            context.match,
        );

        await matchManager.initDraft(context.match.id);

        await matchBalanceManager.balanceTeams(
            draftSequence,
            matchTeams,
            playersWithRatings,
        );

        const isPlayerDraft = draftSequence.steps.find(
            (s) => s.type === DraftStepType.PLAYER_PICK,
        );

        const isTerrainDraft = draftSequence.steps.find(
            (s) => s.type === DraftStepType.TERRAIN_PICK,
        );

        if (!isTerrainDraft) {
            const terrain = await matchBalanceManager.pickRandomTerrain(
                context.match,
            );

            if (!terrain) {
                throw new Error('Could not pick random terrain!');
            }

            await matchManager.setTerrain(context.match.id, terrain.id);
        }

        for (const team of matchTeams) {
            if (isPlayerDraft) {
                team.players = team.players.filter((p) => p.captain);
            }

            const teamChannel = await createDraftChannel(interaction, team);
            await matchTeamManager.setDraftChannel(team.id, teamChannel.id);

            const playerCardsToDisplay = isPlayerDraft
                ? matchTeams.flatMap((t) => t.players.filter((p) => !p.captain))
                : team.players;
            for (const player of playerCardsToDisplay) {
                const matchingRating = playersWithRatings.find(
                    (pr) =>
                        pr.rating.serverGameProfileId ===
                        player.serverGameProfileId,
                );

                if (!matchingRating) {
                    DebugUtils.warning(
                        `No matching rating for player ${player.id}`,
                    );
                    continue;
                }

                const playerEmbed = buildPlayerEmbed(
                    context.guild,
                    player.serverGameProfile,
                    matchingRating.rating,
                );
                await teamChannel.send({ embeds: [playerEmbed] });
            }
        }

        await updateDraftUI(context.match.id, 0, context.guild);
    }
}

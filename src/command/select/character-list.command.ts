import { AnySelectMenuInteraction, MessageFlags } from 'discord.js';
import { draftManager, matchManager } from '../../config/state';
import { tempReply } from '../../discord/interaction.utils';
import { updateDraftUI } from '../../discord/ui/draft/update-draft-ui';
import { updateReportUI } from '../../discord/ui/report/update-report-ui';
import { SelectCommand } from '../command';
import { CommandContext, ensureContext } from '../command-context.type';
import { botSync } from '../guard/bot/bot-sync.guard';
import { matchingMatch } from '../guard/match/matching-match.guard';
import { matchingMember } from '../guard/member/matching-member.guard';
import { matchingTeam } from '../guard/match/matching-team.guard';
import { isCaptain } from '../guard/match/is-captain.guard';
import { clearCaptainClaimTimeouts } from '../button/draft/draft-claim-captain.command';

async function execute(
    interaction: AnySelectMenuInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'guild',
        'server',
        'matchId',
        'teamId',
        'match',
        'member',
        'team',
    ]);

    clearCaptainClaimTimeouts(context.teamId);

    const draftSequence = context.match.gameMode.draftSequence;

    if (!draftSequence) {
        await tempReply(
            interaction,
            `No matching sequence for match ${context.match.id}`,
        );
        return;
    }

    const draftStepData = draftManager.getDraftStepData(
        context.match.teams,
        draftSequence,
    );

    if (!draftStepData) {
        await tempReply(interaction, 'Draft is not ongoing!');
        return;
    }

    const { draftTeamNumber, draftStep, currentDraftActionNumber } =
        draftStepData;

    const currentRoundActions = context.match.teams.flatMap((t) =>
        t.draftActions.filter(
            (da) => da.order >= draftStep.order * context.match.teams.length,
        ),
    );

    if (currentRoundActions.find((cra) => cra.teamId === context.teamId)) {
        await tempReply(
            interaction,
            'An action is already registered for this round!',
        );
        return;
    }

    if (draftTeamNumber >= 0 && context.team.order !== draftTeamNumber) {
        await tempReply(interaction, 'It is not your turn to draft!');
        return;
    }

    const gameModeCharacterId = parseInt(interaction.values[0]);

    await draftManager.processDraftActionForStep(
        draftStep,
        context.teamId,
        context.match.teams.length,
        currentDraftActionNumber,
        {
            gameModeCharacterId,
        },
    );

    await tempReply(interaction, 'Draft action registered!');

    const updatedMatch = await matchManager.getFullMatch(context.match.id);

    if (!updatedMatch) {
        throw new Error(
            `Could not find updated match with id ${context.match.id}`,
        );
    }

    const nextDraftStepData = draftManager.getDraftStepData(
        updatedMatch.teams,
        draftSequence,
    );

    if (nextDraftStepData) {
        await updateDraftUI(context.matchId, context.teamId, context.guild);
    } else {
        await matchManager.setOngoing(context.matchId);
        await updateReportUI(context.matchId, context.server, context.guild);
    }
}

function populateContext(
    interaction: AnySelectMenuInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId, teamId] = options;

    context.matchId = parseInt(matchId);
    context.teamId = parseInt(teamId);
}

export const characterList: SelectCommand = {
    data: { name: 'characterList' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMatch, matchingMember, matchingTeam, isCaptain],
};

import { draftManager } from '../../../config/state';
import { tempReply } from '../../../discord/interaction.utils';
import { ButtonInteraction } from 'discord.js';
import { CommandContext, ensureContext } from '../../command-context.type';

export async function canUseDraftButton(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['match', 'team']);

    if (!context.match.gameMode.draftSequence) {
        throw new Error(`No matching sequence for match ${context.match.id}`);
    }

    const draftStepData = draftManager.getDraftStepData(
        context.match.teams,
        context.match.gameMode.draftSequence,
    );

    if (!draftStepData) {
        await tempReply(interaction, 'Draft is not ongoing!');
        return false;
    }

    const { draftTeamNumber } = draftStepData;

    if (draftTeamNumber >= 0 && context.team.order !== draftTeamNumber) {
        await tempReply(interaction, 'It is not your turn to draft!');
        return false;
    }

    return true;
}

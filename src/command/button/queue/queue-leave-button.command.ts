import { ButtonInteraction } from 'discord.js';
import { ButtonCommand, executeCommand } from '../../command';
import { CommandName } from '../../command-name.type';
import { CommandContext } from '../../command-context.type';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { leaveQueueShared } from '../../shared/queue-leave-shared.command';
import { matchingModeId } from '../../guard/game/matching-mode-id.guard';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await executeCommand(interaction, leaveQueueShared, context);
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [modeId] = options;

    context.modeId = parseInt(modeId);
}

export const leaveQueueButton: ButtonCommand = {
    data: { name: CommandName.QUEUE_LEAVE_BUTTON },
    populateContext: populateContext,
    execute: execute,
    guards: [matchingModeId, matchingMember],
};

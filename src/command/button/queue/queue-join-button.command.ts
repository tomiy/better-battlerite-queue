import { ButtonInteraction } from 'discord.js';
import { ButtonCommand, executeCommand } from '../../command';
import { joinQueueShared } from '../../shared/queue-join-shared.command';
import { CommandName } from '../../command-name.type';
import { CommandContext } from '../../command-context.type';
import { matchingModeId } from '../../guard/game/matching-mode-id.guard';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { matchingProfile } from '../../guard/member/matching-profile.guard';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await executeCommand(interaction, joinQueueShared, context);
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [modeId] = options;

    context.modeId = parseInt(modeId);
}

export const joinQueueButton: ButtonCommand = {
    data: { name: CommandName.QUEUE_JOIN_BUTTON },
    populateContext: populateContext,
    execute: execute,
    guards: [matchingModeId, matchingMember, matchingProfile],
};

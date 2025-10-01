import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandName } from '../../../command-name.type';
import { CommandContext } from '../../../command-context.type';
import { ChatInputSubcommand, executeCommand } from '../../../command';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { leaveQueueShared } from '../../../shared/queue-leave-shared.command';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.QUEUE_LEAVE)
    .setDescription('Leave queue');

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await executeCommand(interaction, leaveQueueShared, context);
}

export const leaveQueue: ChatInputSubcommand = {
    data: data,
    execute: execute,
    guards: [matchingMember],
};

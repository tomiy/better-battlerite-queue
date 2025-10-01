import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputCommand, executeCommand } from '../../../command';
import { CommandContext } from '../../../command-context.type';
import { botCommandsChannel } from '../../../guard/bot/bot-commands-channel.guard';
import { botSync } from '../../../guard/bot/bot-sync.guard';
import { CommandName } from '../../../command-name.type';
import { enableQueue } from './queue-enable.command';
import { disableQueue } from './queue-disable.command';
import { joinQueue } from './queue-join.command';
import { leaveQueue } from './queue-leave.command';

const data = new SlashCommandBuilder()
    .setName(CommandName.QUEUE)
    .setDescription('Game functions')
    .addSubcommand(enableQueue.data)
    .addSubcommand(disableQueue.data)
    .addSubcommand(joinQueue.data)
    .addSubcommand(leaveQueue.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.QUEUE_ENABLE:
            await executeCommand(interaction, enableQueue, context);
            break;
        case CommandName.QUEUE_DISABLE:
            await executeCommand(interaction, disableQueue, context);
            break;
        case CommandName.QUEUE_JOIN:
            await executeCommand(interaction, joinQueue, context);
            break;
        case CommandName.QUEUE_LEAVE:
            await executeCommand(interaction, leaveQueue, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const queue: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel],
};

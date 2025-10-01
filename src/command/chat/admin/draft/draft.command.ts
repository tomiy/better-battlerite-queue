import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputCommand, executeCommand } from '../../../command';
import { CommandContext } from '../../../command-context.type';
import { botCommandsChannel } from '../../../guard/bot/bot-commands-channel.guard';
import { botMod } from '../../../guard/bot/bot-mod.guard';
import { botSync } from '../../../guard/bot/bot-sync.guard';
import { CommandName } from '../../../command-name.type';
import { draftSequence } from './sequence/draft-sequence.command';

const data = new SlashCommandBuilder()
    .setName(CommandName.DRAFT)
    .setDescription('Draft functions')
    .addSubcommandGroup(draftSequence.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommandGroup()) {
        case CommandName.DRAFT_SEQUENCE:
            await executeCommand(interaction, draftSequence, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand group, should never happen',
            );
    }
}

export const draft: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel, botMod],
};

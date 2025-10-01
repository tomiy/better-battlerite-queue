import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputCommand, executeCommand } from '../../../command';
import { CommandContext } from '../../../command-context.type';
import { botCommandsChannel } from '../../../guard/bot/bot-commands-channel.guard';
import { botSync } from '../../../guard/bot/bot-sync.guard';
import { createMatch } from './match-create.command';
import { dropMatch } from './match-drop.command';
import { joinMatch } from './match-join.command';
import { leaveMatch } from './match-leave.command';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandBuilder()
    .setName(CommandName.MATCH)
    .setDescription('Match functions')
    .addSubcommand(createMatch.data)
    .addSubcommand(joinMatch.data)
    .addSubcommand(leaveMatch.data)
    .addSubcommand(dropMatch.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.MATCH_CREATE:
            await executeCommand(interaction, createMatch, context);
            break;
        case CommandName.MATCH_JOIN:
            await executeCommand(interaction, joinMatch, context);
            break;
        case CommandName.MATCH_LEAVE:
            await executeCommand(interaction, leaveMatch, context);
            break;
        case CommandName.MATCH_DROP:
            await executeCommand(interaction, dropMatch, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const match: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel],
};

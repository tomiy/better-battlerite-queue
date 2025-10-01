import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { addGameMode } from './game-mode-add.command';
import { syncGameMode } from './game-mode-sync.command';
import { listGameModes } from './game-mode-list.command';
import { deleteGameMode } from './game-mode-delete.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.GAME_MODE)
    .setDescription('Game mode functions')
    .addSubcommand(addGameMode.data)
    .addSubcommand(listGameModes.data)
    .addSubcommand(syncGameMode.data)
    .addSubcommand(deleteGameMode.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.GAME_MODE_ADD:
            await executeCommand(interaction, addGameMode, context);
            break;
        case CommandName.GAME_MODE_LIST:
            await executeCommand(interaction, listGameModes, context);
            break;
        case CommandName.GAME_MODE_SYNC:
            await executeCommand(interaction, syncGameMode, context);
            break;
        case CommandName.GAME_MODE_DELETE:
            await executeCommand(interaction, deleteGameMode, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const gameMode: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

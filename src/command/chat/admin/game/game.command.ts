import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputCommand, executeCommand } from '../../../command';
import { CommandContext } from '../../../command-context.type';
import { botCommandsChannel } from '../../../guard/bot/bot-commands-channel.guard';
import { botMod } from '../../../guard/bot/bot-mod.guard';
import { botSync } from '../../../guard/bot/bot-sync.guard';
import { addGame } from './game-add.command';
import { listGames } from './game-list.command';
import { deleteGame } from './game-delete.command';
import { gameRegion } from './region/game-region.command';
import { CommandName } from '../../../command-name.type';
import { gameMode } from './mode/game-mode.command';
import { gameTerrain } from './terrain/game-terrain.command';
import { gameCharacter } from './character/game-character.command';

const data = new SlashCommandBuilder()
    .setName(CommandName.GAME)
    .setDescription('Game functions')
    .addSubcommand(addGame.data)
    .addSubcommand(listGames.data)
    .addSubcommand(deleteGame.data)
    .addSubcommandGroup(gameRegion.data)
    .addSubcommandGroup(gameMode.data)
    .addSubcommandGroup(gameTerrain.data)
    .addSubcommandGroup(gameCharacter.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    if (interaction.options.getSubcommandGroup()) {
        switch (interaction.options.getSubcommandGroup()) {
            case CommandName.GAME_REGION:
                await executeCommand(interaction, gameRegion, context);
                break;
            case CommandName.GAME_MODE:
                await executeCommand(interaction, gameMode, context);
                break;
            case CommandName.GAME_TERRAIN:
                await executeCommand(interaction, gameTerrain, context);
                break;
            case CommandName.GAME_CHARACTER:
                await executeCommand(interaction, gameCharacter, context);
                break;
            default:
                await tempReply(
                    interaction,
                    'Invalid subcommand group, should never happen',
                );
        }

        return;
    }

    if (interaction.options.getSubcommand()) {
        switch (interaction.options.getSubcommand()) {
            case CommandName.GAME_ADD:
                await executeCommand(interaction, addGame, context);
                break;
            case CommandName.GAME_LIST:
                await executeCommand(interaction, listGames, context);
                break;
            case CommandName.GAME_DELETE:
                await executeCommand(interaction, deleteGame, context);
                break;
            default:
                await tempReply(
                    interaction,
                    'Invalid subcommand, should never happen',
                );
        }
    }
}

export const game: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel, botMod],
};

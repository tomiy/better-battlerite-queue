import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { editTerrain } from './game-terrain-edit.command';
import { addTerrain } from './game-terrain-add.command';
import { listTerrains } from './game-terrain-list.command';
import { deleteTerrain } from './game-terrain-delete.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.GAME_TERRAIN)
    .setDescription('Game terrain functions')
    .addSubcommand(addTerrain.data)
    .addSubcommand(listTerrains.data)
    .addSubcommand(editTerrain.data)
    .addSubcommand(deleteTerrain.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.GAME_TERRAIN_ADD:
            await executeCommand(interaction, addTerrain, context);
            break;
        case CommandName.GAME_TERRAIN_LIST:
            await executeCommand(interaction, listTerrains, context);
            break;
        case CommandName.GAME_TERRAIN_EDIT:
            await executeCommand(interaction, editTerrain, context);
            break;
        case CommandName.GAME_TERRAIN_DELETE:
            await executeCommand(interaction, deleteTerrain, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const gameTerrain: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

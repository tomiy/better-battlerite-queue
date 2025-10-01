import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { terrainManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { matchingModeTerrain } from '../../../../guard/game/matching-mode-terrain.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_TERRAIN_DELETE)
    .setDescription('Delete terrain')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('mode_name')
            .setDescription('Mode name')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('terrain_name')
            .setDescription('Terrain name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['server', 'gameMode', 'gameModeTerrain']);

    const deletedTerrain = await terrainManager.deleteTerrain(
        context.gameModeTerrain.id,
    );

    if (deletedTerrain) {
        await tempReply(
            interaction,
            `Deleted terrain ${context.gameModeTerrain.terrain.name} for game mode ${context.gameMode.name}!`,
        );
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
    context.terrainName = interaction.options.getString('terrain_name', true);
}

export const deleteTerrain: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingModeTerrain],
};

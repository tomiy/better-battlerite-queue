import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { terrainManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { matchingModeTerrain } from '../../../../guard/game/matching-mode-terrain.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_TERRAIN_EDIT)
    .setDescription('Edit terrain')
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
    )
    .addIntegerOption((option) =>
        option
            .setName('weight')
            .setDescription('Weight (0 = cannot roll)')
            .setMinValue(0)
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame', 'gameModeTerrain']);

    const weight = interaction.options.getInteger('weight', true);

    if (weight < 0) {
        await tempReply(interaction, 'Weight cannot be negative');
        return;
    }

    const terrain = await terrainManager.updateTerrain(
        context.gameModeTerrain.id,
        weight,
    );

    if (terrain) {
        await tempReply(
            interaction,
            `${context.gameModeTerrain.terrain.name} has been updated !`,
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

export const editTerrain: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingModeTerrain],
};

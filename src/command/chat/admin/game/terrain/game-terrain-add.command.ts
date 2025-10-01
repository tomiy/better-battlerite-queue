import {
    ChatInputCommandInteraction,
    MessageFlags,
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
import { matchingGame } from '../../../../guard/game/matching-game.guard';
import { matchingGameTerrain } from '../../../../guard/game/matching-game-terrain.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_TERRAIN_ADD)
    .setDescription('Add terrain')
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'server',
        'serverGame',
        'gameMode',
        'terrainName',
        'gameTerrain',
    ]);

    const { matchingTerrain } = await terrainManager.findTerrain(
        context.gameMode.id,
        context.terrainName,
    );

    if (matchingTerrain) {
        await tempReply(
            interaction,
            'A terrain with this name already exists for this game mode!',
        );
        return;
    }

    const updatedTerrain = await terrainManager.createTerrain(
        context.gameMode.id,
        context.gameTerrain.id,
    );

    if (updatedTerrain) {
        await tempReply(
            interaction,
            `Terrain ${context.gameTerrain.name} created!`,
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

export const addTerrain: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [
        matchingGame,
        matchingServerGame,
        matchingMode,
        matchingGameTerrain,
    ],
};

import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { characterManager, terrainManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_MODE_SYNC)
    .setDescription('Sync game mode')
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
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame', 'gameMode']);

    for (const gameTerrain of context.serverGame.game.terrains) {
        const matchingGameModeTerrain = context.gameMode.terrains.find(
            (gmt) => gmt.terrainId === gameTerrain.id,
        );

        if (!matchingGameModeTerrain) {
            await terrainManager.createTerrain(
                context.gameMode.id,
                gameTerrain.id,
            );
        }
    }

    for (const gameCharacter of context.serverGame.game.characters) {
        const matchingGameModeCharacter = context.gameMode.characters.find(
            (gmt) => gmt.characterId === gameCharacter.id,
        );

        if (!matchingGameModeCharacter) {
            await characterManager.createCharacter(
                context.gameMode.id,
                gameCharacter.id,
            );
        }
    }

    await tempReply(
        interaction,
        `Successfully synced game mode ${context.gameMode.name} for game ${context.serverGame.game.name}!`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const syncGameMode: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode],
};

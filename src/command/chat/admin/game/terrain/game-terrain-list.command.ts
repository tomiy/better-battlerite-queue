import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { safeReply, tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { terrainManager } from '../../../../../config/state';
import { formatListCodeBlock } from '../../../../../discord/format.utils';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_TERRAIN_LIST)
    .setDescription('List characters')
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

    const terrains = await terrainManager.findTerrains(context.gameMode.id);

    if (!terrains.length) {
        await tempReply(
            interaction,
            `No terrains found for mode ${context.gameMode.name} and game ${context.serverGame.game.name}!`,
        );
        return;
    }

    const totalWeights = terrains.reduce((c, t) => c + t.weight, 0);

    const terrainNames = terrains.map(
        (c) => `${c.terrain.name} (${c.weight} / ${totalWeights})`,
    );

    await safeReply(
        interaction,
        `Available terrains for ${context.gameMode.name}: ${formatListCodeBlock(terrainNames)}`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const listTerrains: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode],
};

import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { terrainManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingModeTerrain: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'gameMode', 'terrainName']);

    const { matchingTerrain, validTerrainNames } =
        await terrainManager.findTerrain(
            context.gameMode.id,
            context.terrainName,
        );

    if (!matchingTerrain) {
        await safeReply(
            interaction,
            `No matching terrain for "${context.terrainName}" for game mode ${context.gameMode.name}. Available terrains: ${formatListCodeBlock(validTerrainNames)}`,
        );
        return false;
    }

    context.gameModeTerrain = matchingTerrain;

    return true;
};

import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { gameManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingGameTerrain: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'game', 'terrainName']);

    const { matchingTerrain, validTerrainNames } =
        await gameManager.findTerrain(context.game.id, context.terrainName);

    if (!matchingTerrain) {
        await safeReply(
            interaction,
            `No matching terrain for "${context.terrainName}". Available terrains: ${formatListCodeBlock(validTerrainNames)}`,
        );
        return false;
    }

    context.gameTerrain = matchingTerrain;

    return true;
};

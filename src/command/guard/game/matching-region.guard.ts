import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { regionManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingRegion: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'serverGame', 'regionName']);

    const { matchingRegion, validRegionNames } =
        await regionManager.findGameRegion(
            context.serverGame.id,
            context.regionName,
        );

    if (!matchingRegion) {
        await safeReply(
            interaction,
            `No matching region for "${context.regionName}" for ${context.serverGame.game.name}. Available regions: ${formatListCodeBlock(validRegionNames)}`,
        );
        return false;
    }

    context.region = matchingRegion;

    return true;
};

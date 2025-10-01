import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { gameManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingGame: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['gameName']);

    const { matchingGame, validGameNames } = await gameManager.findGame(
        context.gameName,
    );

    if (!matchingGame) {
        await safeReply(
            interaction,
            `No matching games for "${context.gameName}". Available games: ${formatListCodeBlock(validGameNames)}`,
        );
        return false;
    }

    context.game = matchingGame;

    return true;
};

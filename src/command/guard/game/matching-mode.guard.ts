import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { gameModeManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingMode: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'serverGame', 'modeName']);

    const { matchingGameMode, validGameModeNames } =
        await gameModeManager.findGameMode(
            context.serverGame.id,
            context.modeName,
        );

    if (!matchingGameMode) {
        await safeReply(
            interaction,
            `No matching game mode for "${context.modeName}" for game ${context.serverGame.game.name}. Available modes: ${formatListCodeBlock(validGameModeNames)}`,
        );
        return false;
    }

    context.gameMode = matchingGameMode;

    return true;
};

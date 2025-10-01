import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { gameModeManager } from '../../../config/state';

export const matchingModeId: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'modeId']);

    const matchingGameMode = await gameModeManager.findGameModeById(
        context.modeId,
    );

    if (!matchingGameMode) {
        await safeReply(
            interaction,
            `No matching game mode for id ${context.modeId}.`,
        );
        return false;
    }

    context.gameMode = matchingGameMode;
    context.serverGame = matchingGameMode.serverGame;

    return true;
};

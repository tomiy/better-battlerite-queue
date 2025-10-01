import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { serverManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingServerGame: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'gameName']);

    const { matchingServerGame, validGameNames } =
        await serverManager.findServerGame(context.server.id, context.gameName);

    if (!matchingServerGame) {
        await safeReply(
            interaction,
            `No matching games for "${context.gameName}" in this server. Available games: ${formatListCodeBlock(validGameNames)}`,
        );
        return false;
    }

    context.serverGame = matchingServerGame;

    return true;
};

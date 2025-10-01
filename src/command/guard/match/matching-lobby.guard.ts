import { RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { matchManager } from '../../../config/state';

export const matchingLobby: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'lobbyCode']);

    const match = await matchManager.findMatchByLobbyCode(context.lobbyCode);

    if (!match) {
        await tempReply(interaction, 'No matching lobby found');
        return false;
    }

    context.match = match;
    context.serverGame = match.gameMode.serverGame;

    return true;
};

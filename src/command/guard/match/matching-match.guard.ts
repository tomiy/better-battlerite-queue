import { RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { matchManager } from '../../../config/state';

export const matchingMatch: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['matchId']);

    const match = await matchManager.getFullMatch(context.matchId);

    if (!match) {
        await tempReply(interaction, 'No matching match!');
        return false;
    }

    context.match = match;

    return true;
};

import { RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { profileManager } from '../../../config/state';

export const matchingProfile: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['serverGame', 'member']);

    const profile = await profileManager.findProfile(
        context.serverGame.id,
        context.member.id,
    );

    if (!profile) {
        await tempReply(
            interaction,
            `No matching profile for game ${context.serverGame.game.name}!`,
        );
        return false;
    }

    context.profile = profile;

    return true;
};

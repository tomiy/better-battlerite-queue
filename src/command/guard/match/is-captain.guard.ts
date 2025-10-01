import { tempReply } from '../../../discord/interaction.utils';

import { RepliableInteraction } from 'discord.js';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';

export const isCaptain: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['member', 'team']);

    const captain = context.team.players.find((p) => p.captain);

    if (!captain) {
        throw new Error(`No captain for team ${context.team.id}`);
    }

    if (captain.serverGameProfile.discordId !== context.member.id) {
        await tempReply(interaction, 'You are not a captain!');
        return false;
    }

    return true;
};

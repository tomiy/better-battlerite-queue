import { RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';

export const matchingMember: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['guild']);

    const member = await context.guild.members.fetch(interaction.user.id);

    if (!member) {
        await tempReply(
            interaction,
            'No matching member, this should never happen',
        );
        return false;
    }

    context.member = member;

    return true;
};

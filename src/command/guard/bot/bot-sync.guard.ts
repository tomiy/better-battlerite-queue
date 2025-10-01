import { RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext } from '../../command-context.type';

export const botSync: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    if (
        !context.server?.categoryChannelId ||
        !context.server?.botCommandsChannelId ||
        !context.server?.queueChannelId ||
        !context.server?.matchHistoryChannelId ||
        !context.server?.botModRoleId ||
        !context.server?.registeredRoleId ||
        !context.server?.queueRoleId ||
        !context.server?.matchRoleId
    ) {
        await tempReply(interaction, 'Bot is not setup, check logs');
        return false;
    }

    return true;
};

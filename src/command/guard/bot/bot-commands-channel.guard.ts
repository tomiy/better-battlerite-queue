import { channelMention, RepliableInteraction } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext } from '../../command-context.type';

export const botCommandsChannel: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    const botCommandsChannel = context.server?.botCommandsChannelId;

    if (interaction.channelId === botCommandsChannel) {
        return true;
    }

    if (!botCommandsChannel) {
        await tempReply(
            interaction,
            'No bot commands channel found, check bot logs',
        );
        return false;
    }

    await tempReply(
        interaction,
        `Invalid context, you must use ${channelMention(botCommandsChannel)}`,
    );

    return false;
};

import { CommandInteraction, channelMention } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { tempReply } from '../interaction-utils';
import { GuardFunction } from './guard';

export const botCommandsChannel: GuardFunction = async (
    interaction: CommandInteraction,
    guild: dbGuild,
) => {
    if (interaction.channelId === guild?.botCommandsChannel) {
        return true;
    }

    const botCommandsChannel = guild.botCommandsChannel;

    if (botCommandsChannel === null) {
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

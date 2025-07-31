import { CommandInteraction, MessageFlags, channelMention } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { GuardFunction } from './guard';

export const botCommandsChannel: GuardFunction = async (interaction: CommandInteraction, guild: dbGuild) => {
    if (interaction.channelId === guild?.botCommandsChannel) {
        return true;
    }

    const botCommandsChannel = guild.botCommandsChannel;

    if (botCommandsChannel === null) {
        await interaction.reply({
            content: 'No bot commands channel found, check bot logs',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    await interaction.reply({
        content: `Invalid context, you must use ${channelMention(botCommandsChannel)}`,
        flags: MessageFlags.Ephemeral,
    });

    return false;
};

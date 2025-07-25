import { CommandInteraction, MessageFlags, channelMention } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { GuardFunction } from './guard';

export const botCommandsChannel: GuardFunction = async (interaction: CommandInteraction, guild: dbGuild) => {
    if (interaction.channelId === guild?.botCommandsChannel) {
        return true;
    }

    const botCommandsChannel = guild.botCommandsChannel;
    const botCommandChannelMention = botCommandsChannel ? channelMention(botCommandsChannel) : 'the bot command channel';

    await interaction.reply({
        content: `Invalid context, you must use ${botCommandChannelMention}`,
        flags: MessageFlags.Ephemeral,
    });

    return false;
};

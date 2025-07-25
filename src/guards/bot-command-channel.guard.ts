import { CommandInteraction, MessageFlags, channelMention } from 'discord.js';
import { Guild } from '../../.prisma';
import { GuardFunction } from './guard';

export const botCommandsChannel: GuardFunction = async (interaction: CommandInteraction, guild: Guild) => {
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

import { CommandInteraction, MessageFlags } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { GuardFunction } from './guard';

export const botSetup: GuardFunction = async (interaction: CommandInteraction, guild: dbGuild) => {
    if (!guild?.botCommandsChannel || !guild.queueChannel || !guild.botModRole || !guild.registeredRole || !guild.queueRole) {
        await interaction.reply({
            content: 'Bot is not setup, check logs',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    return true;
};

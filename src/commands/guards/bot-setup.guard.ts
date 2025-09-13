import { CommandInteraction } from 'discord.js';
import { Guild as dbGuild } from '../../../.prisma';
import { tempReply } from '../../interaction-utils';
import { GuardFunction } from './guard.type';

export const botSetup: GuardFunction = async (
    interaction: CommandInteraction,
    guild: dbGuild,
) => {
    if (
        !guild.botCommandsChannel ||
        !guild.queueChannel ||
        !guild.matchHistoryChannel ||
        !guild.botModRole ||
        !guild.registeredRole ||
        !guild.queueRole
    ) {
        await tempReply(interaction, 'Bot is not setup, check logs');
        return false;
    }

    return true;
};

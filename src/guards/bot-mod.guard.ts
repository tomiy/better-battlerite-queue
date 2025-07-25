import { CommandInteraction, GuildMember, MessageFlags, roleMention } from 'discord.js';
import { Guild } from '../../.prisma';
import { GuardFunction } from './guard';

export const botModGuard: GuardFunction = async (interaction: CommandInteraction, guild: Guild) => {
    if (guild?.botModRole && (interaction.member as GuildMember)?.roles.cache.has(guild?.botModRole)) {
        return true;
    } else {
        const botModRole = guild.botModRole;
        const botModRoleMention = botModRole ? roleMention(botModRole) : 'the bot moderator';

        await interaction.reply({
            content: `Invalid context, you must have the ${botModRoleMention} role`,
            flags: MessageFlags.Ephemeral,
        });

        return false;
    }
};

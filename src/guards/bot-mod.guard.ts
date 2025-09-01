import { CommandInteraction, GuildMember, roleMention } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { tempReply } from '../interaction-utils';
import { GuardFunction } from './guard';

export const botModGuard: GuardFunction = async (
    interaction: CommandInteraction,
    guild: dbGuild,
) => {
    if (
        guild?.botModRole &&
        (interaction.member as GuildMember)?.roles.cache.has(guild?.botModRole)
    ) {
        return true;
    } else {
        const botModRole = guild.botModRole;
        const botModRoleMention = botModRole
            ? roleMention(botModRole)
            : 'the bot moderator';

        await tempReply(
            interaction,
            `Invalid context, you must have the ${botModRoleMention} role`,
        );

        return false;
    }
};

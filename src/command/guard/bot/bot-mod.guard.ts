import { RepliableInteraction, roleMention } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext } from '../../command-context.type';

export const botMod: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    const botModRole = context.server?.botModRoleId;

    const matchingMember = await interaction.guild?.members.fetch(
        interaction.user.id,
    );

    if (
        botModRole &&
        matchingMember &&
        matchingMember.roles.cache.has(botModRole)
    ) {
        return true;
    } else {
        const botModRoleMention = botModRole
            ? roleMention(botModRole)
            : 'bot moderator';

        await tempReply(
            interaction,
            `Invalid context, you must have the ${botModRoleMention} role`,
        );

        return false;
    }
};

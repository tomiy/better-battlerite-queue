import { tempReply } from '../../../discord/interaction.utils';

import { RepliableInteraction } from 'discord.js';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';

export const matchingTeam: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['member', 'match', 'teamId']);

    const memberTeam = context.match.teams.find(
        (t) =>
            t.players.some(
                (p) => p.serverGameProfile.discordId === context.member.id,
            ) && t.id === context.teamId,
    );

    if (!memberTeam) {
        await tempReply(interaction, 'This is not your team, get out of here!');
        return false;
    }

    context.team = memberTeam;

    return true;
};

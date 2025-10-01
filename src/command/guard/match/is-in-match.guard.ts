import { tempReply } from '../../../discord/interaction.utils';

import { RepliableInteraction } from 'discord.js';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';

export const isInMatch: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['match', 'member']);

    const memberPlayer = context.match.teams
        .flatMap((t) => t.players)
        .find((p) => p.serverGameProfile.discordId === context.member.id);

    if (!memberPlayer) {
        await tempReply(interaction, 'You are not in this match!');
        return false;
    }

    context.team = context.match.teams.find((t) => t.id == memberPlayer.teamId);
    context.player = memberPlayer;

    return true;
};

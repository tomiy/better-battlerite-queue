import { AnySelectMenuInteraction, MessageFlags } from 'discord.js';
import { matchPlayerManager } from '../../config/state';
import { tempReply } from '../../discord/interaction.utils';
import { SelectCommand } from '../command';
import { CommandContext, ensureContext } from '../command-context.type';
import { botSync } from '../guard/bot/bot-sync.guard';
import { matchingMatch } from '../guard/match/matching-match.guard';
import { matchingMember } from '../guard/member/matching-member.guard';
import { isInMatch } from '../guard/match/is-in-match.guard';
import { attemptMatchConclusion } from '../../core/shared/attempt-match-conclusion';

async function execute(
    interaction: AnySelectMenuInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['guild', 'server', 'match', 'member', 'player']);

    const teamOrder = parseInt(interaction.values[0]);

    await matchPlayerManager.setReport(context.player.id, {
        winReport: teamOrder,
        dropReport: false,
    });

    await tempReply(interaction, 'Report updated!');
    await attemptMatchConclusion(context);
}

function populateContext(
    interaction: AnySelectMenuInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId] = options;

    context.matchId = parseInt(matchId);
}

export const teamList: SelectCommand = {
    data: { name: 'teamList' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMatch, matchingMember, isInMatch],
};

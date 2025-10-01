import { ButtonInteraction, MessageFlags } from 'discord.js';
import { matchPlayerManager } from '../../../config/state';
import { tempReply } from '../../../discord/interaction.utils';
import { ButtonCommand } from '../../command';
import { CommandContext, ensureContext } from '../../command-context.type';
import { botSync } from '../../guard/bot/bot-sync.guard';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { matchingMatch } from '../../guard/match/matching-match.guard';
import { isInMatch } from '../../guard/match/is-in-match.guard';
import { attemptMatchDrop } from '../../../core/shared/attempt-match-drop';
import { updateReportUI } from '../../../discord/ui/report/update-report-ui';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'guild', 'match', 'member', 'player']);

    await matchPlayerManager.setReport(context.player.id, {
        winReport: null,
        dropReport: true,
    });

    await tempReply(interaction, 'Report updated!');

    if (!(await attemptMatchDrop(context))) {
        await updateReportUI(context.match.id, context.server, context.guild);
    }
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId] = options;

    context.matchId = parseInt(matchId);
}

export const reportDrop: ButtonCommand = {
    data: { name: 'reportDrop' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMember, matchingMatch, isInMatch],
};

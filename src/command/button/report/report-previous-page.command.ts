import { ButtonInteraction, MessageFlags } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { buildReportUI } from '../../../discord/ui/report/build-report-ui';
import { ButtonCommand } from '../../command';
import { CommandContext, ensureContext } from '../../command-context.type';
import { botSync } from '../../guard/bot/bot-sync.guard';
import { matchingMatch } from '../../guard/match/matching-match.guard';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { isInMatch } from '../../guard/match/is-in-match.guard';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['matchId', 'currentPage']);

    if (context.currentPage > 0) {
        const reportUI = await buildReportUI(
            context.matchId,
            context.currentPage - 1,
        );

        await interaction.message.edit({
            components: reportUI,
        });
    }

    await tempReply(interaction, 'Selection list updated!');
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId, currentPage] = options;

    context.matchId = parseInt(matchId);

    context.currentPage = parseInt(currentPage);
}

export const reportPreviousPage: ButtonCommand = {
    data: { name: 'reportPreviousPage' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMatch, matchingMember, isInMatch],
};

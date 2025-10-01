import { ButtonInteraction, MessageFlags } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { buildDraftUI } from '../../../discord/ui/draft/build-draft-ui';
import { ButtonCommand } from '../../command';
import { CommandContext, ensureContext } from '../../command-context.type';
import { botSync } from '../../guard/bot/bot-sync.guard';
import { canUseDraftButton } from './can-use-draft-button';
import { matchingMatch } from '../../guard/match/matching-match.guard';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { matchingTeam } from '../../guard/match/matching-team.guard';
import { isCaptain } from '../../guard/match/is-captain.guard';
import { clearCaptainClaimTimeouts } from './draft-claim-captain.command';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'member',
        'matchId',
        'teamId',
        'currentPage',
        'listSize',
    ]);

    clearCaptainClaimTimeouts(context.teamId);

    if (!(await canUseDraftButton(interaction, context))) {
        return;
    }

    if (context.currentPage < Math.floor((context.listSize - 1) / 25)) {
        const draftUI = await buildDraftUI(
            context.matchId,
            context.teamId,
            context.currentPage + 1,
        );

        await interaction.message.edit({
            components: draftUI,
        });
    }

    await tempReply(interaction, 'Selection list updated!');
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId, teamId, currentPage, listSize] = options;

    context.matchId = parseInt(matchId);
    context.teamId = parseInt(teamId);

    context.currentPage = parseInt(currentPage);
    context.listSize = parseInt(listSize);
}

export const draftNextPage: ButtonCommand = {
    data: { name: 'draftNextPage' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMember, matchingMatch, matchingTeam, isCaptain],
};

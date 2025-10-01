import { ButtonInteraction, MessageFlags } from 'discord.js';
import { tempReply } from '../../../discord/interaction.utils';
import { ButtonCommand } from '../../command';
import { CommandContext, ensureContext } from '../../command-context.type';
import { botSync } from '../../guard/bot/bot-sync.guard';
import { matchingMatch } from '../../guard/match/matching-match.guard';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { matchingTeam } from '../../guard/match/matching-team.guard';
import { isInMatch } from '../../guard/match/is-in-match.guard';
import { matchTeamManager } from '../../../config/state';
import { updateDraftUI } from '../../../discord/ui/draft/update-draft-ui';

async function execute(
    interaction: ButtonInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'guild',
        'member',
        'teamId',
        'matchId',
        'team',
        'player',
    ]);

    const captain = context.team.players.find((p) => p.captain);

    if (!captain) {
        throw new Error(`No captain for team ${context.teamId}`);
    }

    if (captain.serverGameProfile.discordId === context.member.id) {
        await tempReply(interaction, 'You are already captain!');
        return;
    }

    captainClaimTimeouts.set(
        context.teamId,
        setTimeout(async () => {
            await matchTeamManager.claimCaptain(context.player, captain);
            clearCaptainClaimTimeouts(context.teamId);

            await updateDraftUI(context.matchId, 0, context.guild);
        }, 60000),
    );

    if (interaction.channel && interaction.channel.isSendable()) {
        await interaction.channel.send(
            `A captain claim request has been made for this team. If the current captain doesn't perform any draft action within 1 minute, the player making the request will be appointed as new captain.`,
        );
    }

    await tempReply(interaction, 'Claim registered!');
}

function populateContext(
    interaction: ButtonInteraction,
    context: CommandContext,
    options: string[],
) {
    const [matchId, teamId] = options;

    context.matchId = parseInt(matchId);
    context.teamId = parseInt(teamId);
}

export const draftClaimCaptain: ButtonCommand = {
    data: { name: 'draftClaimCaptain' },
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, matchingMember, matchingMatch, isInMatch, matchingTeam],
};

const captainClaimTimeouts: Map<number, NodeJS.Timeout> = new Map();

export function clearCaptainClaimTimeouts(teamId: number) {
    const claim = captainClaimTimeouts.get(teamId);
    if (claim) {
        clearTimeout(claim);
        captainClaimTimeouts.delete(teamId);
    }
}

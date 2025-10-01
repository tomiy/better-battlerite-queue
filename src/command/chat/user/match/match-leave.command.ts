import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { matchManager, matchPlayerManager } from '../../../../config/state';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.MATCH_LEAVE)
    .setDescription('Leave match');

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['guild', 'server', 'member']);

    const isInAnyMatch = await matchPlayerManager.isInAnyMatch(
        context.member.id,
    );

    if (!isInAnyMatch) {
        await tempReply(interaction, 'You are not in a match!');
        return;
    }

    const matchingMatchPlayer = await matchPlayerManager.findMatchPlayerInLobby(
        context.member,
    );

    if (!matchingMatchPlayer) {
        await tempReply(interaction, 'Cannot leave current match!');
        return;
    }

    const deletedMatchPlayer = await matchPlayerManager.leaveMatch(
        context.member,
        context.server,
        matchingMatchPlayer.id,
    );

    if (!deletedMatchPlayer) {
        await tempReply(interaction, 'Could not leave match!');
        return;
    }

    await tempReply(interaction, 'Match left!');

    const isMatchEmpty = await matchManager.isMatchEmpty(
        matchingMatchPlayer.team.match.id,
    );

    if (isMatchEmpty) {
        await matchManager.dropMatch(matchingMatchPlayer.team.match.id);
    }
}

export const leaveMatch: ChatInputSubcommand = {
    data: data,
    execute: execute,
    guards: [matchingMember],
};

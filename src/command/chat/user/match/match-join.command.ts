import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { MatchState } from '../../../../../.prisma';
import { matchPlayerManager, matchTeamManager } from '../../../../config/state';
import { attemptMatchLaunch } from '../../../../core/shared/attempt-match-launch';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { matchingLobby } from '../../../guard/match/matching-lobby.guard';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { matchingProfile } from '../../../guard/member/matching-profile.guard';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.MATCH_JOIN)
    .setDescription('Join match')
    .addStringOption((option) =>
        option
            .setName('lobby_code')
            .setDescription('Lobby code')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'guild', 'member', 'match', 'profile']);

    const draftSequence = context.match.gameMode.draftSequence;

    if (!draftSequence) {
        await tempReply(
            interaction,
            `No draft sequence for game mode ${context.match.gameMode.id}`,
        );
        return;
    }

    if (context.match.state !== MatchState.NEW) {
        await tempReply(interaction, 'Match has already started!');
        return;
    }

    const isInAnyMatch = await matchPlayerManager.isInAnyMatch(
        context.member.id,
    );

    if (isInAnyMatch === null) {
        await tempReply(interaction, `Error checking for match availability`);
        return;
    }

    if (isInAnyMatch) {
        await tempReply(interaction, `You are already in a match!`);
        return;
    }

    const validNextTeam = await matchTeamManager.findNextValidTeam(
        context.match.id,
    );

    if (!validNextTeam) {
        await tempReply(interaction, 'Match is full!');
        return;
    }

    const createdMatchPlayer = await matchPlayerManager.joinMatch(
        context.member,
        context.server,
        validNextTeam.id,
        context.profile.id,
    );

    if (!createdMatchPlayer) {
        await tempReply(interaction, 'Could not join match!');
        return;
    }

    await tempReply(interaction, 'Match joined!');

    await attemptMatchLaunch(interaction, context, draftSequence);
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.lobbyCode = interaction.options.getString('lobby_code', true);
}

export const joinMatch: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingMember, matchingLobby, matchingProfile],
};

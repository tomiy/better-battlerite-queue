import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import {
    matchManager,
    matchPlayerManager,
    matchTeamManager,
} from '../../../../config/state';
import { safeReply, tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { matchingServerGame } from '../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../guard/game/matching-mode.guard';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { matchingProfile } from '../../../guard/member/matching-profile.guard';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.MATCH_CREATE)
    .setDescription('Create match')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('mode_name')
            .setDescription('Mode name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'server',
        'member',
        'serverGame',
        'gameMode',
        'profile',
    ]);

    if (!context.gameMode.draftSequence) {
        await tempReply(
            interaction,
            `No draft sequence for game mode ${context.gameMode.id}`,
        );
        return;
    }

    const isInAnyMatch = await matchPlayerManager.isInAnyMatch(
        context.member.id,
    );

    if (isInAnyMatch === null) {
        await tempReply(interaction, 'Error checking for match availability');
        return;
    }

    if (isInAnyMatch) {
        await tempReply(interaction, 'You are already in a match!');
        return;
    }

    const createdMatch = await matchManager.createMatch(context.gameMode, true);

    if (createdMatch) {
        const validTeam = await matchTeamManager.findNextValidTeam(
            createdMatch.id,
        );

        if (!validTeam) {
            await tempReply(
                interaction,
                'Could not find valid team for new match, should never happen',
            );
            return;
        }

        const createdMatchPlayer = await matchPlayerManager.joinMatch(
            context.member,
            context.server,
            validTeam.id,
            context.profile.id,
        );

        if (createdMatchPlayer) {
            await safeReply(
                interaction,
                `Match created with lobby code \`\`\`${createdMatch.lobbyCode}\`\`\``,
            );
        }
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const createMatch: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingMember, matchingProfile],
};

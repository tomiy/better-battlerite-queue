import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandName } from '../../../command-name.type';
import { CommandContext } from '../../../command-context.type';
import { ChatInputSubcommand, executeCommand } from '../../../command';
import { matchingServerGame } from '../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../guard/game/matching-mode.guard';
import { matchingProfile } from '../../../guard/member/matching-profile.guard';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { joinQueueShared } from '../../../shared/queue-join-shared.command';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.QUEUE_JOIN)
    .setDescription('Join queue')
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
    await executeCommand(interaction, joinQueueShared, context);
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const joinQueue: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingMember, matchingProfile],
};

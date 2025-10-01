import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { gameModeManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_MODE_ADD)
    .setDescription('Add game mode')
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
    )
    .addIntegerOption((option) =>
        option
            .setName('team_count')
            .setDescription('Team count')
            .setMinValue(2)
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame']);

    const modeName = interaction.options.getString('mode_name', true);
    const teamCount = interaction.options.getInteger('team_count', true);

    const { matchingGameMode } = await gameModeManager.findGameMode(
        context.serverGame.id,
        modeName,
    );

    if (matchingGameMode) {
        await tempReply(
            interaction,
            `Game mode ${matchingGameMode.name} already exists for ${context.serverGame.game.name}!`,
        );
        return;
    }

    if (teamCount < 2) {
        await tempReply(interaction, 'Invalid team count, should be 2 or more');
        return;
    }

    const gameMode = await gameModeManager.createGameMode(
        context.serverGame.id,
        modeName,
        teamCount,
    );

    if (gameMode) {
        await tempReply(
            interaction,
            `${gameMode.name} has been added for ${context.serverGame.game.name}!`,
        );
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const addGameMode: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame],
};

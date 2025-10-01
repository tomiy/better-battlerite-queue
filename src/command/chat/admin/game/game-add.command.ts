import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { gameManager, serverManager } from '../../../../config/state';
import { safeReply, tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { CommandName } from '../../../command-name.type';
import { formatListCodeBlock } from '../../../../discord/format.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_ADD)
    .setDescription('Add game')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server']);

    const gameName = interaction.options.getString('game_name', true);

    const { matchingServerGame } = await serverManager.findServerGame(
        context.server.id,
        gameName,
    );

    if (matchingServerGame) {
        await tempReply(
            interaction,
            `${matchingServerGame.game.name} is already added to this server!`,
        );
        return;
    }

    const { matchingGame, validGameNames } =
        await gameManager.findGame(gameName);

    if (!matchingGame) {
        await safeReply(
            interaction,
            `${gameName} is not supported (yet)! Supported games: ${formatListCodeBlock(validGameNames)}`,
        );
        return;
    }

    const createdServerGame = await serverManager.createServerGame(
        context.server.id,
        matchingGame.id,
    );

    if (createdServerGame) {
        await tempReply(
            interaction,
            `${matchingGame.name} has been added to this server!`,
        );
    }
}

export const addGame: ChatInputSubcommand = {
    data: data,
    execute: execute,
    guards: [],
};

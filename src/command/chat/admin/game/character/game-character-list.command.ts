import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { safeReply, tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { characterManager } from '../../../../../config/state';
import { formatListCodeBlock } from '../../../../../discord/format.utils';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_CHARACTER_LIST)
    .setDescription('List characters')
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

    ensureContext(context, ['server', 'serverGame', 'gameMode']);

    const characters = await characterManager.findCharacters(
        context.gameMode.id,
    );

    if (!characters.length) {
        await tempReply(
            interaction,
            `No characters found for mode ${context.gameMode.name} and game ${context.serverGame.game.name}!`,
        );
        return;
    }

    const characterNames = characters.map(
        (c) => c.character.name + (c.enabled ? '' : ' (disabled)'),
    );

    await safeReply(
        interaction,
        `Available characters for ${context.gameMode.name}: ${formatListCodeBlock(characterNames)}`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const listCharacters: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode],
};

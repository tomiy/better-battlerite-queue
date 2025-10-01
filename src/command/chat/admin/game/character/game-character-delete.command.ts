import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { characterManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { matchingModeCharacter } from '../../../../guard/game/matching-mode-character.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_CHARACTER_DELETE)
    .setDescription('Delete character')
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
    .addStringOption((option) =>
        option
            .setName('character_name')
            .setDescription('Character name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['server', 'gameMode', 'gameModeCharacter']);

    const deletedCharacter = await characterManager.deleteCharacter(
        context.gameModeCharacter.id,
    );

    if (deletedCharacter) {
        await tempReply(
            interaction,
            `Deleted character ${context.gameModeCharacter.character.name} for game mode ${context.gameMode.name}!`,
        );
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
    context.characterName = interaction.options.getString(
        'character_name',
        true,
    );
}

export const deleteCharacter: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingModeCharacter],
};

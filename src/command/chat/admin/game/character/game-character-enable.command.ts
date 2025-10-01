import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { matchingModeCharacter } from '../../../../guard/game/matching-mode-character.guard';
import { characterManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_CHARACTER_ENABLE)
    .setDescription('Enable character')
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
    ensureContext(context, ['server', 'serverGame', 'gameModeCharacter']);

    const updatedCharacter = await characterManager.setCharacterAvailability(
        context.gameModeCharacter.id,
        true,
    );

    if (updatedCharacter) {
        await tempReply(
            interaction,
            `Character ${context.gameModeCharacter.character.name} enabled!`,
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

export const enableCharacter: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingModeCharacter],
};

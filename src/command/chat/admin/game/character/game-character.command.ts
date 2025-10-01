import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { editCharacter } from './game-character-edit.command';
import { enableCharacter } from './game-character-enable.command';
import { disableCharacter } from './game-character-disable.command';
import { addCharacter } from './game-character-add.command';
import { listCharacters } from './game-character-list.command';
import { deleteCharacter } from './game-character-delete.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.GAME_CHARACTER)
    .setDescription('Game character functions')
    .addSubcommand(addCharacter.data)
    .addSubcommand(listCharacters.data)
    .addSubcommand(editCharacter.data)
    .addSubcommand(deleteCharacter.data)
    .addSubcommand(enableCharacter.data)
    .addSubcommand(disableCharacter.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.GAME_CHARACTER_ADD:
            await executeCommand(interaction, addCharacter, context);
            break;
        case CommandName.GAME_CHARACTER_LIST:
            await executeCommand(interaction, listCharacters, context);
            break;
        case CommandName.GAME_CHARACTER_EDIT:
            await executeCommand(interaction, editCharacter, context);
            break;
        case CommandName.GAME_CHARACTER_DELETE:
            await executeCommand(interaction, deleteCharacter, context);
            break;
        case CommandName.GAME_CHARACTER_ENABLE:
            await executeCommand(interaction, enableCharacter, context);
            break;
        case CommandName.GAME_CHARACTER_DISABLE:
            await executeCommand(interaction, disableCharacter, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const gameCharacter: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

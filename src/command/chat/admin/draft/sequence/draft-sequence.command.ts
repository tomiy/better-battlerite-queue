import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { addSequence } from './draft-sequence-add.command';
import { listSequences } from './draft-sequence-ilst.command';
import { deleteSequences } from './draft-sequence-delete.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.DRAFT_SEQUENCE)
    .setDescription('Draft sequence functions')
    .addSubcommand(addSequence.data)
    .addSubcommand(listSequences.data)
    .addSubcommand(deleteSequences.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.DRAFT_SEQUENCE_ADD:
            await executeCommand(interaction, addSequence, context);
            break;
        case CommandName.DRAFT_SEQUENCE_LIST:
            await executeCommand(interaction, listSequences, context);
            break;
        case CommandName.DRAFT_SEQUENCE_DELETE:
            await executeCommand(interaction, deleteSequences, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const draftSequence: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

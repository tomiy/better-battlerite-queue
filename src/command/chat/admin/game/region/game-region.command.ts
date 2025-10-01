import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { addGameRegion } from './game-region-add.command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { listGameRegions } from './game-region-list.command';
import { deleteGameRegion } from './game-region-delete.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.GAME_REGION)
    .setDescription('Game region functions')
    .addSubcommand(addGameRegion.data)
    .addSubcommand(listGameRegions.data)
    .addSubcommand(deleteGameRegion.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.GAME_REGION_ADD:
            await executeCommand(interaction, addGameRegion, context);
            break;
        case CommandName.GAME_REGION_LIST:
            await executeCommand(interaction, listGameRegions, context);
            break;
        case CommandName.GAME_REGION_DELETE:
            await executeCommand(interaction, deleteGameRegion, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const gameRegion: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

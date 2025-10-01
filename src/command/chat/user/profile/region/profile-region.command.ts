import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { ChatInputSubcommandGroup, executeCommand } from '../../../../command';
import { CommandContext } from '../../../../command-context.type';
import { tempReply } from '../../../../../discord/interaction.utils';
import { CommandName } from '../../../../command-name.type';
import { enableProfileRegion } from './profile-region-enable.command';
import { disableProfileRegion } from './profile-region-disable.command';

const data = new SlashCommandSubcommandGroupBuilder()
    .setName(CommandName.PROFILE_REGION)
    .setDescription('Game region functions')
    .addSubcommand(enableProfileRegion.data)
    .addSubcommand(disableProfileRegion.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    switch (interaction.options.getSubcommand()) {
        case CommandName.PROFILE_REGION_ENABLE:
            await executeCommand(interaction, enableProfileRegion, context);
            break;
        case CommandName.PROFILE_REGION_DISABLE:
            await executeCommand(interaction, disableProfileRegion, context);
            break;
        default:
            await tempReply(
                interaction,
                'Invalid subcommand, should never happen',
            );
    }
}

export const profileRegion: ChatInputSubcommandGroup = {
    data: data,
    execute: execute,
    guards: [],
};

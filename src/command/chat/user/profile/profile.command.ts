import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputCommand, executeCommand } from '../../../command';
import { CommandContext } from '../../../command-context.type';
import { botCommandsChannel } from '../../../guard/bot/bot-commands-channel.guard';
import { botSync } from '../../../guard/bot/bot-sync.guard';
import { editProfile } from './profile-edit.command';
import { CommandName } from '../../../command-name.type';
import { profileRegion } from './region/profile-region.command';

const data = new SlashCommandBuilder()
    .setName(CommandName.PROFILE)
    .setDescription('Profile functions')
    .addSubcommandGroup(profileRegion.data)
    .addSubcommand(editProfile.data);

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    if (interaction.options.getSubcommandGroup()) {
        switch (interaction.options.getSubcommandGroup()) {
            case CommandName.PROFILE_REGION:
                await executeCommand(interaction, profileRegion, context);
                break;
            default:
                await tempReply(
                    interaction,
                    'Invalid subcommand group, should never happen',
                );
        }

        return;
    }

    if (interaction.options.getSubcommand()) {
        switch (interaction.options.getSubcommand()) {
            case CommandName.PROFILE_EDIT:
                await executeCommand(interaction, editProfile, context);
                break;
            default:
                await tempReply(
                    interaction,
                    'Invalid subcommand, should never happen',
                );
        }
    }
}

export const profile: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel],
};

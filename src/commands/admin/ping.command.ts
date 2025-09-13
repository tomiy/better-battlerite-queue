import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command';
import { botCommandsChannel } from '../guards/bot-command-channel.guard';
import { botModGuard } from '../guards/bot-mod.guard';
import { botSetup } from '../guards/bot-setup.guard';

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Displays current ping');

async function execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({
        content: 'Pinging...',
        withResponse: true,
    });

    if (sent.resource?.message) {
        interaction.editReply(
            `Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`,
        );
    } else {
        interaction.editReply('Could not compute ping');
    }
}

export const ping: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel, botModGuard],
};

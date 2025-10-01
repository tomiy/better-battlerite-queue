import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand } from '../../command';
import { botCommandsChannel } from '../../guard/bot/bot-commands-channel.guard';
import { botMod } from '../../guard/bot/bot-mod.guard';
import { botSync } from '../../guard/bot/bot-sync.guard';

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Displays current ping');

async function execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
        content: 'Pinging...',
        withResponse: true,
    });

    if (sent.resource?.message) {
        await interaction.editReply(
            `Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`,
        );
    } else {
        await interaction.editReply('Could not compute ping');
    }
}

export const ping: ChatInputCommand = {
    data: data,
    execute: execute,
    guards: [botSync, botCommandsChannel, botMod],
};

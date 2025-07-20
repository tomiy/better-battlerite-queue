import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Displays current ping');

export async function execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });

    if (sent.resource?.message) {
        interaction.editReply(`Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`);
    } else {
        interaction.editReply('Could not compute ping');
    }
}

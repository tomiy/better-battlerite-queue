import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { botModGuard } from '../../guards/bot-mod.guard';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Displays current ping');

export async function execute(interaction: CommandInteraction) {
    botModGuard(interaction, async () => {
        const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });

        if (sent.resource?.message) {
            interaction.editReply(`Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms`);
        } else {
            interaction.editReply('Could not compute ping');
        }
    });
}

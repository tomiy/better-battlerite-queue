import { CommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { botModGuard } from '../../guards/bot-mod.guard';

export const data = new SlashCommandBuilder().setName('launch').setDescription('Starts the queue');

export async function execute(interaction: CommandInteraction) {
    botModGuard(interaction, (guild) => {
        const queueChannel = interaction.client.channels.cache.get(guild.queueChannel!);

        if (!queueChannel) {
            interaction.reply({ content: 'Queue channel does not exist, check /settings', flags: MessageFlags.Ephemeral });
            return;
        }

        if (queueChannel.isSendable()) {
            queueChannel.send('Hello :)'); // TODO: queue embed + buttons etc. etc.
            interaction.reply({ content: 'Queue has been launched!', flags: MessageFlags.Ephemeral });
        } else {
            interaction.reply({ content: 'Cannot send messages to queue channel, check bot permissions!', flags: MessageFlags.Ephemeral });
        }
    });
}

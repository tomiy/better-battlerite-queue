import { MessageFlags, RepliableInteraction } from 'discord.js';
import { DebugUtils } from '../debug.utils';

export async function safeReply(
    interaction: RepliableInteraction,
    message: string,
) {
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message);
    } else {
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        });
    }
}

export async function tempReply(
    interaction: RepliableInteraction,
    message: string,
) {
    await safeReply(interaction, message);
    setTimeout(async () => {
        try {
            await interaction.deleteReply();
        } catch (e) {
            DebugUtils.error(
                `[Interaction Utils] Couldn't delete temp reply (${message}): ${e}`,
            );
        }
    }, 3000);
}

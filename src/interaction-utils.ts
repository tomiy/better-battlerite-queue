import {
    CommandInteraction,
    MessageComponentInteraction,
    MessageFlags,
    ModalSubmitInteraction,
} from 'discord.js';
import { DebugUtils } from './debug-utils';

export async function tempReply(
    interaction:
        | MessageComponentInteraction
        | CommandInteraction
        | ModalSubmitInteraction,
    message: string,
) {
    if (interaction.deferred) {
        await interaction.editReply(message);
    } else {
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        });
    }
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

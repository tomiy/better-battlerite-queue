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
    const reply = await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
    });
    setTimeout(async () => {
        try {
            await reply.delete();
        } catch (e) {
            DebugUtils.error(
                `[Interaction Utils] Couldn't delete temp reply (${message}): ${e}`,
            );
        }
    }, 3000);
}

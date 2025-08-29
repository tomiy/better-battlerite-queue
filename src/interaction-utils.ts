import {
    CommandInteraction,
    MessageComponentInteraction,
    MessageFlags,
    ModalSubmitInteraction,
} from 'discord.js';

export async function tempReply(
    interaction:
        | MessageComponentInteraction
        | CommandInteraction
        | ModalSubmitInteraction,
    reply: string,
) {
    interaction
        .reply({
            content: reply,
            flags: MessageFlags.Ephemeral,
        })
        .then((m) => setTimeout(() => m.delete(), 3000));
}

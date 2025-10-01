import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GameMode } from '../../../../.prisma';

export function buildQueueUI(gameMode: GameMode) {
    const joinButton = new ButtonBuilder()
        .setCustomId(`queueJoin_${gameMode.id}`)
        .setLabel('Join queue')
        .setStyle(ButtonStyle.Primary);

    const leaveButton = new ButtonBuilder()
        .setCustomId(`queueLeave_${gameMode.id}`)
        .setLabel('Leave queue')
        .setStyle(ButtonStyle.Danger);

    return [
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(joinButton)
            .addComponents(leaveButton),
    ];
}

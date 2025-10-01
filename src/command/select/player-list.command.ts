import { AnySelectMenuInteraction } from 'discord.js';
import { tempReply } from '../../discord/interaction.utils';
import { SelectCommand } from '../command';
import { botSync } from '../guard/bot/bot-sync.guard';

async function execute(interaction: AnySelectMenuInteraction) {
    await tempReply(interaction, 'Player list');
}

export const playerList: SelectCommand = {
    data: { name: 'playerList' },
    execute: execute,
    guards: [botSync],
};

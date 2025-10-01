import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { gameModeManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { formatListCodeBlock } from '../../../../../discord/format.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_MODE_LIST)
    .setDescription('List game modes')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame']);

    const modes = await gameModeManager.findGameModes(context.serverGame.id);

    if (!modes.length) {
        await tempReply(interaction, 'No game modes for this game!');
        return;
    }

    const modeNames = modes.map((m) => m.name);

    await tempReply(
        interaction,
        `Available game modes for ${context.serverGame.game.name}: ${formatListCodeBlock(modeNames)}`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const listGameModes: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame],
};

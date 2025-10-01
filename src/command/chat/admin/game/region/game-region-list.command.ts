import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { safeReply, tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { regionManager } from '../../../../../config/state';
import { formatListCodeBlock } from '../../../../../discord/format.utils';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_REGION_LIST)
    .setDescription('List regions')
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

    const regions = await regionManager.findGameRegions(context.serverGame.id);

    if (!regions.length) {
        await tempReply(
            interaction,
            `No regions found for ${context.serverGame.game.name}!`,
        );
        return;
    }

    const regionNames = regions.map((r) => r.name);

    await safeReply(
        interaction,
        `Available regions for ${context.serverGame.game.name}: ${formatListCodeBlock(regionNames)}`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const listGameRegions: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame],
};

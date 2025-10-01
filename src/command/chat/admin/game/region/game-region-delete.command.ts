import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingRegion } from '../../../../guard/game/matching-region.guard';
import { regionManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_REGION_DELETE)
    .setDescription('Add region')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('region_name')
            .setDescription('Region name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame', 'region']);

    const deletedRegion = await regionManager.deleteGameRegion(
        context.region.id,
    );

    if (deletedRegion) {
        await tempReply(interaction, 'Region deleted!');
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.regionName = interaction.options.getString('region_name', true);
}

export const deleteGameRegion: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingRegion],
};

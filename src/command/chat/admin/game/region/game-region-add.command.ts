import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { regionManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_REGION_ADD)
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

    ensureContext(context, ['server', 'serverGame']);

    const regionName = interaction.options.getString('region_name', true);

    const { matchingRegion } = await regionManager.findGameRegion(
        context.serverGame.id,
        regionName,
    );

    if (matchingRegion) {
        await tempReply(
            interaction,
            `Region ${matchingRegion.name} already added for ${context.serverGame.game.name}!`,
        );
        return;
    }

    const region = await regionManager.createGameRegion(
        context.serverGame.id,
        regionName,
    );

    if (region) {
        await tempReply(
            interaction,
            `${region.name} has been added for ${context.serverGame.game.name}!`,
        );
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const addGameRegion: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame],
};

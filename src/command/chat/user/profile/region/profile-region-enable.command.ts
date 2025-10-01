import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandName } from '../../../../command-name.type';
import { matchingRegion } from '../../../../guard/game/matching-region.guard';
import { matchingProfile } from '../../../../guard/member/matching-profile.guard';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { regionManager } from '../../../../../config/state';
import { ChatInputSubcommand } from '../../../../command';
import { matchingMember } from '../../../../guard/member/matching-member.guard';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { tempReply } from '../../../../../discord/interaction.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.PROFILE_REGION_ENABLE)
    .setDescription('Enable region')
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

    ensureContext(context, ['serverGame', 'member', 'profile', 'region']);

    const enabledRegion = await regionManager.setProfileRegionAvailability(
        context.region.id,
        context.profile.id,
        true,
    );

    if (enabledRegion) {
        await tempReply(
            interaction,
            `Enabled region ${context.region.name} for game ${context.serverGame.game.name}!`,
        );

        return;
    }

    await tempReply(
        interaction,
        'Could not enable region! It may already be enabled.',
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.regionName = interaction.options.getString('region_name', true);
}

export const enableProfileRegion: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [
        matchingServerGame,
        matchingMember,
        matchingRegion,
        matchingProfile,
    ],
};

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
import { queueManager, regionManager } from '../../../../../config/state';
import { ChatInputSubcommand } from '../../../../command';
import { matchingMember } from '../../../../guard/member/matching-member.guard';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { tempReply } from '../../../../../discord/interaction.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.PROFILE_REGION_DISABLE)
    .setDescription('Disable region')
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

    ensureContext(context, [
        'server',
        'serverGame',
        'member',
        'profile',
        'region',
    ]);

    const disabledRegion = await regionManager.setProfileRegionAvailability(
        context.region.id,
        context.profile.id,
        false,
    );

    if (disabledRegion) {
        await tempReply(
            interaction,
            `Disabled region ${context.region.name} for game ${context.serverGame.game.name}!`,
        );

        const hasRegions = await queueManager.hasRegions(context.profile.id);

        if (hasRegions === null) {
            await tempReply(
                interaction,
                'Error determining region availability',
            );
            return;
        }

        const existingQueueEntry = await queueManager.isQueuedInAnyMode(
            context.member.id,
        );

        if (!hasRegions && existingQueueEntry) {
            const deletedQueueEntryCount =
                await queueManager.deleteQueueEntries(
                    context.server,
                    context.member,
                );

            if (deletedQueueEntryCount) {
                await interaction.followUp({
                    flags: MessageFlags.Ephemeral,
                    content: 'No regions selected, queue left',
                });
                return;
            }
        }

        return;
    }

    await tempReply(
        interaction,
        'Could not disable region! It may already be disabled.',
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.regionName = interaction.options.getString('region_name', true);
}

export const disableProfileRegion: ChatInputSubcommand = {
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

import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandSubcommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { profileManager } from '../../../../config/state';
import { DebugUtils } from '../../../../debug.utils';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { matchingServerGame } from '../../../guard/game/matching-server-game.guard';
import { matchingMember } from '../../../guard/member/matching-member.guard';
import { matchingProfile } from '../../../guard/member/matching-profile.guard';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.PROFILE_EDIT)
    .setDescription('Edit profile')
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
    ensureContext(context, ['server', 'member', 'serverGame', 'profile']);

    const inGameNameInput = new TextInputBuilder()
        .setCustomId('inGameNameInput')
        .setLabel('Username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(context.profile.inGameName);
    const inGameNameRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            inGameNameInput,
        );

    const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel('Description')
        .setPlaceholder(
            'What characters/roles do you play? How chill are you? etc.',
        )
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(context.profile.description || '');
    const descriptionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            descriptionInput,
        );

    const profileModal = new ModalBuilder()
        .setCustomId(`profileModal-${interaction.id}`)
        .setTitle(`${context.serverGame.game.name} Registration form`)
        .addComponents(inGameNameRow, descriptionRow);

    await interaction.showModal(profileModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 600000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId === `profileModal-${interaction.id}`,
        });

        if (submitted) {
            const inGameName =
                submitted.fields.getTextInputValue('inGameNameInput');
            const description =
                submitted.fields.getTextInputValue('descriptionInput');

            const updatedServerGameProfile = await profileManager.updateProfile(
                context.profile.id,
                inGameName,
                description,
            );

            if (updatedServerGameProfile) {
                if (!context.server.registeredRoleId) {
                    await tempReply(
                        interaction,
                        'Something went wrong with the profile modal :/',
                    );
                    DebugUtils.error(
                        '[Profile Edit] No registered role, check bot logs',
                    );
                    return;
                }

                await context.member.roles.add(context.server.registeredRoleId);
                await tempReply(
                    submitted,
                    `Profile updated for ${context.serverGame.game.name}!`,
                );
            }
        } else {
            await tempReply(
                interaction,
                'Something went wrong with the profile modal :/',
            );
            DebugUtils.error(
                `[Profile Edit] Something went wrong with the profile modal`,
            );
        }
    } catch (e) {
        DebugUtils.error(`[Profile Edit] Timeout: ${e}`);
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const editProfile: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMember, matchingProfile],
};

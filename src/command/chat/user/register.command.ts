import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { profileManager } from '../../../config/state';
import { DebugUtils } from '../../../debug.utils';
import { tempReply } from '../../../discord/interaction.utils';
import { ChatInputCommand } from '../../command';
import { botCommandsChannel } from '../../guard/bot/bot-commands-channel.guard';
import { botSync } from '../../guard/bot/bot-sync.guard';
import { CommandContext, ensureContext } from '../../command-context.type';
import { matchingMember } from '../../guard/member/matching-member.guard';
import { matchingServerGame } from '../../guard/game/matching-server-game.guard';

const data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register')
    .addStringOption((o) =>
        o.setName('game_name').setDescription('Game name').setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['server', 'member', 'serverGame']);

    const serverGameProfile = await profileManager.findProfile(
        context.serverGame.id,
        context.member.id,
    );

    if (serverGameProfile) {
        await tempReply(
            interaction,
            `You are already registered for ${context.serverGame.game.name}!`,
        );
        return;
    }

    const registerModal = new ModalBuilder()
        .setCustomId(`registerModal-${interaction.id}`)
        .setTitle(`${context.serverGame.game.name} Registration form`)
        .addComponents();

    const inGameNameInput = new TextInputBuilder()
        .setCustomId('inGameNameInput')
        .setLabel('Username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
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
        .setRequired(false);
    const descriptionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            descriptionInput,
        );

    registerModal.addComponents(inGameNameRow, descriptionRow);

    await interaction.showModal(registerModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 600000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId === `registerModal-${interaction.id}`,
        });

        if (submitted) {
            const inGameName =
                submitted.fields.getTextInputValue('inGameNameInput');
            const description =
                submitted.fields.getTextInputValue('descriptionInput');

            const serverGameProfile = await profileManager.createProfile(
                context.serverGame.id,
                context.member.id,
                inGameName,
                description,
            );

            if (serverGameProfile) {
                if (!context.server.registeredRoleId) {
                    await tempReply(
                        interaction,
                        'Something went wrong with the registration modal :/',
                    );
                    DebugUtils.error(
                        '[Register] No registered role, check bot logs',
                    );
                    return;
                }

                await context.member.roles.add(context.server.registeredRoleId);
                await tempReply(
                    submitted,
                    `You are now registered for ${context.serverGame.game.name}!`,
                );
            }
        } else {
            await tempReply(
                interaction,
                'Something went wrong with the registration modal :/',
            );
            DebugUtils.error(
                `[Register] Something went wrong with the registration modal`,
            );
        }
    } catch (e) {
        DebugUtils.error(`[Register] Timeout: ${e}`);
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const register: ChatInputCommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [botSync, botCommandsChannel, matchingMember, matchingServerGame],
};

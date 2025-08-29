import {
    ActionRowBuilder,
    CommandInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Guild as dbGuild } from '../../../.prisma';
import { prisma } from '../../config';
import { DebugUtils } from '../../debug-utils';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { tempReply } from '../../interaction-utils';
import { Command } from '../command';

const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Profile');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const initialUser = await prisma.user.findFirst({
        where: { userDiscordId: interaction.user.id, guildId: dbGuild.id },
        include: { regions: true },
    });

    if (!initialUser) {
        tempReply(interaction, 'You are not registered! use /register');
        return;
    }

    const profileModal = new ModalBuilder()
        .setCustomId('profileModal')
        .setTitle('Profile form')
        .addComponents();

    const inGameNameInput = new TextInputBuilder()
        .setCustomId('inGameNameInput')
        .setLabel('Battlerite username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(initialUser.inGameName);
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
        .setValue(initialUser.description || '');
    const descriptionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            descriptionInput,
        );

    profileModal.addComponents(inGameNameRow, descriptionRow);

    await interaction.showModal(profileModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 60000,
            filter: (i) => i.user.id === interaction.user.id,
        });

        if (submitted) {
            const inGameName =
                submitted.fields.getTextInputValue('inGameNameInput');
            const description =
                submitted.fields.getTextInputValue('descriptionInput');

            const user = await prisma.user.update({
                where: {
                    userDiscordId: interaction.user.id,
                    guildId: dbGuild.id,
                },
                data: {
                    inGameName: inGameName,
                    description: description,
                },
            });

            if (user) {
                tempReply(submitted, 'Profile updated!');
            }
        }
    } catch (e) {
        DebugUtils.error(`[Profile] Timeout: ${e}`);
    }
}

export const profile: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel],
};

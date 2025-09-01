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
    const initialMember = await prisma.member.findFirst({
        where: { discordId: interaction.user.id, guildId: dbGuild.id },
        include: { regions: true },
    });

    if (!initialMember) {
        await tempReply(interaction, 'You are not registered! use /register');
        return;
    }

    const profileModal = new ModalBuilder()
        .setCustomId(`profileModal-${interaction.id}`)
        .setTitle('Profile form')
        .addComponents();

    const inGameNameInput = new TextInputBuilder()
        .setCustomId('inGameNameInput')
        .setLabel('Battlerite username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(initialMember.inGameName);
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
        .setValue(initialMember.description || '');
    const descriptionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            descriptionInput,
        );

    profileModal.addComponents(inGameNameRow, descriptionRow);

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

            const member = await prisma.member.update({
                where: {
                    discordId: interaction.user.id,
                    guildId: dbGuild.id,
                },
                data: {
                    inGameName: inGameName,
                    description: description,
                },
            });

            if (member) {
                await tempReply(submitted, 'Profile updated!');
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

import {
    ActionRowBuilder,
    CommandInteraction,
    GuildMember,
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
    .setName('register')
    .setDescription('Register');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const user = await prisma.user.findFirst({
        where: { userDiscordId: interaction.user.id, guildId: dbGuild.id },
    });

    if (user) {
        tempReply(interaction, 'You are already registered!');
        return;
    }

    const registerModal = new ModalBuilder()
        .setCustomId('registerModal')
        .setTitle('Registration form')
        .addComponents();

    const inGameNameInput = new TextInputBuilder()
        .setCustomId('inGameNameInput')
        .setLabel('Battlerite username')
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
            time: 60000,
            filter: (i) => i.user.id === interaction.user.id,
        });

        if (submitted) {
            const inGameName =
                submitted.fields.getTextInputValue('inGameNameInput');
            const description =
                submitted.fields.getTextInputValue('descriptionInput');

            const user = await prisma.user.create({
                data: {
                    userDiscordId: interaction.user.id,
                    guildId: dbGuild.id,
                    inGameName: inGameName,
                    description: description,
                },
            });

            if (user) {
                await (interaction.member as GuildMember)?.roles.add(
                    dbGuild.registeredRole!,
                );
                tempReply(submitted, 'You are now registered!');
            }
        } else {
            tempReply(
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

export const register: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel],
};

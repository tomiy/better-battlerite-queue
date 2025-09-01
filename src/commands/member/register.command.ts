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
    const member = await prisma.member.findFirst({
        where: { discordId: interaction.user.id, guildId: dbGuild.id },
    });

    if (member) {
        await tempReply(interaction, 'You are already registered!');
        return;
    }

    const registerModal = new ModalBuilder()
        .setCustomId(`registerModal-${interaction.id}`)
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

            const member = await prisma.member.create({
                data: {
                    discordId: interaction.user.id,
                    guildId: dbGuild.id,
                    inGameName: inGameName,
                    description: description,
                },
            });

            if (member.id) {
                if (!dbGuild.registeredRole) {
                    throw new Error(
                        '[Register] No registered role, check bot logs',
                    );
                }

                await (interaction.member as GuildMember)?.roles.add(
                    dbGuild.registeredRole,
                );
                await tempReply(submitted, 'You are now registered!');
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

export const register: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel],
};

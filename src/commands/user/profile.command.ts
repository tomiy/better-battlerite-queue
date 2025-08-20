import {
    ActionRowBuilder,
    CommandInteraction,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Guild as dbGuild, Region } from '../../../.prisma';
import { prisma } from '../../config';
import { DebugUtils } from '../../debug-utils';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { Command } from '../command';

const validRegionStrings: string[] = Object.values(Region);

const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Profile');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const initialUser = await prisma.user.findFirst({
        where: { userDiscordId: interaction.user.id, guildId: dbGuild.id },
        include: { region: true },
    });

    if (!initialUser) {
        await interaction.reply({
            content: 'You are not registered! use /register',
            flags: MessageFlags.Ephemeral,
        });
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

    const regionInput = new TextInputBuilder()
        .setCustomId('regionInput')
        .setLabel(`Region(s) (available regions: ${validRegionStrings})`)
        .setPlaceholder('Comma separated list (example: EU,NA)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(initialUser.region.map((r) => r.region).toString());
    const regionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            regionInput,
        );

    profileModal.addComponents(inGameNameRow, regionRow);

    await interaction.showModal(profileModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 60000,
            filter: (i) => i.user.id === interaction.user.id,
        });

        if (submitted) {
            const inGameName =
                submitted.fields.getTextInputValue('inGameNameInput');

            const regions = submitted.fields
                .getTextInputValue('regionInput')
                .split(',')
                .map((r) => r.trim().toUpperCase());

            for (const region of regions) {
                if (!validRegionStrings.includes(region)) {
                    submitted.reply({
                        content: `Invalid region: ${region}. Available regions: ${validRegionStrings}`,
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
            }

            const userRegions = regions.map((r) => ({
                region: r as Region,
            }));

            const deleted = await prisma.userRegion.deleteMany({
                where: {
                    userId: initialUser.id,
                },
            });

            if (!deleted) {
                throw new Error('[Profile] Could not delete user regions!');
            }

            const user = await prisma.user.update({
                where: {
                    userDiscordId: interaction.user.id,
                    guildId: dbGuild.id,
                },
                data: {
                    inGameName: inGameName,
                    region: {
                        createMany: {
                            data: userRegions,
                        },
                    },
                },
            });

            if (user) {
                await submitted.reply({
                    content: `Profile updated!`,
                    flags: MessageFlags.Ephemeral,
                });
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

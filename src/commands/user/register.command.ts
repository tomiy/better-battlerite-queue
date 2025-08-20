import {
    ActionRowBuilder,
    CommandInteraction,
    GuildMember,
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
    .setName('register')
    .setDescription('Register');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const user = await prisma.user.findFirst({
        where: { userDiscordId: interaction.user.id, guildId: dbGuild.id },
    });

    if (user) {
        await interaction.reply({
            content: 'You are already registered!',
            flags: MessageFlags.Ephemeral,
        });
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

    const regionInput = new TextInputBuilder()
        .setCustomId('regionInput')
        .setLabel(`Region(s) (available regions: ${validRegionStrings})`)
        .setPlaceholder('Comma separated list (example: EU,NA)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const regionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            regionInput,
        );

    registerModal.addComponents(inGameNameRow, regionRow);

    await interaction.showModal(registerModal);

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

            const user = await prisma.user.create({
                data: {
                    userDiscordId: interaction.user.id,
                    guildId: dbGuild.id,
                    inGameName: inGameName,
                    region: {
                        createMany: {
                            data: userRegions,
                        },
                    },
                },
            });

            if (user) {
                await (interaction.member as GuildMember)?.roles.add(
                    dbGuild.registeredRole!,
                );
                await submitted.reply({
                    content: `You are now registered!`,
                    flags: MessageFlags.Ephemeral,
                });
            }
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

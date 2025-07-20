import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, CommandInteraction, ComponentType, RoleSelectMenuBuilder, SlashCommandBuilder } from 'discord.js';
import { PrismaClient } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';

export const data = new SlashCommandBuilder().setName('settings').setDescription('Change bot settings');

export async function execute(interaction: CommandInteraction) {
    const prisma = new PrismaClient();

    if (interaction.member?.user.id === interaction.guild?.ownerId) {
        const commandsChannelSelect = new ChannelSelectMenuBuilder().setCustomId('commandsChannelSelect').setPlaceholder('Commands channel').setChannelTypes([ChannelType.GuildText]);
        const commandsChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(commandsChannelSelect);

        const queueChannelSelect = new ChannelSelectMenuBuilder().setCustomId('queueChannelSelect').setPlaceholder('Queue channel').setChannelTypes([ChannelType.GuildText]);
        const queueChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(queueChannelSelect);

        const botModRoleSelect = new RoleSelectMenuBuilder().setCustomId('botModRoleSelect').setPlaceholder('Bot Moderator role');
        const botModRoleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(botModRoleSelect);

        const queueRoleSelect = new RoleSelectMenuBuilder().setCustomId('queueRoleSelect').setPlaceholder('Queue role');
        const queueRoleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(queueRoleSelect);

        const confirmButton = new ButtonBuilder().setCustomId('confirmButton').setLabel('Confirm').setStyle(ButtonStyle.Success);
        const confirmButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

        const channelMessage = await interaction.reply({
            content: 'Select the relevant discord channels and roles for each function: ',
            components: [commandsChannelRow, queueChannelRow, botModRoleRow, queueRoleRow, confirmButtonRow],
            withResponse: true,
        });

        try {
            const channelSelectCollector = channelMessage.resource?.message?.createMessageComponentCollector({ componentType: ComponentType.ChannelSelect, time: 60000 });
            const roleSelectCollector = channelMessage.resource?.message?.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, time: 60000 });
            const buttonCollector = channelMessage.resource?.message?.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            channelSelectCollector?.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case 'commandsChannelSelect':
                            await prisma.guild.update({
                                where: {
                                    guildId: interaction.guildId!,
                                },
                                data: {
                                    botCommandsChannel: i.values[0],
                                },
                            });
                            await i.update({ content: 'Bot commands channel updated!' });
                            break;
                        case 'queueChannelSelect':
                            await prisma.guild.update({
                                where: {
                                    guildId: interaction.guildId!,
                                },
                                data: {
                                    queueChannel: i.values[0],
                                },
                            });
                            await i.update({ content: 'Queue channel updated!' });
                            break;
                        default:
                            await i.update({ content: 'Impossible case, check logs' });
                    }
                }
            });

            roleSelectCollector?.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case 'botModRoleSelect':
                            await prisma.guild.update({
                                where: {
                                    guildId: interaction.guildId!,
                                },
                                data: {
                                    botModRole: i.values[0],
                                },
                            });
                            await i.update({ content: 'Bot Moderator role updated!' });
                            break;
                        case 'queueRoleSelect':
                            await prisma.guild.update({
                                where: {
                                    guildId: interaction.guildId!,
                                },
                                data: {
                                    queueRole: i.values[0],
                                },
                            });
                            await i.update({ content: 'Queue role updated!' });
                            break;
                        default:
                            await i.update({ content: 'Impossible case, check logs' });
                    }
                }
            });

            buttonCollector?.on('collect', async (i) => {
                if (i.user.id === interaction.user.id) {
                    await interaction.editReply({ content: 'Settings saved!', components: [] });
                    await new Promise((r) => setTimeout(r, 2000));
                    await interaction.deleteReply();
                }
            });
        } catch (e) {
            DebugUtils.error(`[Setup] Error: ${e}`);
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    } else {
        interaction.reply('Only the guild owner can execute this command');
    }
}

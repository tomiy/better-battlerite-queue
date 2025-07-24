import {
    ActionRowBuilder,
    channelMention,
    ChannelSelectMenuBuilder,
    ChannelType,
    ComponentType,
    Guild,
    OverwriteType,
    PermissionFlagsBits,
    roleMention,
    RoleSelectMenuBuilder,
    TextChannel,
} from 'discord.js';
import { PrismaClient } from '../../.prisma';
import { DebugUtils } from '../debug.utils';

export async function initSettings(clientUserId: string, guild: Guild) {
    const prisma = new PrismaClient();
    try {
        let settingsChannel = guild.channels.cache.find((c) => c.name === 'bbq-settings') as TextChannel | undefined;

        if (!settingsChannel) {
            const everyoneRole = guild.roles.everyone.id;
            settingsChannel = await guild.channels.create({
                name: 'bbq-settings',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { type: OverwriteType.Member, id: clientUserId, allow: [PermissionFlagsBits.ViewChannel] },
                    { type: OverwriteType.Role, id: everyoneRole!, deny: [PermissionFlagsBits.ViewChannel] },
                ],
            });

            if (!settingsChannel) {
                DebugUtils.error('[Setup] Could not create settings channel');
                return;
            }
        }

        await settingsChannel.bulkDelete(100);

        const commandsChannelSelect = new ChannelSelectMenuBuilder().setCustomId('commandsChannelSelect').setPlaceholder('Commands channel').setChannelTypes([ChannelType.GuildText]);
        const commandsChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(commandsChannelSelect);

        const queueChannelSelect = new ChannelSelectMenuBuilder().setCustomId('queueChannelSelect').setPlaceholder('Queue channel').setChannelTypes([ChannelType.GuildText]);
        const queueChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(queueChannelSelect);

        const botModRoleSelect = new RoleSelectMenuBuilder().setCustomId('botModRoleSelect').setPlaceholder('Bot Moderator role');
        const botModRoleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(botModRoleSelect);

        const registeredRoleSelect = new RoleSelectMenuBuilder().setCustomId('registeredRoleSelect').setPlaceholder('Registered role');
        const registeredRoleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(registeredRoleSelect);

        const queueRoleSelect = new RoleSelectMenuBuilder().setCustomId('queueRoleSelect').setPlaceholder('Queue role');
        const queueRoleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(queueRoleSelect);

        const commandsChannelMessage = await settingsChannel.send({ components: [commandsChannelRow] });
        const queueChannelMessage = await settingsChannel.send({ components: [queueChannelRow] });

        const botModRoleMessage = await settingsChannel.send({ components: [botModRoleRow] });
        const registeredRoleMessage = await settingsChannel.send({ components: [registeredRoleRow] });
        const queueRoleMessage = await settingsChannel.send({ components: [queueRoleRow] });

        const commandsChannelSelectCollector = commandsChannelMessage.createMessageComponentCollector({ componentType: ComponentType.ChannelSelect });
        const queueChannelSelectCollector = queueChannelMessage.createMessageComponentCollector({ componentType: ComponentType.ChannelSelect });

        const botModRoleSelectCollector = botModRoleMessage.createMessageComponentCollector({ componentType: ComponentType.RoleSelect });
        const registeredRoleSelectCollector = registeredRoleMessage.createMessageComponentCollector({ componentType: ComponentType.RoleSelect });
        const queueRoleSelectCollector = queueRoleMessage.createMessageComponentCollector({ componentType: ComponentType.RoleSelect });

        commandsChannelSelectCollector?.on('collect', async (i) => {
            const updatedGuild = await prisma.guild.upsert({
                where: { guildDiscordId: guild.id },
                create: {
                    guildDiscordId: guild.id,
                    botCommandsChannel: i.values[0],
                },
                update: { botCommandsChannel: i.values[0] },
            });
            await i.update({ content: `Bot commands channel updated to ${channelMention(updatedGuild.botCommandsChannel!)}` });
        });

        queueChannelSelectCollector?.on('collect', async (i) => {
            const updatedGuild = await prisma.guild.upsert({
                where: { guildDiscordId: guild.id },
                create: {
                    guildDiscordId: guild.id,
                    queueChannel: i.values[0],
                },
                update: { queueChannel: i.values[0] },
            });
            await i.update({ content: `Queue commands channel updated to ${channelMention(updatedGuild.queueChannel!)}` });
        });

        botModRoleSelectCollector?.on('collect', async (i) => {
            const updatedGuild = await prisma.guild.upsert({
                where: { guildDiscordId: guild.id },
                create: {
                    guildDiscordId: guild.id,
                    botModRole: i.values[0],
                },
                update: { botModRole: i.values[0] },
            });
            await i.update({ content: `Bot Moderator role updated to ${roleMention(updatedGuild.botModRole!)}` });
        });

        registeredRoleSelectCollector?.on('collect', async (i) => {
            const updatedGuild = await prisma.guild.upsert({
                where: { guildDiscordId: guild.id },
                create: {
                    guildDiscordId: guild.id,
                    registeredRole: i.values[0],
                },
                update: { registeredRole: i.values[0] },
            });
            await i.update({ content: `Registered role updated to ${roleMention(updatedGuild.registeredRole!)}` });
        });

        queueRoleSelectCollector?.on('collect', async (i) => {
            const updatedGuild = await prisma.guild.upsert({
                where: { guildDiscordId: guild.id },
                create: {
                    guildDiscordId: guild.id,
                    queueRole: i.values[0],
                },
                update: { queueRole: i.values[0] },
            });
            await i.update({ content: `Queue role updated to ${roleMention(updatedGuild.queueRole!)}` });
        });
    } catch (e) {
        DebugUtils.error(`[Setup] Error: ${e}`);
    }
}

import {
    CategoryChannel,
    ChannelType,
    Guild,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import {
    botCommandsChannelName,
    categoryChannelName,
    matchHistoryChannelName,
    prisma,
    queueChannelName,
} from '../config';
import { DebugUtils } from '../debug-utils';

export async function setupChannels(guild: Guild) {
    try {
        DebugUtils.debug(
            `[Setup channels] Syncing channels for guild ${guild.id}`,
        );

        let categoryChannel = guild.channels.cache.find(
            (c) => c.name === categoryChannelName,
        ) as CategoryChannel | undefined;
        let botCommandsChannel = guild.channels.cache.find(
            (c) =>
                c.name === botCommandsChannelName &&
                c.parent?.name === categoryChannelName,
        ) as TextChannel | undefined;
        let queueChannel = guild.channels.cache.find(
            (c) =>
                c.name === queueChannelName &&
                c.parent?.name === categoryChannelName,
        ) as TextChannel | undefined;
        let matchHistoryChannel = guild.channels.cache.find(
            (c) =>
                c.name === matchHistoryChannelName &&
                c.parent?.name === categoryChannelName,
        ) as TextChannel | undefined;

        if (!categoryChannel) {
            DebugUtils.debug(
                `[Setup channels] Creating category channel ${categoryChannelName}`,
            );

            categoryChannel = await guild.channels.create({
                name: categoryChannelName,
                type: ChannelType.GuildCategory,
                position: 0,
            });

            if (!categoryChannel) {
                DebugUtils.error(
                    '[Setup channels] Could not create category channel',
                );
                return;
            }
        }

        if (!botCommandsChannel) {
            DebugUtils.debug(
                `[Setup channels] Creating channel ${botCommandsChannelName}`,
            );

            botCommandsChannel = await guild.channels.create({
                name: botCommandsChannelName,
                parent: categoryChannel,
                type: ChannelType.GuildText,
            });

            if (!botCommandsChannel) {
                DebugUtils.error(
                    '[Setup channels] Could not create bot commands channel',
                );
                return;
            }
        }

        if (!queueChannel) {
            DebugUtils.debug(
                `[Setup channels] Creating channel ${queueChannelName}`,
            );

            queueChannel = await guild.channels.create({
                name: queueChannelName,
                parent: categoryChannel,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: guild.members.me?.id || '',
                        allow: [PermissionsBitField.Flags.SendMessages],
                    },
                ],
            });

            if (!queueChannel) {
                DebugUtils.error(
                    '[Setup channels] Could not create queue channel',
                );
                return;
            }
        }

        await queueChannel.bulkDelete(100);

        if (!matchHistoryChannel) {
            DebugUtils.debug(
                `[Setup channels] Creating channel ${matchHistoryChannelName}`,
            );

            matchHistoryChannel = await guild.channels.create({
                name: matchHistoryChannelName,
                parent: categoryChannel,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: guild.members.me?.id || '',
                        allow: [PermissionsBitField.Flags.SendMessages],
                    },
                ],
            });

            if (!matchHistoryChannel) {
                DebugUtils.error(
                    '[Setup channels] Could not create match history channel',
                );
                return;
            }
        }

        await prisma.guild.update({
            where: { discordId: guild.id },
            data: {
                botCommandsChannel: botCommandsChannel.id,
                queueChannel: queueChannel.id,
                matchHistoryChannel: matchHistoryChannel.id,
            },
        });

        DebugUtils.debug(
            `[Setup channels] Successfully synced channels for guild ${guild.id}`,
        );
    } catch (e) {
        DebugUtils.error(`[Setup channels] Error: ${e}`);
    }
}

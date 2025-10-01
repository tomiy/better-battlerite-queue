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
    queueChannelName,
} from '../../config/defaults';
import { serverManager } from '../../config/state';
import { DebugUtils } from '../../debug.utils';

export async function syncChannels(guild: Guild) {
    try {
        DebugUtils.debug(
            `[Sync channels] Syncing channels for guild ${guild.id}`,
        );

        const server = await serverManager.findServerByGuildId(guild.id);

        if (!server) {
            DebugUtils.error(
                `[Sync channels] No matching server for guild ${guild.id}`,
            );
            return;
        }

        let categoryChannel = guild.channels.cache.find(
            (c) =>
                c.id === server.categoryChannelId ||
                c.name === categoryChannelName,
        ) as CategoryChannel | undefined;
        let botCommandsChannel = guild.channels.cache.find(
            (c) =>
                c.id === server.botCommandsChannelId ||
                (c.name === botCommandsChannelName &&
                    c.parent?.name === categoryChannelName),
        ) as TextChannel | undefined;
        let queueChannel = guild.channels.cache.find(
            (c) =>
                c.id === server.queueChannelId ||
                (c.name === queueChannelName &&
                    c.parent?.name === categoryChannelName),
        ) as TextChannel | undefined;
        let matchHistoryChannel = guild.channels.cache.find(
            (c) =>
                c.id === server.matchHistoryChannelId ||
                (c.name === matchHistoryChannelName &&
                    c.parent?.name === categoryChannelName),
        ) as TextChannel | undefined;

        if (!categoryChannel) {
            DebugUtils.debug(
                `[Sync channels] Creating category channel ${categoryChannelName}`,
            );

            categoryChannel = await guild.channels.create({
                name: categoryChannelName,
                type: ChannelType.GuildCategory,
                position: 0,
            });

            if (!categoryChannel) {
                DebugUtils.error(
                    '[Sync channels] Could not create category channel',
                );
                return;
            }
        }

        if (!botCommandsChannel) {
            DebugUtils.debug(
                `[Sync channels] Creating channel ${botCommandsChannelName}`,
            );

            botCommandsChannel = await guild.channels.create({
                name: botCommandsChannelName,
                parent: categoryChannel,
                type: ChannelType.GuildText,
            });

            if (!botCommandsChannel) {
                DebugUtils.error(
                    '[Sync channels] Could not create bot commands channel',
                );
                return;
            }
        }

        if (!queueChannel) {
            DebugUtils.debug(
                `[Sync channels] Creating channel ${queueChannelName}`,
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
                    '[Sync channels] Could not create queue channel',
                );
                return;
            }
        }

        if (!matchHistoryChannel) {
            DebugUtils.debug(
                `[Sync channels] Creating channel ${matchHistoryChannelName}`,
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
                    '[Sync channels] Could not create match history channel',
                );
                return;
            }
        }

        await serverManager.updateServer(server.id, {
            categoryChannelId: categoryChannel.id,
            botCommandsChannelId: botCommandsChannel.id,
            queueChannelId: queueChannel.id,
            matchHistoryChannelId: matchHistoryChannel.id,
        });

        DebugUtils.debug(
            `[Sync channels] Successfully synced channels for guild ${guild.id}`,
        );
    } catch (e) {
        DebugUtils.error(`[Sync channels] Error: ${e}`);
    }
}

import { Guild } from 'discord.js';
import {
    botModRoleName,
    matchRoleName,
    queueRoleName,
    registeredRoleName,
} from '../../config/defaults';
import { serverManager } from '../../config/state';
import { DebugUtils } from '../../debug.utils';

export async function syncRoles(guild: Guild) {
    try {
        DebugUtils.debug(`[Sync roles] Syncing roles for guild ${guild.id}`);

        const server = await serverManager.findServerByGuildId(guild.id);

        if (!server) {
            DebugUtils.error(
                `[Sync roles] No matching server for guild ${guild.id}`,
            );
            return;
        }

        let registeredRole = guild.roles.cache.find(
            (r) =>
                r.id === server.registeredRoleId ||
                r.name === registeredRoleName,
        );
        let queueRole = guild.roles.cache.find(
            (r) => r.id === server.queueRoleId || r.name === queueRoleName,
        );
        let matchRole = guild.roles.cache.find(
            (r) => r.id === server.matchRoleId || r.name === matchRoleName,
        );
        let botModRole = guild.roles.cache.find(
            (r) => r.id === server.botModRoleId || r.name === botModRoleName,
        );

        if (!registeredRole) {
            DebugUtils.debug(
                `[Sync roles] Creating role ${registeredRoleName}`,
            );

            registeredRole = await guild.roles.create({
                name: registeredRoleName,
                position: 0,
            });

            if (!registeredRole) {
                DebugUtils.error(
                    '[Sync roles] Could not create registered role',
                );
                return;
            }
        }

        if (!queueRole) {
            DebugUtils.debug(`[Sync roles] Creating role ${queueRoleName}`);

            queueRole = await guild.roles.create({
                name: queueRoleName,
                color: 'Green',
                hoist: true,
                position: 0,
            });

            if (!queueRole) {
                DebugUtils.error('[Sync roles] Could not create queue role');
                return;
            }
        }

        if (!matchRole) {
            DebugUtils.debug(`[Sync roles] Creating role ${matchRoleName}`);

            matchRole = await guild.roles.create({
                name: matchRoleName,
                color: 'Orange',
                hoist: true,
                position: 0,
            });

            if (!matchRole) {
                DebugUtils.error('[Sync roles] Could not create match role');
                return;
            }
        }

        if (!botModRole) {
            DebugUtils.debug(`[Sync roles] Creating role ${botModRoleName}`);

            botModRole = await guild.roles.create({
                name: botModRoleName,
                color: 'Blurple',
                position: 0,
            });

            if (!botModRole) {
                DebugUtils.error(
                    '[Sync roles] Could not create bot moderator role',
                );
                return;
            }
        }

        await serverManager.updateServer(server.id, {
            registeredRoleId: registeredRole.id,
            queueRoleId: queueRole.id,
            matchRoleId: matchRole.id,
            botModRoleId: botModRole.id,
        });

        DebugUtils.debug(
            `[Sync roles] Successfully synced roles for guild ${guild.id}`,
        );
    } catch (e) {
        DebugUtils.error(`[Sync roles] Error: ${e}`);
    }
}

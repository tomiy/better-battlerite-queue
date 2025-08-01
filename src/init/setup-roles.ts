import { Guild } from 'discord.js';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';

const registeredRoleName = 'BBQ Registered';
const queueRoleName = 'BBQ In Queue';
const botModRoleName = 'BBQ Bot Moderator';

export async function setupRoles(guild: Guild) {
    try {
        DebugUtils.debug(`[Setup roles] Syncing roles for guild ${guild.id}`);

        let registeredRole = guild.roles.cache.find((r) => r.name === registeredRoleName);
        let queueRole = guild.roles.cache.find((r) => r.name === queueRoleName);
        let botModRole = guild.roles.cache.find((r) => r.name === botModRoleName);

        if (!registeredRole) {
            DebugUtils.debug(`[Setup roles] Creating role ${registeredRoleName}`);

            registeredRole = await guild.roles.create({
                name: registeredRoleName,
                position: 0,
            });

            if (!registeredRole) {
                DebugUtils.error('[Setup roles] Could not create registered role');
                return;
            }
        }

        if (!queueRole) {
            DebugUtils.debug(`[Setup roles] Creating role ${queueRoleName}`);

            queueRole = await guild.roles.create({
                name: queueRoleName,
                color: 'Green',
                hoist: true,
                position: 0,
            });

            if (!queueRole) {
                DebugUtils.error('[Setup roles] Could not create queue role');
                return;
            }
        }

        if (!botModRole) {
            DebugUtils.debug(`[Setup roles] Creating role ${botModRoleName}`);

            botModRole = await guild.roles.create({
                name: botModRoleName,
                color: 'Blurple',
                position: 0,
            });

            if (!botModRole) {
                DebugUtils.error('[Setup roles] Could not create bot moderator role');
                return;
            }
        }

        await prisma.guild.update({
            where: { guildDiscordId: guild.id },
            data: {
                registeredRole: registeredRole.id,
                queueRole: queueRole.id,
                botModRole: botModRole.id,
            },
        });

        DebugUtils.debug(`[Setup roles] Successfully synced roles for guild ${guild.id}`);
    } catch (e) {
        DebugUtils.error(`[Setup roles] Error: ${e}`);
    }
}

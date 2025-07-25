import { Guild } from 'discord.js';
import { PrismaClient } from '../../.prisma';
import { DebugUtils } from '../debug-utils';

export async function cleanup(guild: Guild) {
    const prisma = new PrismaClient();

    try {
        DebugUtils.debug(`[Cleanup] Cleaning up for guild ${guild.id}`);

        const dbGuild = await prisma.guild.findFirstOrThrow({ where: { guildDiscordId: guild.id } });

        const queueRole = dbGuild.queueRole;

        if (queueRole === null) {
            throw new Error('[Cleanup] No queue role found, check bot logs');
        }

        const members = await guild.members.fetch();
        const queuedMembers = members.filter((m) => m.roles.cache.has(queueRole));

        if (queuedMembers.size) {
            DebugUtils.debug('[Cleanup] Purging old queued users...');

            queuedMembers.forEach(async (m) => await m.roles.remove(queueRole));

            DebugUtils.debug('[Cleanup] Purged old queued users');
        }

        DebugUtils.debug(`[Cleanup] Successfully cleaned up for guild ${guild.id}`);
    } catch (e) {
        DebugUtils.error(`[Cleanup] Error: ${e}`);
    }
}

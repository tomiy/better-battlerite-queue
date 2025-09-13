import { Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';

export async function createGuild(
    guildId: string,
    callback?: (guild: dbGuild) => void,
) {
    try {
        const createdGuild = await prisma.guild.create({
            data: { discordId: guildId },
        });

        if (createdGuild) {
            DebugUtils.debug(
                `[DB Guild] Created guild with guild id ${createdGuild.discordId}`,
            );
            if (callback) {
                callback(createdGuild);
            }
        }
    } catch (e) {
        DebugUtils.error(`[DB Guild] Error creating guild: ${e}`);
    }
}

export async function deleteGuild(
    guildId: string,
    callback?: (guild: dbGuild) => void,
) {
    try {
        const deletedGuild = await prisma.guild.delete({
            where: { discordId: guildId },
        });

        if (deletedGuild) {
            DebugUtils.debug(
                `[DB Guild] Deleted guild with guild id ${deletedGuild.discordId}`,
            );

            if (callback) {
                callback(deletedGuild);
            }
        }
    } catch (e) {
        DebugUtils.error(`[DB Guild] Error deleting guild: ${e}`);
    }
}

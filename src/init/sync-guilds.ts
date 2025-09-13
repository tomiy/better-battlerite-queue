import { Guild } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { client } from '../config';
import { createGuild, deleteGuild } from '../db/guild-functions';

export async function syncGuilds(dbGuilds: dbGuild[]) {
    const syncedGuilds: Guild[] = [];

    for (const dbGuild of dbGuilds) {
        const clientGuild = client.guilds.cache.get(dbGuild.discordId);

        if (!clientGuild) {
            await deleteGuild(dbGuild.discordId);
            continue;
        }

        syncedGuilds.push(clientGuild);
    }

    for (const [clientGuildId, clientGuild] of client.guilds.cache) {
        const syncedGuild = syncedGuilds.find(
            (syncedGuild) => syncedGuild.id === clientGuildId,
        );
        const dbGuild = dbGuilds.find(
            (dbGuild) => dbGuild.discordId === clientGuildId,
        );

        if (!syncedGuild && !dbGuild) {
            await createGuild(clientGuildId, () => {
                syncedGuilds.push(clientGuild);
            });
        }
    }

    return syncedGuilds;
}

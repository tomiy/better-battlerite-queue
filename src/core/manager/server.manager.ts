import { Client, Guild } from 'discord.js';
import { Server } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import { Manager } from './manager';

export type ServerUpdateData = {
    categoryChannelId?: string;
    botCommandsChannelId?: string;
    queueChannelId?: string;
    matchHistoryChannelId?: string;
    registeredRoleId?: string;
    queueRoleId?: string;
    matchRoleId?: string;
    botModRoleId?: string;
};

export class ServerManager extends Manager {
    async findServerGame(serverId: number, gameName: string) {
        const serverGames = await this.findServerGames(serverId);

        const matchingServerGame = serverGames.find(
            (g) => g.game.name.toLowerCase() === gameName.toLowerCase(),
        );
        const validGameNames = serverGames.map((g) => g.game.name);

        return { matchingServerGame, validGameNames };
    }

    async createServer(discordId: string): Promise<Server | null> {
        try {
            const createdServer = await this.prisma.server.create({
                data: { discordId },
            });

            if (createdServer) {
                DebugUtils.debug(
                    `[Server Manager] Created server with server id ${createdServer.id}`,
                );

                return createdServer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Server Manager] Error creating server: ${e}`);
        }

        return null;
    }

    async deleteServer(discordId: string): Promise<Server | null> {
        try {
            const deletedServer = await this.prisma.server.delete({
                where: { discordId },
            });

            if (deletedServer) {
                DebugUtils.debug(
                    `[Server Manager] Deleted server with server id ${deletedServer.id}`,
                );

                return deletedServer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Server Manager] Error deleting server: ${e}`);
        }

        return null;
    }

    async syncServers(client: Client): Promise<Guild[]> {
        const servers = await this.prisma.server.findMany();

        const syncedGuilds: Guild[] = [];

        for (const server of servers) {
            const clientGuild = client.guilds.cache.get(server.discordId);

            if (!clientGuild) {
                await this.deleteServer(server.discordId);
                continue;
            }

            syncedGuilds.push(clientGuild);
        }

        for (const [clientGuildId, clientGuild] of client.guilds.cache) {
            const syncedGuild = syncedGuilds.find(
                (syncedGuild) => syncedGuild.id === clientGuildId,
            );
            const server = servers.find(
                (dbGuild) => dbGuild.discordId === clientGuildId,
            );

            if (!syncedGuild && !server) {
                await this.createServer(clientGuildId);
                syncedGuilds.push(clientGuild);
            }
        }

        return syncedGuilds;
    }

    async findServerGames(serverId: number) {
        try {
            return await this.prisma.serverGame.findMany({
                where: { serverId },
                include: {
                    game: { include: { terrains: true, characters: true } },
                },
            });
        } catch (e) {
            DebugUtils.error(
                `[Server Manager] Error fetching server games: ${e}`,
            );
        }

        return [];
    }

    async createServerGame(serverId: number, gameId: number) {
        try {
            const createdServerGame = await this.prisma.serverGame.create({
                data: { serverId, gameId },
            });

            if (createdServerGame) {
                DebugUtils.debug(
                    `[Server Manager] Created server game with server game id ${createdServerGame.id}`,
                );

                return createdServerGame;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Profile Manager] Error creating server game: ${e}`,
            );
        }

        return null;
    }

    async findServerByGuildId(guildId: string) {
        try {
            return await this.prisma.server.findUniqueOrThrow({
                where: { discordId: guildId },
            });
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error fetching server: ${e}`);
        }

        return null;
    }

    async updateServer(id: number, updateData: ServerUpdateData) {
        try {
            const updatedServer = await this.prisma.server.update({
                where: { id },
                data: updateData,
            });

            if (updatedServer) {
                DebugUtils.debug(
                    `[Server Manager] Updated server with server id ${updatedServer.id}`,
                );

                return updatedServer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Server Manager] Error updating server: ${e}`);
        }

        return null;
    }

    async deleteServerGame(id: number) {
        try {
            const deletedServerGame = await this.prisma.serverGame.delete({
                where: { id },
            });

            if (deletedServerGame) {
                DebugUtils.debug(
                    `[Server Manager] Deleted server game with id ${deletedServerGame.id}`,
                );

                return deletedServerGame;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Server Manager] Error deleting server game: ${e}`,
            );
        }

        return null;
    }
}

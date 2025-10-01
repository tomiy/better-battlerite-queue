import { Manager } from './manager';
import { DebugUtils } from '../../debug.utils';
import { Server } from '../../../.prisma';
import { GuildMember } from 'discord.js';
import { QueueEntryWithData } from '../data-types.type';

export class QueueManager extends Manager {
    async createQueueEntry(
        gameModeId: number,
        serverGameProfileId: number,
        server: Server,
        member: GuildMember,
    ) {
        try {
            const createdQueueEntry = await this.prisma.queueEntry.create({
                data: { gameModeId, serverGameProfileId },
            });

            if (createdQueueEntry) {
                if (server.queueRoleId) {
                    await member.roles.add(server.queueRoleId);
                } else {
                    DebugUtils.warning(
                        '[Queue Manager] No queue role configured',
                    );
                }

                DebugUtils.debug(
                    `[Queue Manager] Created queue entry with id ${createdQueueEntry.id}`,
                );

                return createdQueueEntry;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error creating queue entry: ${e}`,
            );
        }

        return null;
    }

    async deleteQueueEntries(server: Server, member: GuildMember) {
        try {
            const queueEntries = await this.prisma.queueEntry.findMany({
                where: { serverGameProfile: { discordId: member.id } },
                include: {
                    gameMode: {
                        include: { serverGame: { include: { game: true } } },
                    },
                },
            });

            const deletedQueueEntriesPayload =
                await this.prisma.queueEntry.deleteMany({
                    where: { serverGameProfile: { discordId: member.id } },
                });

            if (queueEntries && deletedQueueEntriesPayload.count) {
                if (server.queueRoleId) {
                    await member.roles.remove(server.queueRoleId);
                } else {
                    DebugUtils.warning(
                        '[Match Player Manager] No queue role configured',
                    );
                }

                DebugUtils.debug(
                    `[Queue Manager] Deleted queue entries for member id ${member.id}`,
                );

                return queueEntries;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error deleting queue entries: ${e}`,
            );
        }

        return null;
    }

    async setQueueAvailability(id: number, queueable: boolean) {
        try {
            const updatedGameMode = await this.prisma.gameMode.update({
                where: { id },
                data: { queueable },
            });

            if (updatedGameMode) {
                DebugUtils.debug(
                    `[Queue Manager] Updated game mode queue availability for game mode id ${updatedGameMode.id}`,
                );

                return updatedGameMode;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error updating game mode queue availability: ${e}`,
            );
        }

        return null;
    }

    async setQueueMessageId(id: number, queueMessageId: string) {
        try {
            const updatedGameMode = await this.prisma.gameMode.update({
                where: { id },
                data: { queueMessageId },
            });

            if (updatedGameMode) {
                DebugUtils.debug(
                    `[Queue Manager] Updated queue message id for game mode id ${updatedGameMode.id}`,
                );

                return updatedGameMode;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error updating queue message id: ${e}`,
            );
        }

        return null;
    }

    async isQueuedInAnyMode(discordId: string) {
        try {
            const queueEntry = await this.prisma.queueEntry.findFirst({
                where: { serverGameProfile: { discordId } },
                include: { gameMode: true },
            });

            if (queueEntry) {
                return queueEntry;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error fetching queue entry: ${e}`,
            );
        }

        return null;
    }

    async hasRegions(profileId: number) {
        try {
            const region = await this.prisma.serverGameProfileRegion.findFirst({
                where: { profileId },
            });

            return !!region;
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error fetching profile region: ${e}`,
            );
        }

        return null;
    }

    async getQueueEntriesForMode(
        gameModeId: number,
    ): Promise<QueueEntryWithData[]> {
        try {
            return await this.prisma.queueEntry.findMany({
                where: { gameModeId },
                orderBy: { createdAt: 'asc' },
                include: { serverGameProfile: { include: { regions: true } } },
            });
        } catch (e) {
            DebugUtils.error(
                `[Queue Manager] Error fetching queue entries: ${e}`,
            );
        }

        return [];
    }
}

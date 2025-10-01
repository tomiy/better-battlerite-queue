import { DebugUtils } from '../../debug.utils';
import { Manager } from './manager';
import { ServerGameProfileRegion } from '../../../.prisma';

export class RegionManager extends Manager {
    async findGameRegion(serverGameId: number, regionName: string) {
        const regions = await this.findGameRegions(serverGameId);

        const matchingRegion = regions.find(
            (r) => r.name.toLowerCase() === regionName.toLowerCase(),
        );
        const validRegionNames = regions.map((r) => r.name);

        return { matchingRegion, validRegionNames };
    }

    async findGameRegions(serverGameId: number) {
        try {
            return await this.prisma.serverGameRegion.findMany({
                where: { serverGameId },
            });
        } catch (e) {
            DebugUtils.error(`[Region Manager] Error fetching regions: ${e}`);
        }

        return [];
    }

    async createGameRegion(serverGameId: number, name: string) {
        try {
            const createdRegion = await this.prisma.serverGameRegion.create({
                data: { serverGameId, name },
            });

            if (createdRegion) {
                DebugUtils.debug(
                    `[Region Manager] Created game region with game region id ${createdRegion.id}`,
                );

                return createdRegion;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Region Manager] Error creating game region: ${e}`,
            );
        }

        return null;
    }

    async createProfileRegion(serverGameRegionId: number, profileId: number) {
        try {
            const createdRegion =
                await this.prisma.serverGameProfileRegion.create({
                    data: { serverGameRegionId, profileId },
                    include: { serverGameRegion: true },
                });

            if (createdRegion) {
                DebugUtils.debug(
                    `[Region Manager] Created profile region with profile region id ${createdRegion.id}`,
                );

                return createdRegion;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Region Manager] Error creating profile region: ${e}`,
            );
        }

        return null;
    }

    async deleteProfileRegion(id: number) {
        try {
            const deletedRegion =
                await this.prisma.serverGameProfileRegion.delete({
                    where: { id },
                    include: { serverGameRegion: true },
                });

            if (deletedRegion) {
                DebugUtils.debug(
                    `[Region Manager] Deleted profile region with profile region id ${deletedRegion.id}`,
                );

                return deletedRegion;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Region Manager] Error deleting profile region: ${e}`,
            );
        }

        return null;
    }

    async findProfileRegion(serverGameRegionId: number, profileId: number) {
        try {
            return await this.prisma.serverGameProfileRegion.findFirst({
                where: { serverGameRegionId, profileId },
            });
        } catch (e) {
            DebugUtils.error(
                `[Region Manager] Error fetching profile region: ${e}`,
            );
        }

        return null;
    }

    async setProfileRegionAvailability(
        serverGameRegionId: number,
        profileId: number,
        enabled: boolean,
    ): Promise<ServerGameProfileRegion | null> {
        const profileRegion = await this.findProfileRegion(
            serverGameRegionId,
            profileId,
        );

        if (enabled) {
            if (profileRegion) {
                return profileRegion;
            }

            const createdProfileRegion = await this.createProfileRegion(
                serverGameRegionId,
                profileId,
            );

            if (createdProfileRegion) {
                return createdProfileRegion;
            }

            return null;
        }

        if (!enabled) {
            if (!profileRegion) {
                return {} as ServerGameProfileRegion;
            }

            const deletedProfileRegion = await this.deleteProfileRegion(
                profileRegion.id,
            );

            if (deletedProfileRegion) {
                return deletedProfileRegion;
            }

            return null;
        }

        return null;
    }

    async deleteGameRegion(id: number) {
        try {
            const deletedRegion = await this.prisma.serverGameRegion.delete({
                where: { id },
            });

            if (deletedRegion) {
                DebugUtils.debug(
                    `[Region Manager] Deleted region with region id ${deletedRegion.id}`,
                );

                return deletedRegion;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Region Manager] Error deleting region: ${e}`);
        }

        return null;
    }
}

import { Manager } from './manager';
import { GameModeTerrainWithData } from '../data-types.type';
import { DebugUtils } from '../../debug.utils';

export class TerrainManager extends Manager {
    async createTerrain(gameModeId: number, terrainId: number) {
        try {
            const createdTerrain = await this.prisma.gameModeTerrain.create({
                data: { gameModeId, terrainId },
            });

            if (createdTerrain) {
                DebugUtils.debug(
                    `[Terrain Manager] Created terrain with terrain id ${createdTerrain.id}`,
                );

                return createdTerrain;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Terrain Manager] Error creating terrain: ${e}`);
        }

        return null;
    }

    async findTerrains(gameModeId: number): Promise<GameModeTerrainWithData[]> {
        try {
            return await this.prisma.gameModeTerrain.findMany({
                where: { gameModeId },
                include: { terrain: true },
            });
        } catch (e) {
            DebugUtils.error(
                `[Terrain Manager] Error fetching game mode terrains: ${e}`,
            );
        }

        return [];
    }

    async findTerrain(gameModeId: number, terrainName: string) {
        const terrains = await this.findTerrains(gameModeId);
        const validTerrainNames = terrains.map((t) => t.terrain.name);

        const matchingTerrain = terrains.find(
            (gm) => gm.terrain.name.toLowerCase() === terrainName.toLowerCase(),
        );

        return { matchingTerrain, validTerrainNames };
    }

    async updateTerrain(id: number, weight: number) {
        try {
            const updatedTerrain = await this.prisma.gameModeTerrain.update({
                where: { id },
                data: { weight },
            });

            if (updatedTerrain) {
                DebugUtils.debug(
                    `[Terrain Manager] Updated terrain with terrain id ${updatedTerrain.id}`,
                );

                return updatedTerrain;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Terrain Manager] Error editing game mode terrain: ${e}`,
            );
        }

        return null;
    }

    async deleteTerrain(id: number) {
        try {
            const deletedTerrain = await this.prisma.gameModeTerrain.delete({
                where: { id },
            });

            if (deletedTerrain) {
                DebugUtils.debug(
                    `[Terrain Manager] Deleted terrain with terrain id ${deletedTerrain.id}`,
                );

                return deletedTerrain;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Terrain Manager] Error deleting terrain: ${e}`);
        }

        return null;
    }
}

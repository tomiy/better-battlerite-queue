import { GameMode } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import { GameModeWithData } from '../data-types.type';
import { Manager } from './manager';

export class GameModeManager extends Manager {
    async createGameMode(
        serverGameId: number,
        name: string,
        teamCount: number,
    ): Promise<GameMode | null> {
        try {
            const createdGameMode = await this.prisma.gameMode.create({
                data: { serverGameId, name, teamCount },
            });

            if (createdGameMode) {
                DebugUtils.debug(
                    `[Game Mode Manager] Created game mode with game mode id ${createdGameMode.id}`,
                );

                return createdGameMode;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Game Mode Manager] Error creating game mode: ${e}`,
            );
        }

        return null;
    }

    async findGameModeById(id: number) {
        try {
            const matchingMode = await this.prisma.gameMode.findFirst({
                where: { id },
                include: {
                    terrains: true,
                    characters: { include: { character: true } },
                    draftSequence: { include: { steps: true } },
                    serverGame: {
                        include: {
                            game: {
                                include: {
                                    terrains: true,
                                    characters: true,
                                },
                            },
                        },
                    },
                },
            });

            if (matchingMode) {
                return matchingMode;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Game Mode Manager] Error fetching game mode: ${e}`,
            );
        }

        return null;
    }

    async findGameMode(serverGameId: number, modeName: string) {
        const gameModes = await this.findGameModes(serverGameId);
        const validGameModeNames = gameModes.map((gm) => gm.name);

        const matchingGameMode = gameModes.find(
            (gm) => gm.name.toLowerCase() === modeName.toLowerCase(),
        );

        return { matchingGameMode, validGameModeNames };
    }

    async findGameModes(serverGameId: number): Promise<GameModeWithData[]> {
        try {
            return await this.prisma.gameMode.findMany({
                where: { serverGameId },
                include: {
                    terrains: true,
                    characters: { include: { character: true } },
                    draftSequence: { include: { steps: true } },
                    serverGame: {
                        include: {
                            game: {
                                include: {
                                    terrains: true,
                                    characters: true,
                                },
                            },
                        },
                    },
                },
            });
        } catch (e) {
            DebugUtils.error(
                `[Game Mode Manager] Error fetching game modes: ${e}`,
            );
        }

        return [];
    }

    async deleteGameMode(id: number) {
        try {
            const deletedMode = await this.prisma.gameMode.delete({
                where: { id },
            });

            if (deletedMode) {
                return deletedMode;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Game Mode Manager] Error deleting game mode: ${e}`,
            );
        }

        return null;
    }
}

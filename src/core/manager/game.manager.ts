import { GameData } from '../../config/games/game-data.type';
import { DebugUtils } from '../../debug.utils';
import { Manager } from './manager';

export class GameManager extends Manager {
    async findGame(gameName: string) {
        const games = await this.findGames();
        const validGameNames = games.map((g) => g.name);

        const matchingGame = games.find(
            (g) => g.name.toLowerCase() === gameName.toLowerCase(),
        );

        return { matchingGame, validGameNames };
    }

    async findGames() {
        try {
            return await this.prisma.game.findMany({
                include: { terrains: true, characters: true },
            });
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error fetching games: ${e}`);
        }

        return [];
    }

    async createGame(gameData: GameData) {
        try {
            const createdGame = await this.prisma.game.create({
                data: {
                    name: gameData.name,
                    terrains: { createMany: { data: gameData.terrains } },
                    characters: {
                        createMany: { data: gameData.characters },
                    },
                },
            });

            if (createdGame) {
                DebugUtils.debug(
                    `[Game Manager] Created game with game id ${createdGame.id}`,
                );

                return createdGame;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error creating game: ${e}`);
        }

        return null;
    }

    async createTerrain(gameId: number, name: string) {
        try {
            const createdTerrain = await this.prisma.terrain.create({
                data: { gameId, name },
            });

            if (createdTerrain) {
                DebugUtils.debug(
                    `[Game Manager] Created terrain with terrain id ${createdTerrain.id}`,
                );

                return createdTerrain;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error creating terrain: ${e}`);
        }

        return null;
    }

    async findTerrains(gameId: number) {
        try {
            return await this.prisma.terrain.findMany({
                where: { gameId },
            });
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error fetching terrains: ${e}`);
        }

        return [];
    }

    async findTerrain(gameId: number, terrainName: string) {
        const terrains = await this.findTerrains(gameId);
        const validTerrainNames = terrains.map((c) => c.name);

        const matchingTerrain = terrains.find(
            (t) => t.name.toLowerCase() === terrainName.toLowerCase(),
        );

        return { matchingTerrain, validTerrainNames };
    }

    async createCharacter(gameId: number, name: string) {
        try {
            const createdCharacter = await this.prisma.character.create({
                data: { gameId, name },
            });

            if (createdCharacter) {
                DebugUtils.debug(
                    `[Game Manager] Created character with character id ${createdCharacter.id}`,
                );

                return createdCharacter;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error creating character: ${e}`);
        }

        return null;
    }

    async findCharacters(gameId: number) {
        try {
            return await this.prisma.character.findMany({
                where: { gameId },
            });
        } catch (e) {
            DebugUtils.error(`[Game Manager] Error fetching characters: ${e}`);
        }

        return [];
    }

    async findCharacter(gameId: number, characterName: string) {
        const characters = await this.findCharacters(gameId);
        const validCharacterNames = characters.map((c) => c.name);

        const matchingCharacter = characters.find(
            (c) => c.name.toLowerCase() === characterName.toLowerCase(),
        );

        return { matchingCharacter, validCharacterNames };
    }
}

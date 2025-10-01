import { Manager } from './manager';
import { GameModeCharacterWithData } from '../data-types.type';
import { DebugUtils } from '../../debug.utils';

export class CharacterManager extends Manager {
    async createCharacter(
        gameModeId: number,
        characterId: number,
        restrictions?: string,
    ) {
        try {
            const createdCharacter = await this.prisma.gameModeCharacter.create(
                {
                    data: { gameModeId, characterId, restrictions },
                },
            );

            if (createdCharacter) {
                DebugUtils.debug(
                    `[Character Manager] Created character with character id ${createdCharacter.id}`,
                );

                return createdCharacter;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Character Manager] Error creating character: ${e}`,
            );
        }

        return null;
    }

    async findCharacters(
        gameModeId: number,
    ): Promise<GameModeCharacterWithData[]> {
        try {
            return await this.prisma.gameModeCharacter.findMany({
                where: { gameModeId },
                include: { character: true },
            });
        } catch (e) {
            DebugUtils.error(
                `[Character Manager] Error fetching game mode characters: ${e}`,
            );
        }

        return [];
    }

    async findCharacter(gameModeId: number, characterName: string) {
        const characters = await this.findCharacters(gameModeId);
        const validCharacterNames = characters.map((t) => t.character.name);

        const matchingCharacter = characters.find(
            (gm) =>
                gm.character.name.toLowerCase() === characterName.toLowerCase(),
        );

        return { matchingCharacter, validCharacterNames };
    }

    async updateCharacter(id: number, restrictions: string) {
        try {
            const updatedCharacter = await this.prisma.gameModeCharacter.update(
                {
                    where: { id },
                    data: { restrictions },
                },
            );

            if (updatedCharacter) {
                DebugUtils.debug(
                    `[Character Manager] Updated character with character id ${updatedCharacter.id}`,
                );

                return updatedCharacter;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Character Manager] Error editing game mode character: ${e}`,
            );
        }

        return null;
    }

    async deleteCharacter(id: number) {
        try {
            const deletedCharacter = await this.prisma.gameModeCharacter.delete(
                {
                    where: { id },
                },
            );

            if (deletedCharacter) {
                DebugUtils.debug(
                    `[Character Manager] Deleted character with character id ${deletedCharacter.id}`,
                );

                return deletedCharacter;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Character Manager] Error deleting character: ${e}`,
            );
        }

        return null;
    }

    async setCharacterAvailability(id: number, enabled: boolean) {
        try {
            const updatedCharacter = await this.prisma.gameModeCharacter.update(
                {
                    where: { id },
                    data: { enabled },
                },
            );

            if (updatedCharacter) {
                DebugUtils.debug(
                    `[Character Manager] Updated character availability for character id ${updatedCharacter.id}`,
                );

                return updatedCharacter;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Character Manager] Error updating character availability: ${e}`,
            );
        }

        return null;
    }
}

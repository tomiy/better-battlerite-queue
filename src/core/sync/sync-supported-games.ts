import { supportedGames } from '../../config/games';
import { gameManager } from '../../config/state';
import { DebugUtils } from '../../debug.utils';

export async function syncSupportedGames() {
    DebugUtils.debug('[Sync Supported Games] Syncing supported games...');

    const games = await gameManager.findGames();

    for (const supportedGame of supportedGames) {
        const matchingGame = games.find(
            (g) => g.name.toLowerCase() === supportedGame.name.toLowerCase(),
        );

        if (!matchingGame) {
            DebugUtils.trace(
                `[Sync Supported Games] Creating game ${supportedGame.name}`,
            );

            await gameManager.createGame({
                name: supportedGame.name,
                terrains: supportedGame.terrains,
                characters: supportedGame.characters,
            });
        } else {
            for (const terrain of supportedGame.terrains) {
                DebugUtils.trace(
                    `[Sync Supported Games] Creating terrain ${terrain.name} for game ${supportedGame.name}`,
                );

                const matchingTerrain = matchingGame.terrains.find(
                    (t) => t.name.toLowerCase() === terrain.name.toLowerCase(),
                );

                if (!matchingTerrain) {
                    await gameManager.createTerrain(
                        matchingGame.id,
                        terrain.name,
                    );
                }
            }

            for (const character of supportedGame.characters) {
                DebugUtils.trace(
                    `[Sync Supported Games] Creating character ${character.name} for game ${supportedGame.name}`,
                );
                const matchingCharacter = matchingGame.characters.find(
                    (t) =>
                        t.name.toLowerCase() === character.name.toLowerCase(),
                );

                if (!matchingCharacter) {
                    await gameManager.createCharacter(
                        matchingGame.id,
                        character.name,
                    );
                }
            }
        }
    }

    DebugUtils.debug(
        '[Sync Supported Games] Successfully synced supported games',
    );
}

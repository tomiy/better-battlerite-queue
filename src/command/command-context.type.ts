import { Client, Guild, GuildMember } from 'discord.js';
import {
    Character,
    Game,
    Server,
    ServerGameProfile,
    ServerGameRegion,
    Terrain,
} from '../../.prisma';
import {
    DraftSequenceWithSteps,
    FullMatch,
    FullTeam,
    GameModeCharacterWithData,
    GameModeTerrainWithData,
    GameModeWithData,
    MatchPlayerWithProfile,
    ServerGameWithData,
} from '../core/data-types.type';

export type CommandContext = {
    client: Client;

    guild?: Guild;
    member?: GuildMember;
    server?: Server;
    profile?: ServerGameProfile;
    region?: ServerGameRegion;

    game?: Game;
    serverGame?: ServerGameWithData;
    gameTerrain?: Terrain;
    gameCharacter?: Character;
    gameMode?: GameModeWithData;
    gameModeTerrain?: GameModeTerrainWithData;
    gameModeCharacter?: GameModeCharacterWithData;

    draftSequence?: DraftSequenceWithSteps;
    match?: FullMatch;
    team?: FullTeam;
    player?: MatchPlayerWithProfile;

    gameName?: string;
    modeName?: string;
    regionName?: string;
    lobbyCode?: string;
    terrainName?: string;
    characterName?: string;

    gameId?: number;
    modeId?: number;
    matchId?: number;
    teamId?: number;

    currentPage?: number;
    listSize?: number;
};

export function ensureContext<T extends CommandContext, K extends keyof T>(
    context: T,
    keys: K[],
): asserts context is T & Record<K, NonNullable<T[K]>> {
    for (const key of keys) {
        if (
            !(key in context) ||
            context[key] === null ||
            context[key] === undefined
        ) {
            throw new Error(`Missing required context member: ${String(key)}`);
        }
    }
}

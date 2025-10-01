import {
    Character,
    DraftSequence,
    DraftStep,
    Game,
    GameMode,
    GameModeCharacter,
    GameModeTerrain,
    Match,
    MatchDraftAction,
    MatchPlayer,
    MatchTeam,
    QueueEntry,
    Rating,
    ServerGame,
    ServerGameProfile,
    ServerGameProfileRegion,
    Terrain,
} from '../../.prisma';

export type ServerGameWithData = ServerGame & {
    game: Game & { characters: Character[]; terrains: Terrain[] };
};

export type GameModeWithData = GameMode & {
    terrains: GameModeTerrain[];
    characters: GameModeCharacterWithData[];
    draftSequence: DraftSequenceWithSteps | null;
    serverGame: ServerGameWithData;
};

export type DraftSequenceWithSteps = DraftSequence & { steps: DraftStep[] };

export type GameModeTerrainWithData = GameModeTerrain & { terrain: Terrain };
export type GameModeCharacterWithData = GameModeCharacter & {
    character: Character;
};

export type MatchWithData = Match & {
    gameMode: GameModeWithData;
    gameModeTerrain: GameModeTerrainWithData | null;
};

export type FullMatch = MatchWithData & { teams: FullTeam[] };

export type TeamWithPlayers = MatchTeam & { players: MatchPlayerWithProfile[] };
export type TeamWithData = MatchTeam & { draftActions: DraftActionWithData[] };
export type FullTeam = TeamWithData & TeamWithPlayers;

export type DraftActionWithData = MatchDraftAction & {
    gameModeCharacter: GameModeCharacterWithData | null;
    gameModeTerrain: GameModeTerrainWithData | null;
    serverGameProfile: ServerGameProfile | null;
};

export type MatchPlayerWithProfile = MatchPlayer & {
    serverGameProfile: ServerGameProfile;
};

export type PlayerWithRating = {
    player: MatchPlayer;
    rating: Rating;
};

export type DraftActionData = {
    gameModeCharacterId?: number;
    gameModeTerrainId?: number;
    serverGameProfileId?: number;
};

export type DraftStepData = {
    draftTeamNumber: number;
    draftStep: DraftStep;
    currentDraftActionNumber: number;
};

export type RatingData = { team: FullTeam; ratings: PlayerWithRating[] };

export type QueueEntryWithData = QueueEntry & {
    serverGameProfile: ServerGameProfile & {
        regions: ServerGameProfileRegion[];
    };
};

export const fullMatchInclude = {
    gameModeTerrain: { include: { terrain: true } },
    gameMode: {
        include: {
            terrains: true,
            characters: { include: { character: true } },
            draftSequence: { include: { steps: true } },
            serverGame: {
                include: {
                    game: {
                        include: {
                            characters: true,
                            terrains: true,
                        },
                    },
                },
            },
        },
    },
    teams: {
        include: {
            draftActions: {
                include: {
                    gameModeCharacter: {
                        include: { character: true },
                    },
                    gameModeTerrain: {
                        include: { terrain: true },
                    },
                    serverGameProfile: true,
                },
            },
            players: { include: { serverGameProfile: true } },
        },
    },
};

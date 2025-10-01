export type GameData = {
    name: string;
    terrains: TerrainData[];
    characters: CharacterData[];
};

type TerrainData = {
    name: string;
};

type CharacterData = {
    name: string;
};

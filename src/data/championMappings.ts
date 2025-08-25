import { Champion, ChampionType, Prisma } from '../../.prisma';
import * as defaultChampionData from '../data/champions.json';

export const championToChampionName: Map<Champion, string> = new Map([
    [Champion.BAKKO, 'Bakko'],
    [Champion.CROAK, 'Croak'],
    [Champion.FREYA, 'Freya'],
    [Champion.JAMILA, 'Jamila'],
    [Champion.RAIGON, 'Raigon'],
    [Champion.ROOK, 'Rook'],
    [Champion.RUH_KAAN, 'Ruh Kaan'],
    [Champion.SHIFU, 'Shifu'],
    [Champion.THORN, 'Thorn'],

    [Champion.ALYSIA, 'Alysia'],
    [Champion.ASHKA, 'Ashka'],
    [Champion.DESTINY, 'Destiny'],
    [Champion.EZMO, 'Ezmo'],
    [Champion.IVA, 'Iva'],
    [Champion.JADE, 'Jade'],
    [Champion.JUMONG, 'Jumong'],
    [Champion.SHEN_RAO, 'Shen Rao'],
    [Champion.TAYA, 'Taya'],
    [Champion.VARESH, 'Varesh'],

    [Champion.BLOSSOM, 'Blossom'],
    [Champion.LUCIE, 'Lucie'],
    [Champion.OLDUR, 'Oldur'],
    [Champion.PEARL, 'Pearl'],
    [Champion.PESTILUS, 'Pestilus'],
    [Champion.POLOMA, 'Poloma'],
    [Champion.SIRIUS, 'Sirius'],
    [Champion.ULRIC, 'Ulric'],
    [Champion.ZANDER, 'Zander'],
]);

const championNameToChampion: Map<string, Champion> = new Map(
    Array.from(
        championToChampionName,
        (m) => m.reverse() as [string, Champion],
    ),
);

export const championTypeToChampionTypeName: Map<ChampionType, string> =
    new Map([
        [ChampionType.MELEE, 'Melee'],
        [ChampionType.RANGED, 'Ranged'],
        [ChampionType.SUPPORT, 'Support'],
    ]);

const championTypeNameToChampionType: Map<string, ChampionType> = new Map(
    Array.from(
        championTypeToChampionTypeName,
        (m) => m.reverse() as [string, ChampionType],
    ),
);

export function getDefaultMappings(
    guildId: number,
): Prisma.ChampionDataCreateManyInput[] {
    return defaultChampionData.map((d) => ({
        guildId: guildId,
        champion: championNameToChampion.get(d.name) || 'ALYSIA',
        type: championTypeNameToChampionType.get(d.type) || 'MELEE',
        restrictions: d.restrictions || '',
    }));
}

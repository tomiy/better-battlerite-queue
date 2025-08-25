import { Map as GameMap, Prisma } from '../../.prisma';
import * as defaultMapData from '../data/maps.json';

export const maptoMapName: Map<GameMap, string> = new Map([
    [GameMap.MOUNT_ARAZ, 'Mount Araz'],
    [GameMap.ORMAN_TEMPLE, 'Orman Temple'],
    [GameMap.SKY_RING, 'Sky Ring'],
    [GameMap.BLACKSTONE_ARENA, 'Blackstone Arena'],
    [GameMap.DRAGON_GARDEN, 'Dragon Garden'],
    [GameMap.DAHARIN_BATTLEGROUNDS, 'Daharin Battlegrounds'],
    [GameMap.MISTY_WOODS, 'Misty Woods'],
    [GameMap.MERIKO_SUMMIT, 'Meriko Summit'],
    [GameMap.THE_GREAT_MARKET, 'The Great Market'],
]);

const mapNameToMap: Map<string, GameMap> = new Map(
    Array.from(maptoMapName, (m) => m.reverse() as [string, GameMap]),
);

export function getDefaultMappings(guildId: number) {
    const defaultMappings: Prisma.MapDataCreateManyInput[] = [];
    defaultMapData.forEach((d) => {
        defaultMappings.push(
            {
                guildId: guildId,
                map: mapNameToMap.get(d.name) || 'BLACKSTONE_ARENA',
                variant: 'DAY',
                weight: d.day,
            },
            {
                guildId: guildId,
                map: mapNameToMap.get(d.name) || 'BLACKSTONE_ARENA',
                variant: 'NIGHT',
                weight: d.night,
            },
        );
    });

    return defaultMappings;
}

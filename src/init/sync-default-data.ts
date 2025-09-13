import { Guild } from 'discord.js';
import {
    defaultDataFolder,
    defaultDraftSequence,
    defaultDraftSequenceName,
    prisma,
} from '../config';
import { DebugUtils } from '../debug-utils';

export async function syncDefaultData(guild: Guild) {
    const dbGuild = await prisma.guild.findFirstOrThrow({
        where: { discordId: guild.id },
    });

    const anyMapData = await prisma.mapData.findFirst();

    if (!anyMapData) {
        DebugUtils.debug(
            `[Sync default data] Syncing default map data for guild ${guild.id}`,
        );

        const defaultMapData = await import(
            `../data/${defaultDataFolder}/maps.json`
        );

        const mapData = await prisma.mapData.createMany({
            data: defaultMapData.default.map(
                (m: { name: string; weight: number }) => ({
                    guildId: dbGuild.id,
                    name: m.name,
                    weight: m.weight,
                }),
            ),
        });

        if (!mapData) {
            throw new Error(
                '[Sync default data] Could not create default map data',
            );
        }

        DebugUtils.debug(
            `[Sync default data] Successfully synced default map data for guild ${guild.id}`,
        );
    }

    const anyChampionData = await prisma.championData.findFirst();

    if (!anyChampionData) {
        DebugUtils.debug(
            `[Sync default data] Syncing default champion data for guild ${guild.id}`,
        );

        const defaultChampionData = await import(
            `../data/${defaultDataFolder}/champions.json`
        );

        const championData = await prisma.championData.createMany({
            data: defaultChampionData.default.map(
                (c: { name: string; restrictions?: string }) => ({
                    guildId: dbGuild.id,
                    name: c.name,
                    restrictions: c.restrictions || '',
                }),
            ),
        });

        if (!championData) {
            throw new Error(
                '[Sync default data] Could not create default champion data',
            );
        }

        DebugUtils.debug(
            `[Sync default data] Successfully synced default champion data for guild ${guild.id}`,
        );
    }

    const anyDraftSequence = await prisma.matchDraftSequence.findFirst();

    if (!anyDraftSequence) {
        DebugUtils.debug(
            `[Sync default data] Syncing default draft sequence for guild ${guild.id}`,
        );

        const draftSteps = defaultDraftSequence.map((step, i) => ({
            type: step,
            order: i,
        }));

        const draftSequence = await prisma.matchDraftSequence.create({
            data: {
                name: defaultDraftSequenceName,
                steps: {
                    createMany: {
                        data: draftSteps,
                    },
                },
            },
        });

        if (!draftSequence) {
            throw new Error(
                '[Sync default data] Could not create default draft sequence',
            );
        }

        DebugUtils.debug(
            `[Sync default data] Successfully synced default draft sequence for guild ${guild.id}`,
        );
    }
}

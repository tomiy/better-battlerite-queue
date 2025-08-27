import { Guild } from 'discord.js';
import { DraftStep } from '../../.prisma';
import {
    defaultDraftSequence,
    defaultDraftSequenceName,
    prisma,
} from '../config';
import { getDefaultMappings as getDefaultChampionMappings } from '../data/championMappings';
import { getDefaultMappings as getDefaultMapMappings } from '../data/mapMappings';
import { DebugUtils } from '../debug-utils';

export async function syncDefaultData(guild: Guild) {
    const dbGuild = await prisma.guild.findFirstOrThrow({
        where: { guildDiscordId: guild.id },
    });

    const anyMapData = await prisma.mapData.findFirst();

    if (!anyMapData) {
        DebugUtils.debug(
            `[Sync default data] Syncing default map data for guild ${guild.id}`,
        );

        const mapData = await prisma.mapData.createMany({
            data: getDefaultMapMappings(dbGuild.id),
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

        const championData = await prisma.championData.createMany({
            data: getDefaultChampionMappings(dbGuild.id),
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

        const draftSteps = defaultDraftSequence.split('').map((s, i) => ({
            type: s === 'B' ? DraftStep.BAN : DraftStep.PICK,
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

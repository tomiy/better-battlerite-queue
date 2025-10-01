import { DraftSequenceType, DraftStepType } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import { GameModeWithData } from '../data-types.type';
import { Manager } from './manager';

type DraftStepToken = 'PP' | 'TB' | 'TP' | 'GB' | 'GP' | 'B' | 'P';

const draftStepMap: Map<DraftStepToken, DraftStepType> = new Map([
    ['PP', DraftStepType.PLAYER_PICK],
    ['TB', DraftStepType.TERRAIN_BAN],
    ['TP', DraftStepType.TERRAIN_PICK],
    ['GB', DraftStepType.CHARACTER_GLOBAL_BAN],
    ['GP', DraftStepType.CHARACTER_GLOBAL_PICK],
    ['B', DraftStepType.CHARACTER_BAN],
    ['P', DraftStepType.CHARACTER_PICK],
]);

export const invertedDraftStepMap = new Map(
    Array.from(
        draftStepMap,
        (a) => a.reverse() as [DraftStepType, DraftStepToken],
    ),
);

const characterPickStepTypes = [
    DraftStepType.CHARACTER_PICK,
    DraftStepType.CHARACTER_GLOBAL_PICK,
] as DraftStepType[];

const characterBanStepTypes = [
    DraftStepType.CHARACTER_GLOBAL_BAN,
    DraftStepType.CHARACTER_GLOBAL_PICK, // this removes a character from the pool so is effectively a ban
    DraftStepType.CHARACTER_BAN,
] as DraftStepType[];

export class DraftSequenceManager extends Manager {
    parseDraftStepTokens(
        mode: GameModeWithData,
        type: DraftSequenceType,
        teamSize: number,
        tokens: string[],
    ) {
        const steps: DraftStepType[] = [];

        for (const t of tokens) {
            const step = draftStepMap.get(t as DraftStepToken);

            if (!step) {
                throw new Error(`Invalid token: ${t}`);
            }

            steps.push(step);
        }

        const playerPickSteps = steps.filter(
            (s) => s === DraftStepType.PLAYER_PICK,
        );

        if (type === DraftSequenceType.SIMULTANEOUS && playerPickSteps.length) {
            throw new Error(
                'Player draft actions are only available in sequential drafts',
            );
        }

        if (playerPickSteps.length >= teamSize) {
            throw new Error(
                'Cannot have more or equal player picks to team size',
            );
        }

        const terrainPickSteps = steps.filter(
            (s) => s === DraftStepType.TERRAIN_PICK,
        );

        const terrainBanSteps = steps.filter(
            (s) => s === DraftStepType.TERRAIN_BAN,
        );

        if (
            type === DraftSequenceType.SIMULTANEOUS &&
            (terrainPickSteps.length || terrainBanSteps.length)
        ) {
            throw new Error(
                'Terrain draft actions are only available in sequential drafts',
            );
        }

        if (terrainBanSteps.length && !terrainPickSteps.length) {
            throw new Error(
                'Cannot have terrain ban steps and no terrain pick steps',
            );
        }

        if (terrainPickSteps.length > 1) {
            throw new Error('Can only have at most 1 terrain pick step');
        }

        if (terrainBanSteps.length >= mode.terrains.length / mode.teamCount) {
            throw new Error(
                'Cannot have more or equal terrain bans to available terrains / team count',
            );
        }

        if (!characterPickStepTypes.includes(steps[steps.length - 1])) {
            throw new Error(
                'Draft sequence must end with a character pick step',
            );
        }

        const characterPickSteps = steps.filter((s) =>
            characterPickStepTypes.includes(s),
        );

        if (characterPickSteps.length !== teamSize) {
            throw new Error(
                'Number of character pick steps not equal to team size',
            );
        }

        const characterBanSteps = steps.filter((s) =>
            characterBanStepTypes.includes(s),
        );

        const enabledCharacters = mode.characters.filter((c) => c.enabled);

        if (characterBanSteps.length >= enabledCharacters.length / teamSize) {
            throw new Error(
                'Cannot have more or equal character bans to enabled characters / team size',
            );
        }

        return steps;
    }

    async createDraftSequence(
        gameModeId: number,
        type: DraftSequenceType,
        teamSize: number,
        steps: DraftStepType[],
    ) {
        try {
            const stepsCreatePayload = steps.map((s, i) => ({
                type: s,
                order: i,
            }));

            const createdDraftSequence = await this.prisma.draftSequence.create(
                {
                    data: {
                        gameModeId,
                        type,
                        teamSize,
                        steps: { createMany: { data: stepsCreatePayload } },
                    },
                },
            );

            if (createdDraftSequence) {
                DebugUtils.debug(
                    `[Draft Sequence Manager] Created draft sequence with draft sequence id ${createdDraftSequence.id}`,
                );

                return createdDraftSequence;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Draft Sequence Manager] Error creating draft sequence: ${e}`,
            );
        }

        return null;
    }

    async findDraftSequences(serverGameId: number) {
        try {
            return await this.prisma.draftSequence.findMany({
                where: { gameMode: { serverGameId } },
                include: { gameMode: true, steps: true },
            });
        } catch (e) {
            DebugUtils.error(
                `[Draft Sequence Manager] Error fetching draft sequences: ${e}`,
            );
        }

        return [];
    }

    async deleteDraftSequences(gameModeId: number) {
        try {
            return await this.prisma.draftSequence.deleteMany({
                where: { gameModeId },
            });
        } catch (e) {
            DebugUtils.error(
                `[Draft Sequence Manager] Error deleting draft sequences: ${e}`,
            );
        }

        return null;
    }
}

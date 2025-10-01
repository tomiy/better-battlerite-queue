import { DraftSequenceType, DraftStep, DraftStepType } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import {
    DraftActionData,
    DraftSequenceWithSteps,
    DraftStepData,
    TeamWithData,
} from '../data-types.type';
import { Manager } from './manager';

export class DraftManager extends Manager {
    getDraftStepData(
        teams: TeamWithData[],
        draftSequence: DraftSequenceWithSteps,
    ): DraftStepData | null {
        const currentDraftActionNumber = teams.flatMap(
            (t) => t.draftActions,
        ).length;
        const roundNumber = Math.floor(currentDraftActionNumber / teams.length);
        const pickNumber = currentDraftActionNumber % teams.length;
        const currentDraftTeamNumber =
            roundNumber % 2 === 1 ? teams.length - pickNumber - 1 : pickNumber;

        const draftStep = draftSequence.steps.find(
            (s) => s.order === roundNumber,
        );

        if (!draftStep) {
            return null;
        }

        const draftTeamNumber =
            draftSequence.type === DraftSequenceType.SIMULTANEOUS
                ? -1
                : currentDraftTeamNumber;

        return {
            draftTeamNumber,
            draftStep,
            currentDraftActionNumber,
        };
    }

    async processDraftActionForStep(
        step: DraftStep,
        teamId: number,
        teamCount: number,
        order: number,
        actionData: DraftActionData,
    ) {
        try {
            const createdDraftAction =
                await this.prisma.matchDraftAction.create({
                    data: {
                        teamId,
                        type: step.type,
                        order: order,
                        global: (
                            [
                                DraftStepType.CHARACTER_GLOBAL_BAN,
                                DraftStepType.CHARACTER_GLOBAL_PICK,
                            ] as DraftStepType[]
                        ).includes(step.type),
                        gameModeCharacterId: actionData.gameModeCharacterId,
                        gameModeTerrainId: actionData.gameModeTerrainId,
                        serverGameProfileId: actionData.serverGameProfileId,
                    },
                });

            // fill terrain pick steps since only 1 terrain can be picked
            if (step.type === DraftStepType.TERRAIN_PICK) {
                const terrainPickCreatePayload = new Array(teamCount - 1)
                    .fill({})
                    .map((_, i) => ({
                        teamId,
                        type: step.type,
                        order: order + i,
                        gameModeTerrainId: actionData.gameModeTerrainId,
                    }));

                await this.prisma.matchDraftAction.createMany({
                    data: terrainPickCreatePayload,
                });
            }

            if (createdDraftAction) {
                DebugUtils.debug(
                    `[Draft Manager] Created draft action with action id ${createdDraftAction.id}`,
                );

                return createdDraftAction;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Draft Manager] Error creating draft action: ${e}`,
            );
        }

        return null;
    }
}

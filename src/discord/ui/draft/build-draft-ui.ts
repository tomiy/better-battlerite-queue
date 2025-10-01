import { ActionRowBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { DraftStepType } from '../../../../.prisma';
import { draftManager, matchManager } from '../../../config/state';
import { buildCharacterDraftUI } from './build-character-draft-ui';
import { buildPlayerDraftUI } from './build-player-draft-ui';

export async function buildDraftUI(
    matchId: number,
    teamId: number,
    page: number,
    canDraft: boolean = true,
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
    const match = await matchManager.getFullMatch(matchId);

    if (!match) {
        throw new Error(`No matching match for id ${matchId}`);
    }

    const draftSequence = match.gameMode.draftSequence;

    if (!draftSequence) {
        throw new Error(`No draft sequence for game mode ${match.gameMode.id}`);
    }

    const draftStepData = draftManager.getDraftStepData(
        match.teams,
        draftSequence,
    );

    if (!draftStepData) {
        return [];
    }

    switch (draftStepData.draftStep.type) {
        case DraftStepType.PLAYER_PICK:
            return await buildPlayerDraftUI(match, teamId, page, canDraft);
        case DraftStepType.CHARACTER_BAN:
        case DraftStepType.CHARACTER_GLOBAL_BAN:
        case DraftStepType.CHARACTER_PICK:
        case DraftStepType.CHARACTER_GLOBAL_PICK:
            return await buildCharacterDraftUI(
                match,
                teamId,
                draftStepData,
                page,
                canDraft,
            );
    }

    return [];
}

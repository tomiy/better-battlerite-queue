import {
    ActionRowBuilder,
    ButtonBuilder,
    MessageActionRowComponentBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { DraftSequenceType, DraftStepType } from '../../../../.prisma';
import {
    DraftActionWithData,
    DraftStepData,
    FullMatch,
} from '../../../core/data-types.type';
import { buildDraftButtons } from './build-draft-buttons';

export async function buildCharacterDraftUI(
    match: FullMatch,
    teamId: number,
    stepData: DraftStepData,
    page: number,
    canDraft: boolean,
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
    const draftSequence = match.gameMode.draftSequence;

    if (!draftSequence) {
        throw new Error(`No draft sequence for game mode ${match.gameMode.id}`);
    }

    const filterCurrentRoundActions = (da: DraftActionWithData) =>
        draftSequence.type === DraftSequenceType.SIMULTANEOUS &&
        stepData.currentDraftActionNumber % stepData.draftStep.order &&
        da.order >= stepData.draftStep.order * match.teams.length;

    const enemyTeams = match.teams.filter((t) => t.id !== teamId);
    const globalActions = match.teams.flatMap((t) =>
        t.draftActions.filter(
            (da) => da.global && !filterCurrentRoundActions(da),
        ),
    );

    const enemyBans = enemyTeams.flatMap((et) =>
        et.draftActions.filter(
            (da) =>
                DraftStepType.CHARACTER_BAN === da.type &&
                !filterCurrentRoundActions(da),
        ),
    );

    const enemyPicks = enemyTeams.flatMap((et) =>
        et.draftActions.filter(
            (da) =>
                DraftStepType.CHARACTER_PICK === da.type &&
                !filterCurrentRoundActions(da),
        ),
    );

    const teamBans =
        match.teams
            .find((t) => t.id === teamId)
            ?.draftActions.filter(
                (da) =>
                    DraftStepType.CHARACTER_BAN === da.type &&
                    !filterCurrentRoundActions(da),
            ) || [];

    const teamPicks =
        match.teams
            .find((t) => t.id === teamId)
            ?.draftActions.filter(
                (da) =>
                    DraftStepType.CHARACTER_PICK === da.type &&
                    !filterCurrentRoundActions(da),
            ) || [];

    const canPick = (id: number) => {
        return (
            !globalActions.map((tb) => tb.gameModeCharacterId).includes(id) &&
            (((
                [
                    DraftStepType.CHARACTER_BAN,
                    DraftStepType.CHARACTER_GLOBAL_BAN,
                ] as DraftStepType[]
            ).includes(stepData.draftStep.type) &&
                !teamBans.map((tb) => tb.gameModeCharacterId).includes(id) &&
                !enemyPicks.map((ep) => ep.gameModeCharacterId).includes(id)) ||
                ((
                    [
                        DraftStepType.CHARACTER_PICK,
                        DraftStepType.CHARACTER_GLOBAL_PICK,
                    ] as DraftStepType[]
                ).includes(stepData.draftStep.type) &&
                    !teamPicks
                        .map((tp) => tp.gameModeCharacterId)
                        .includes(id) &&
                    !enemyBans
                        .map((eb) => eb.gameModeCharacterId)
                        .includes(id)))
        );
    };

    const pickableCharacters = match.gameMode.characters
        .filter((c) => c.enabled && canPick(c.id))
        .sort((a, b) => a.character.name.localeCompare(b.character.name));

    const pickableCharacterCount = pickableCharacters.length;

    const pickableCharacterOptions = pickableCharacters
        .splice(page * 25, 25)
        .map((c) =>
            new StringSelectMenuOptionBuilder()
                .setLabel(c.character.name)
                .setDescription(c.character.name)
                .setValue(c.id.toString()),
        );

    const characterSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`characterList_${match.id}_${teamId}`)
        .setPlaceholder(getPickString(stepData.draftStep.type))
        .addOptions(pickableCharacterOptions);

    const draftButtons = buildDraftButtons(
        match.id,
        teamId,
        page,
        pickableCharacterCount,
        canDraft,
    );

    const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (const buttonRow of draftButtons) {
        buttonRows.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(buttonRow),
        );
    }

    return canDraft
        ? [
              new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                  characterSelectMenu,
              ),
              ...buttonRows,
          ]
        : [...buttonRows];
}

function getPickString(stepType: DraftStepType) {
    switch (stepType) {
        case DraftStepType.CHARACTER_BAN:
            return 'Select a character to ban';
        case DraftStepType.CHARACTER_GLOBAL_BAN:
            return 'Select a character to globally ban';
        case DraftStepType.CHARACTER_PICK:
            return 'Select a character to pick';
        case DraftStepType.CHARACTER_GLOBAL_PICK:
            return 'Select a character to globally pick';
        default:
            return 'This should never happen';
    }
}

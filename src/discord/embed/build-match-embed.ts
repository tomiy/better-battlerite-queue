import {
    APIEmbedField,
    ColorResolvable,
    Colors,
    EmbedAuthorOptions,
    EmbedBuilder,
    Guild,
    userMention,
} from 'discord.js';
import { DraftStepType, MatchState, MatchTeam } from '../../../.prisma';
import { draftManager, matchManager } from '../../config/state';
import { DraftActionWithData, TeamWithData } from '../../core/data-types.type';
import { formatListCodeBlock } from '../format.utils';

export async function buildMatchEmbed(
    matchId: number,
    guild: Guild,
): Promise<EmbedBuilder> {
    const match = await matchManager.getFullMatch(matchId);

    if (!match) {
        throw new Error(`No matching match for id ${matchId}`);
    }

    const draftSequence = match.gameMode.draftSequence;

    if (!draftSequence) {
        throw new Error('No matching draft sequence for current match');
    }

    const draftStepData = draftManager.getDraftStepData(
        match.teams,
        draftSequence,
    );

    const { draftTeamNumber, draftStep } = draftStepData || {};

    const isPlayerDraft = draftSequence.steps.find(
        (s) => s.type === DraftStepType.PLAYER_PICK,
    );

    const playerFields: APIEmbedField[] = match.teams.map((t) => {
        const userMentions = t.players
            .filter((p) => p.captain)
            .map(
                (p) =>
                    `${userMention(p.serverGameProfile.discordId)} - Captain`,
            );

        if (isPlayerDraft) {
            userMentions.push(
                ...t.draftActions
                    .filter((da) => da.type === DraftStepType.PLAYER_PICK)
                    .sort((a, b) => a.order - b.order)
                    .map((da) =>
                        userMention(da.serverGameProfile?.discordId || ''),
                    ),
            );
        } else {
            userMentions.push(
                ...t.players
                    .filter((p) => !p.captain)
                    .map((p) => userMention(p.serverGameProfile.discordId)),
            );
        }

        return {
            name: `Team ${t.order + 1}`,
            value: userMentions.join('\n'),
            inline: true,
        };
    });

    while (playerFields.length % 3) {
        playerFields.push({ name: '\u200B', value: '\u200B', inline: true });
    }

    const characterDraftText = (da: DraftActionWithData) =>
        da.gameModeCharacter?.character.name + (da.global ? ' (global)' : '');

    const characterBansFields: APIEmbedField[] = getDraftActionFields(
        match.teams,
        [DraftStepType.CHARACTER_BAN, DraftStepType.CHARACTER_GLOBAL_BAN],
        (t) => `Team ${t.order + 1} character bans`,
        characterDraftText,
    );

    const characterPicksFields: APIEmbedField[] = getDraftActionFields(
        match.teams,
        [DraftStepType.CHARACTER_PICK, DraftStepType.CHARACTER_GLOBAL_PICK],
        (t) => `Team ${t.order + 1} character picks`,
        characterDraftText,
    );

    const infoFields: APIEmbedField[] = [];

    if (match.gameModeTerrain) {
        infoFields.push({
            name: 'Terrain',
            value: match.gameModeTerrain.terrain.name,
        });
    }

    if (
        match.state === MatchState.DRAFT &&
        draftTeamNumber !== undefined &&
        draftStep !== undefined
    ) {
        const draftStepText = getDraftStepText(draftStep.type);

        const stepTextValue =
            draftTeamNumber >= 0
                ? `Team ${draftTeamNumber + 1} ${draftStepText}`
                : draftStepText;

        infoFields.push({
            name: 'Current Step',
            value: stepTextValue,
        });
    }

    const footerFields: APIEmbedField[] = [];

    const allRestrictions: string[] = [];
    match.teams.forEach((t) => {
        t.draftActions
            .filter(
                (da) =>
                    da.type === DraftStepType.CHARACTER_PICK ||
                    da.type === DraftStepType.CHARACTER_GLOBAL_PICK,
            )
            .forEach((p) => {
                if (p.gameModeCharacter?.restrictions) {
                    allRestrictions.push(
                        `${p.gameModeCharacter.character.name}: ${p.gameModeCharacter.restrictions}`,
                    );
                }
            });
    });
    const uniqueRestrictions = [...new Set(allRestrictions)];

    if (uniqueRestrictions.length) {
        footerFields.push({
            name: 'Restrictions',
            value: formatListCodeBlock(uniqueRestrictions),
        });
    }

    const players = match.teams.flatMap((t) => t.players);
    const reportStrings: string[] = [];

    if (match.state === MatchState.ONGOING) {
        const winReportCounts = new Map(
            Object.entries(
                Object.groupBy(players, (u) =>
                    u.winReport !== null ? u.winReport : -1,
                ),
            ).map(([k, v]) => [parseInt(k), v?.length || 0]),
        );

        reportStrings.push(
            ...match.teams.map(
                (t) =>
                    `Team ${t.order + 1}: ${winReportCounts.get(t.order) || 0}`,
            ),
        );
    }

    if (
        !([MatchState.DROPPED, MatchState.FINISHED] as MatchState[]).includes(
            match.state,
        )
    ) {
        const dropReportCount = players
            .map((u) => u.dropReport)
            .filter((r) => r === true).length;

        reportStrings.push(`Drop: ${dropReportCount}`);
    }

    if (reportStrings.length) {
        footerFields.push({
            name: 'Match Reports',
            value: reportStrings.join('\n'),
        });
    }

    if (match.state === MatchState.FINISHED && match.winningTeam !== null) {
        const playersRatingChange = match.teams.flatMap((t) =>
            t.players.map((p) => p.ratingChange),
        );
        const averageRatingChange =
            playersRatingChange.reduce((a, b) => Math.abs(a) + Math.abs(b)) /
            playersRatingChange.length;
        footerFields.push({
            name: `Team ${match.winningTeam + 1} wins!`,
            value: `Average rating change: ${averageRatingChange}`,
        });
    }

    if (match.state === MatchState.DROPPED) {
        footerFields.push({
            name: 'Match Dropped',
            value: 'No rating changes',
        });
    }

    const icon = guild.iconURL();

    const author: EmbedAuthorOptions = { name: `Match #${match.id}` };

    if (icon) {
        author.iconURL = icon;
    }

    return new EmbedBuilder()
        .setAuthor(author)
        .setColor(getEmbedColor(match.state))
        .addFields(infoFields)
        .addFields(playerFields)
        .addFields(characterBansFields)
        .addFields(characterPicksFields)
        .addFields(footerFields)
        .setTimestamp();
}

function getDraftActionFields(
    teams: TeamWithData[],
    filter: DraftStepType[],
    title: (t: MatchTeam) => string,
    computedValue: (da: DraftActionWithData) => string,
) {
    const fields: APIEmbedField[] = teams.map((t) => {
        const actions = t.draftActions
            .filter((da) => filter.includes(da.type))
            .sort((a, b) => a.order - b.order)
            .map((da) => computedValue(da))
            .join('\n');
        return { name: title(t), value: actions, inline: true };
    });

    while (fields.length % 3) {
        fields.push({ name: '\u200B', value: '\u200B', inline: true });
    }

    return fields;
}

function getDraftStepText(stepType: DraftStepType) {
    switch (stepType) {
        case DraftStepType.CHARACTER_BAN:
            return 'Ban';
        case DraftStepType.CHARACTER_GLOBAL_BAN:
            return 'Global ban';
        case DraftStepType.CHARACTER_PICK:
            return 'Pick';
        case DraftStepType.CHARACTER_GLOBAL_PICK:
            return 'Global pick';
        default:
            return 'This should never happen';
    }
}

function getEmbedColor(matchState: MatchState): ColorResolvable {
    switch (matchState) {
        case MatchState.NEW:
            return Colors.White;
        case MatchState.DRAFT:
        case MatchState.ONGOING:
            return Colors.Orange;
        case MatchState.DROPPED:
            return Colors.Red;
        case MatchState.FINISHED:
            return Colors.Green;
    }
}

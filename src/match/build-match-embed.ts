import {
    APIEmbedField,
    ColorResolvable,
    EmbedBuilder,
    Guild,
    userMention,
} from 'discord.js';
import { MatchDraftStep, MatchState, Prisma } from '../../.prisma';
import { championToChampionName } from '../data/championMappings';
import { maptoMapName } from '../data/mapMappings';

export function buildMatchEmbed(
    match: Prisma.MatchGetPayload<{
        include: {
            map: true;
            teams: {
                include: {
                    users: { include: { user: true } };
                    bans: { include: { champion: true } };
                    picks: { include: { champion: true } };
                };
            };
        };
    }>,
    guild: Guild,
    currentDraftTeam?: number,
    draftStep?: MatchDraftStep,
): EmbedBuilder {
    const teamsFields: APIEmbedField[] = match.teams.map((t) => {
        const userMentions = t.users
            .map(
                (u) =>
                    `${userMention(u.user.userDiscordId)} ${u.captain ? '- Captain' : ''}`,
            )
            .join('\n');
        return {
            name: `Team ${t.order + 1}`,
            value: userMentions,
            inline: true,
        };
    });

    const teamBansFields: APIEmbedField[] = match.teams.map((t) => {
        const teamBans = t.bans
            .sort((a, b) => b.draftOrder - a.draftOrder)
            .map(
                (b) =>
                    championToChampionName.get(b.champion.champion) ||
                    'Unknown' + (b.global ? ' (global)' : ''),
            )
            .join('\n');
        return {
            name: `Team ${t.order + 1} bans`,
            value: teamBans,
            inline: true,
        };
    });

    const teamPicksFields: APIEmbedField[] = match.teams.map((t) => {
        const teamPicks = t.picks
            .sort((a, b) => b.draftOrder - a.draftOrder)
            .map(
                (p) =>
                    championToChampionName.get(p.champion.champion) ||
                    'Unknown',
            )
            .join('\n');
        return {
            name: `Team ${t.order + 1} picks`,
            value: teamPicks,
            inline: true,
        };
    });

    const mapName = maptoMapName.get(match.map.map) || 'Unknown';
    const mapVariantName = match.map.variant === 'DAY' ? 'Day' : 'Night';

    const infoFields: APIEmbedField[] = [
        { name: 'Map', value: `${mapName} ${mapVariantName}` },
    ];

    if (
        match.state === 'DRAFT' &&
        currentDraftTeam !== undefined &&
        draftStep !== undefined
    ) {
        infoFields.push({
            name: 'Current Step',
            value: `Team ${currentDraftTeam + 1} ${draftStep.type.replace('_', ' ')}`, // FIXME: remove ugly hack to display draft step (maybe not worth but idk)
        });
    }

    const allRestrictions: string[] = [];
    match.teams.forEach((t) => {
        t.picks.forEach((p) => {
            if (p.champion.restrictions) {
                allRestrictions.push(
                    `${championToChampionName.get(p.champion.champion)}: ${p.champion.restrictions}`,
                );
            }
        });
    });
    const uniqueRestrictions = [...new Set(allRestrictions)];

    const footerFields: APIEmbedField[] = [];

    if (uniqueRestrictions.length) {
        footerFields.push({
            name: 'Restrictions',
            value: uniqueRestrictions.join('\n'),
        });
    }

    if (match.state === 'ONGOING') {
        const matchUsers = match.teams.flatMap((t) => t.users);
        const winReports = Object.groupBy(
            matchUsers,
            (u) => u.teamWinReport || -1,
        );
        const dropReportCount = matchUsers
            .map((u) => u.dropReport)
            .filter((r) => r === true).length;

        const reportStrings: string[] = match.teams.map(
            (t) => `Team ${t.order + 1}: ${winReports[t.order]?.length}`,
        );
        reportStrings.push(`Drop: ${dropReportCount}`);

        footerFields.push({
            name: 'Match Reports',
            value: reportStrings.join('\n'),
        });
    }

    if (match.state === 'FINISHED' && match.teamWin) {
        const usersRatingChange = match.teams.flatMap((t) =>
            t.users.map((u) => u.ratingChange),
        );
        const averageRatingChange =
            usersRatingChange.reduce((a, b) => a + b) /
            usersRatingChange.length;
        footerFields.push({
            name: `Team ${match.teamWin + 1} wins!`,
            value: `Average rating change: ${averageRatingChange}`,
        });
    }

    if (match.state === 'DROPPED') {
        footerFields.push({
            name: 'Match Dropped',
            value: 'No rating changes',
        });
    }

    return new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .setColor(getEmbedColor(match.state))
        .addFields(teamsFields)
        .addFields(infoFields)
        .addFields(teamBansFields)
        .addFields({ name: '\u200B', value: '\u200B', inline: true }) // cool hack to align inline fields
        .addFields(teamPicksFields)
        .addFields({ name: '\u200B', value: '\u200B', inline: true }) // cool hack to align inline fields
        .addFields(footerFields)
        .setTimestamp();
}

function getEmbedColor(matchState: MatchState): ColorResolvable {
    switch (matchState) {
        case 'NEW':
            return 'White';
        case 'DRAFT':
        case 'ONGOING':
            return 'Orange';
        case 'DROPPED':
            return 'Red';
        case 'FINISHED':
            return 'Green';
    }
}

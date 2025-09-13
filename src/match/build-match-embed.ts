import {
    APIEmbedField,
    ColorResolvable,
    EmbedAuthorOptions,
    EmbedBuilder,
    userMention,
} from 'discord.js';
import { MatchDraftStep, MatchState } from '../../.prisma';
import { client } from '../config';
import { MatchRepository } from '../repository/match.repository';

export function buildMatchEmbed(
    match: MatchRepository,
    currentDraftTeam?: number,
    draftStep?: MatchDraftStep,
): EmbedBuilder {
    const teamsFields: APIEmbedField[] = match.teams.map((t) => {
        const userMentions = t.players
            .map(
                (p) =>
                    `${userMention(p.member.discordId)} ${p.captain ? '- Captain' : ''}`,
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
            .sort((a, b) => a.draftOrder - b.draftOrder)
            .map((b) => b.champion.name + (b.global ? ' (global)' : ''))
            .join('\n');
        return {
            name: `Team ${t.order + 1} bans`,
            value: teamBans,
            inline: true,
        };
    });

    const teamPicksFields: APIEmbedField[] = match.teams.map((t) => {
        const teamPicks = t.picks
            .sort((a, b) => a.draftOrder - b.draftOrder)
            .map((p) => p.champion.name)
            .join('\n');
        return {
            name: `Team ${t.order + 1} picks`,
            value: teamPicks,
            inline: true,
        };
    });

    const infoFields: APIEmbedField[] = [
        { name: 'Map', value: match.data.map.name },
    ];

    if (
        match.data.state === 'DRAFT' &&
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
                    `${p.champion.name}: ${p.champion.restrictions}`,
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

    if (match.data.state === 'ONGOING') {
        const reportStrings: string[] = match.teams.map(
            (t) =>
                `Team ${t.order + 1}: ${match.winReportCounts.get(t.order) || 0}`,
        );
        reportStrings.push(`Drop: ${match.dropReportCount}`);

        footerFields.push({
            name: 'Match Reports',
            value: reportStrings.join('\n'),
        });
    }

    if (match.data.state === 'FINISHED' && match.data.teamWin !== null) {
        const playersRatingChange = match.teams.flatMap((t) =>
            t.players.map((p) => p.ratingChange),
        );
        const averageRatingChange =
            playersRatingChange.reduce((a, b) => Math.abs(a) + Math.abs(b)) /
            playersRatingChange.length;
        footerFields.push({
            name: `Team ${match.data.teamWin + 1} wins!`,
            value: `Average rating change: ${averageRatingChange}`,
        });
    }

    if (match.data.state === 'DROPPED') {
        footerFields.push({
            name: 'Match Dropped',
            value: 'No rating changes',
        });
    }

    const guild = client.guilds.cache.get(match.data.guild.discordId);
    const icon = guild?.iconURL();

    const author: EmbedAuthorOptions = { name: `Match #${match.data.id}` };

    if (icon) {
        author.iconURL = icon;
    }

    return new EmbedBuilder()
        .setAuthor(author)
        .setColor(getEmbedColor(match.data.state))
        .addFields(teamsFields)
        .addFields({ name: '\u200B', value: '\u200B', inline: true }) // cool hack to align inline fields
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

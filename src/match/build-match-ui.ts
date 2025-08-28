import {
    ActionRowBuilder,
    APIEmbedField,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    userMention,
} from 'discord.js';
import { ChampionData, MatchDraftStep, Prisma } from '../../.prisma';
import { championToChampionName } from '../data/championMappings';
import { maptoMapName } from '../data/mapMappings';

export function buildMatchEmbed(
    match: Prisma.MatchGetPayload<{
        include: {
            map: true;
            teams: {
                include: {
                    users: { include: { user: true } };
                    bans: true;
                    picks: true;
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
            .map((b) => championToChampionName.get(b.champion) || 'Unknown')
            .join('\n');
        return {
            name: `Team ${t.order + 1} bans`,
            value: teamBans,
            inline: true,
        };
    });

    const teamPicksFields: APIEmbedField[] = match.teams.map((t) => {
        const teamPicks = t.picks
            .map((p) => championToChampionName.get(p.champion) || 'Unknown')
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
            value: `Team ${currentDraftTeam + 1} ${draftStep.type}`,
        });
    }

    const allRestrictions: string[] = [];
    match.teams.forEach((t) => {
        t.picks.forEach((p) => {
            if (p.restrictions) {
                allRestrictions.push(
                    `${championToChampionName.get(p.champion)}: ${p.restrictions}`,
                );
            }
        });
    });
    const uniqueRestrictions = [...new Set(allRestrictions)];

    const footerFields: APIEmbedField[] = [
        {
            name: 'Restrictions',
            value: uniqueRestrictions.join('\n'),
        },
    ];

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

    return new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .addFields(teamsFields)
        .addFields(infoFields)
        .addFields(teamBansFields)
        .addFields({ name: '\u200B', value: '\u200B', inline: true }) // cool hack to align inline fields
        .addFields(teamPicksFields)
        .addFields({ name: '\u200B', value: '\u200B', inline: true }) // cool hack to align inline fields
        .addFields(footerFields)
        .setTimestamp();
}

export function buildDraftButtons() {
    const meleeButton = new ButtonBuilder()
        .setCustomId('meleeButton')
        .setLabel('Melee')
        .setStyle(ButtonStyle.Primary);

    const rangedButton = new ButtonBuilder()
        .setCustomId('rangedButton')
        .setLabel('Ranged')
        .setStyle(ButtonStyle.Primary);

    const supportButton = new ButtonBuilder()
        .setCustomId('supportButton')
        .setLabel('Support')
        .setStyle(ButtonStyle.Primary);
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(meleeButton)
        .addComponents(rangedButton)
        .addComponents(supportButton);
}

export function buildReportButtons(teams: number) {
    const buttons: ButtonBuilder[] = [];

    for (let i = 0; i < teams; i++) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`reportButtonTeam${i}`)
                .setLabel(`Team ${i + 1}`)
                .setStyle(ButtonStyle.Primary),
        );
    }

    const dropButton = new ButtonBuilder()
        .setCustomId('reportButtonDrop')
        .setLabel('Drop')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(...buttons)
        .addComponents(dropButton);
}

export function buildDraftSelectionLists(
    match: Prisma.MatchGetPayload<{
        include: { teams: { include: { bans: true; picks: true } } };
    }>,
    team: Prisma.MatchTeamGetPayload<{ include: { bans: true; picks: true } }>,
    draftStep: MatchDraftStep,
    champions: ChampionData[],
) {
    const teamBans = team.bans.map((b) => b.id);
    const teamPicks = team.picks.map((p) => p.id);
    const enemyTeams = match.teams.filter((t) => t.id !== team.id);
    const enemyBans: number[] = [];
    enemyTeams.forEach((et) => enemyBans.push(...et.bans.map((eb) => eb.id)));
    const enemyPicks: number[] = [];
    enemyTeams.forEach((et) => enemyPicks.push(...et.picks.map((ep) => ep.id)));

    const canPick = (id: number) => {
        return (
            (draftStep.type === 'BAN' &&
                !teamBans.includes(id) &&
                !enemyPicks.includes(id)) ||
            (draftStep.type === 'PICK' &&
                !teamPicks.includes(id) &&
                !enemyBans.includes(id))
        );
    };

    const meleeChampions = champions
        .filter((c) => c.type === 'MELEE' && canPick(c.id))
        .map(championToSelectOption);
    const rangedChampions = champions
        .filter((c) => c.type === 'RANGED' && canPick(c.id))
        .map(championToSelectOption);
    const supportChampions = champions
        .filter((c) => c.type === 'SUPPORT' && canPick(c.id))
        .map(championToSelectOption);

    const meleeList = new StringSelectMenuBuilder()
        .setCustomId('meleeList')
        .setPlaceholder('Choose a melee champion')
        .addOptions(meleeChampions);
    const rangedList = new StringSelectMenuBuilder()
        .setCustomId('rangedList')
        .setPlaceholder('Choose a ranged champion')
        .addOptions(rangedChampions);
    const supportList = new StringSelectMenuBuilder()
        .setCustomId('supportList')
        .setPlaceholder('Choose a support champion')
        .addOptions(supportChampions);

    return {
        melee: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            meleeList,
        ),
        ranged: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            rangedList,
        ),
        support: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            supportList,
        ),
    };
}

function championToSelectOption(c: ChampionData) {
    const championName = championToChampionName.get(c.champion) || 'Unknown';
    return new StringSelectMenuOptionBuilder()
        .setLabel(championName)
        .setDescription(championName)
        .setValue(c.id.toString());
}

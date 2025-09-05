import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ChampionData, MatchDraftStep, Prisma } from '../../.prisma';
import { championToChampionName } from '../data/championMappings';

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

    const claimCaptainButton = new ButtonBuilder()
        .setCustomId('claimCaptainButton')
        .setLabel('Claim captain')
        .setStyle(ButtonStyle.Danger);

    const dropButton = new ButtonBuilder()
        .setCustomId('draftButtonDrop')
        .setLabel('Drop')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(meleeButton)
        .addComponents(rangedButton)
        .addComponents(supportButton)
        .addComponents(claimCaptainButton)
        .addComponents(dropButton);
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
    const enemyTeams = match.teams.filter((t) => t.id !== team.id);
    const enemyBans = enemyTeams.flatMap((et) => et.bans);
    const enemyPicks = enemyTeams.flatMap((et) => et.picks);

    const canPick = (id: number) => {
        const globalBans = [
            ...team.bans.filter((tb) => tb.global),
            ...enemyBans.filter((eb) => eb.global),
        ];

        return (
            (['BAN', 'GLOBAL_BAN'].includes(draftStep.type) &&
                !team.bans.map((tb) => tb.championId).includes(id) &&
                !enemyPicks.map((ep) => ep.championId).includes(id) &&
                !globalBans.map((gb) => gb.championId).includes(id)) ||
            (draftStep.type === 'PICK' &&
                !team.picks.map((tp) => tp.championId).includes(id) &&
                !enemyBans.map((eb) => eb.championId).includes(id) &&
                !globalBans.map((gb) => gb.championId).includes(id))
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

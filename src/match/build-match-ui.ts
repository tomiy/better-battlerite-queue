import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ChampionData, MatchDraftStep } from '../../.prisma';
import { FullMatchTeam, MatchRepository } from '../repository/match.repository';

export function buildDraftButtons() {
    const previousPageButton = new ButtonBuilder()
        .setCustomId('previousPageButton')
        .setLabel('Previous page')
        .setStyle(ButtonStyle.Primary);

    const nextPageButton = new ButtonBuilder()
        .setCustomId('nextPageButton')
        .setLabel('Next page')
        .setStyle(ButtonStyle.Primary);

    const claimCaptainButton = new ButtonBuilder()
        .setCustomId('claimCaptainButton')
        .setLabel('Claim captain')
        .setStyle(ButtonStyle.Danger);

    const dropButton = new ButtonBuilder()
        .setCustomId('draftButtonDrop')
        .setLabel('Drop')
        .setStyle(ButtonStyle.Danger);

    return [
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(previousPageButton)
            .addComponents(nextPageButton),
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(claimCaptainButton)
            .addComponents(dropButton),
    ];
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
    match: MatchRepository,
    team: FullMatchTeam,
    draftStep: MatchDraftStep,
    champions: ChampionData[],
    currentPage: number = 0,
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
            (draftStep.type === 'PICK' && // TODO: global pick
                !team.picks.map((tp) => tp.championId).includes(id) &&
                !enemyBans.map((eb) => eb.championId).includes(id) &&
                !globalBans.map((gb) => gb.championId).includes(id))
        );
    };

    const pickableChampions = champions
        .filter((c) => canPick(c.id))
        .splice(currentPage * 25, 25)
        .map(championToSelectOption);

    const meleeList = new StringSelectMenuBuilder()
        .setCustomId('championList')
        .setPlaceholder(
            `Choose a champion to ${draftStep.type.replace('_', ' ')}`,
        ) // FIXME: remove ugly hack to display draft step (maybe not worth but idk)
        .addOptions(pickableChampions);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        meleeList,
    );
}

function championToSelectOption(c: ChampionData) {
    return new StringSelectMenuOptionBuilder()
        .setLabel(c.name)
        .setDescription(c.name)
        .setValue(c.id.toString());
}

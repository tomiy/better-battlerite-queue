import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageActionRowComponentBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { matchManager } from '../../../config/state';

export async function buildReportUI(
    matchId: number,
    page: number,
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
    const match = await matchManager.getFullMatch(matchId);

    if (!match) {
        throw new Error(`No matching match for id ${matchId}`);
    }

    const matchTeamCount = match.teams.length;

    const pickableTeamOptions = match.teams.splice(page * 25, 25).map((t) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(
                `Team ${t.order + 1} (${t.players.find((p) => p.captain)?.serverGameProfile.inGameName || 'no captain'})`,
            )
            .setDescription(t.order.toString())
            .setValue(t.order.toString()),
    );

    const teamSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`teamList_${match.id}`)
        .setPlaceholder('Select the winning team')
        .addOptions(pickableTeamOptions);

    const previousPageButton = new ButtonBuilder()
        .setCustomId(`reportPreviousPage_${match.id}_${page}_${matchTeamCount}`)
        .setLabel('Previous page')
        .setStyle(ButtonStyle.Primary);

    const nextPageButton = new ButtonBuilder()
        .setCustomId(`reportNextPage_${match.id}_${page}_${matchTeamCount}`)
        .setLabel('Next page')
        .setStyle(ButtonStyle.Primary);

    const dropButton = new ButtonBuilder()
        .setCustomId(`reportDrop_${match.id}`)
        .setLabel('Drop')
        .setStyle(ButtonStyle.Danger);

    return [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            teamSelectMenu,
        ),
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(previousPageButton)
            .addComponents(nextPageButton)
            .addComponents(dropButton),
    ];
}

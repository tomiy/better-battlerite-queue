import {
    ActionRowBuilder,
    ButtonBuilder,
    MessageActionRowComponentBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { DraftStepType } from '../../../../.prisma';
import { FullMatch } from '../../../core/data-types.type';
import { buildDraftButtons } from './build-draft-buttons';

export async function buildPlayerDraftUI(
    match: FullMatch,
    teamId: number,
    page: number,
    canDraft: boolean,
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
    const players = match.teams.flatMap((t) =>
        t.players.filter((p) => !p.captain),
    );

    const draftPlayerProfileIds = match.teams.flatMap((t) =>
        t.draftActions
            .filter((da) => da.type === DraftStepType.PLAYER_PICK)
            .map((da) => da.serverGameProfileId),
    );

    const pickablePlayers = players.filter(
        (p) => !draftPlayerProfileIds.includes(p.serverGameProfileId),
    );

    const pickablePlayerCount = pickablePlayers.length;

    const pickablePlayerOptions = pickablePlayers.map((p) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(p.serverGameProfile.inGameName)
            .setDescription(p.serverGameProfile.discordId)
            .setValue(p.id.toString()),
    );

    const playerSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`playerList_${match.id}_${teamId}`)
        .setPlaceholder('Pick a player')
        .addOptions(pickablePlayerOptions);

    const draftButtons = buildDraftButtons(
        match.id,
        teamId,
        page,
        pickablePlayerCount,
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
                  playerSelectMenu,
              ),
              ...buttonRows,
          ]
        : [...buttonRows];
}

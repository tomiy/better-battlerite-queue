import { ButtonBuilder, ButtonStyle } from 'discord.js';

export function buildDraftButtons(
    matchId: number,
    teamId: number,
    page: number,
    listCount: number,
    canDraft: boolean,
) {
    const previousPageButton = new ButtonBuilder()
        .setCustomId(
            `draftPreviousPage_${matchId}_${teamId}_${page}_${listCount}`,
        )
        .setLabel('Previous page')
        .setStyle(ButtonStyle.Primary);

    const nextPageButton = new ButtonBuilder()
        .setCustomId(`draftNextPage_${matchId}_${teamId}_${page}_${listCount}`)
        .setLabel('Next page')
        .setStyle(ButtonStyle.Primary);

    const claimCaptainButton = new ButtonBuilder()
        .setCustomId(`draftClaimCaptain_${matchId}_${teamId}`)
        .setLabel('Claim captain')
        .setStyle(ButtonStyle.Danger);

    const dropButton = new ButtonBuilder()
        .setCustomId(`draftDrop_${matchId}_${teamId}`)
        .setLabel('Drop')
        .setStyle(ButtonStyle.Danger);

    return canDraft
        ? [
              [previousPageButton, nextPageButton],
              [claimCaptainButton, dropButton],
          ]
        : [[claimCaptainButton, dropButton]];
}

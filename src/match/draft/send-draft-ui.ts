import {
    ComponentType,
    Guild,
    Message,
    MessageFlags,
    TextChannel,
    userMention,
} from 'discord.js';
import { Guild as dbGuild } from '../../../.prisma';
import { prisma } from '../../config';
import { tempReply } from '../../interaction-utils';
import { MatchRepository } from '../../repository/match.repository';
import { buildMatchEmbed } from '../build-match-embed';
import { buildDraftButtons, buildDraftSelectionLists } from '../build-match-ui';
import { sendReportUI } from '../report/send-report-ui';
import { tryMatchConclusion } from '../try-match-conclusion';
import {
    canDraft,
    clearCaptainClaimTimeouts,
    processDraftStep,
    tryClaimCaptain,
} from './draft-functions';

export async function sendDraftUI(
    match: MatchRepository,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
) {
    const totalSteps =
        match.data.draftSequence.steps.length * match.teams.length;

    if (match.data.currentDraftStep >= totalSteps) {
        sendReportUI(match, guild, dbGuild, teamChannels);
        return;
    }

    const roundNumber = Math.floor(
        match.data.currentDraftStep / match.teams.length,
    );
    const pickNumber = match.data.currentDraftStep % match.teams.length;
    const currentDraftTeam =
        roundNumber % 2 === 1
            ? match.teams.length - pickNumber - 1
            : pickNumber;

    const draftStep = match.data.draftSequence.steps.find(
        (s) => s.order === roundNumber,
    );

    if (!draftStep) {
        throw new Error('[Draft UI] No matching draft step for current round!');
    }

    const champions = await prisma.championData.findMany({
        where: { guildId: dbGuild.id },
    });

    const mainEmbed = buildMatchEmbed(
        match,
        guild,
        currentDraftTeam,
        draftStep,
    );

    const categoryButtonsRow = buildDraftButtons();

    const draftUIMessages: Message[] = [];

    for (const tc of teamChannels) {
        const matchingTeam = match.teams.find((t) => t.teamChannel === tc.id);

        if (!matchingTeam) {
            throw new Error('[Draft UI] No matching team for team channel!');
        }

        const captain = matchingTeam.players.find((p) => p.captain);

        if (!captain) {
            throw new Error(
                `[Draft UI] No captain for team ${matchingTeam.id}!`,
            );
        }

        const draftUIMessage = await tc.send({
            embeds: [mainEmbed],
            components: [categoryButtonsRow],
        });
        draftUIMessages.push(draftUIMessage);

        if (currentDraftTeam === matchingTeam.order) {
            await tc.send(
                `${userMention(captain.member.discordId)} it's your turn to draft!`,
            );
        }

        const buttonCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        const selectCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
        });

        buttonCollector?.on('collect', async (i) => {
            const matchingPlayer = match.players.find(
                (u) => u.member.discordId === i.member.id,
            );

            switch (i.customId) {
                case 'claimCaptainButton':
                    await i.deferReply({ flags: MessageFlags.Ephemeral });
                    await tryClaimCaptain(
                        i,
                        captain,
                        currentDraftTeam,
                        matchingTeam,
                        match,
                        guild,
                        dbGuild,
                        teamChannels,
                        draftUIMessages,
                        tc,
                    );
                    return;
                case 'draftButtonDrop':
                    await i.deferReply({ flags: MessageFlags.Ephemeral });

                    if (matchingPlayer) {
                        await match.updatePlayer(matchingPlayer.id, {
                            teamWinReport: null,
                            dropReport: true,
                        });

                        for (const teamChannel of teamChannels) {
                            await teamChannel.send(
                                `${match.dropReportCount} player(s) have voted to drop the match.`,
                            );
                        }

                        await tempReply(i, 'Vote registered!');
                        await tryMatchConclusion(match, guild, dbGuild);

                        return;
                    }

                    await tempReply(i, 'You are not in this match!');
                    return;
            }

            if (!(await canDraft(i, captain, currentDraftTeam, matchingTeam))) {
                return;
            }

            await i.deferUpdate();

            const row = buildDraftSelectionLists(
                match,
                matchingTeam,
                draftStep,
                champions,
            );

            switch (i.customId) {
                case 'meleeButton':
                    clearCaptainClaimTimeouts(matchingTeam.id);
                    await i.editReply({
                        components: [categoryButtonsRow, row.melee],
                    });
                    break;
                case 'rangedButton':
                    clearCaptainClaimTimeouts(matchingTeam.id);
                    await i.editReply({
                        components: [categoryButtonsRow, row.ranged],
                    });
                    break;
                case 'supportButton':
                    clearCaptainClaimTimeouts(matchingTeam.id);
                    await i.editReply({
                        components: [categoryButtonsRow, row.support],
                    });
                    break;
            }
        });

        selectCollector.on('collect', async (i) => {
            await i.deferReply({ flags: MessageFlags.Ephemeral });

            if (!(await canDraft(i, captain, currentDraftTeam, matchingTeam))) {
                return;
            }

            switch (i.customId) {
                case 'meleeList':
                case 'rangedList':
                case 'supportList':
                    clearCaptainClaimTimeouts(matchingTeam.id);
                    await processDraftStep(
                        match,
                        matchingTeam,
                        draftStep,
                        i,
                        guild,
                        dbGuild,
                        teamChannels,
                        draftUIMessages,
                    );
                    break;
            }
        });
    }
}

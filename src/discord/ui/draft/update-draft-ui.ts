import { EmbedBuilder, Guild, userMention } from 'discord.js';
import { DraftSequenceType } from '../../../../.prisma';
import {
    draftManager,
    matchManager,
    matchTeamManager,
} from '../../../config/state';
import { FullTeam } from '../../../core/data-types.type';
import { DebugUtils } from '../../../debug.utils';
import { buildMatchEmbed } from '../../embed/build-match-embed';
import { buildDraftUI } from './build-draft-ui';

export async function updateDraftUI(
    matchId: number,
    teamId: number,
    guild: Guild,
) {
    const match = await matchManager.getFullMatch(matchId);

    if (!match) {
        throw new Error(`No matching match for id ${matchId}`);
    }

    const draftSequence = match.gameMode.draftSequence;

    if (!draftSequence) {
        throw new Error(`No draft sequence for game mode ${match.gameMode.id}`);
    }

    const matchEmbed = await buildMatchEmbed(matchId, guild);

    const team = match.teams.find((t) => t.id === teamId);
    const otherTeams = match.teams.filter((t) => t.id !== teamId);

    if (teamId && !team) {
        DebugUtils.error(`No matching team for id ${teamId}!`);
        return;
    }

    const draftStepData = draftManager.getDraftStepData(
        match.teams,
        draftSequence,
    );

    if (team) {
        await updateTeamDraftUI(
            team,
            matchEmbed,
            guild,
            draftStepData?.draftTeamNumber,
        );
    }

    const allRoundsDrafted =
        !draftStepData ||
        draftStepData.draftStep.order % match.teams.length === 0;
    if (
        !teamId ||
        draftSequence.type === DraftSequenceType.SEQUENTIAL ||
        allRoundsDrafted
    ) {
        for (const otherTeam of otherTeams) {
            await updateTeamDraftUI(
                otherTeam,
                matchEmbed,
                guild,
                draftStepData?.draftTeamNumber,
            );
        }
    }
}

async function updateTeamDraftUI(
    team: FullTeam,
    matchEmbed: EmbedBuilder,
    guild: Guild,
    teamNumber?: number,
) {
    if (team.draftChannelId) {
        const draftChannel = await guild.channels.fetch(team.draftChannelId);

        if (!draftChannel || !draftChannel.isTextBased()) {
            DebugUtils.warning(`Draft channel not found for team ${team.id}!`);
            return;
        }

        if (team.draftMessageId) {
            try {
                const draftMessage = await draftChannel.messages.fetch(
                    team.draftMessageId,
                );

                if (draftMessage) {
                    await draftMessage.delete();
                }
            } catch (e) {
                DebugUtils.warning(`Message not found: ${e}`);
            }
        }

        const canDraft =
            (teamNumber && teamNumber < 0) || team.order === teamNumber;

        const draftUI = await buildDraftUI(team.matchId, team.id, 0, canDraft);

        const newDraftMessage = await draftChannel.send({
            embeds: [matchEmbed],
            components: draftUI,
        });

        await matchTeamManager.updateDraftMessage(team.id, newDraftMessage.id);

        if (canDraft) {
            const captain = team.players.find((p) => p.captain);

            if (captain) {
                await draftChannel.send(
                    `${userMention(captain?.serverGameProfile.discordId)} it's your turn to draft!`,
                );
            }
        }
    }
}

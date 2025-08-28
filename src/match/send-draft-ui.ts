import { ComponentType, Guild, Message, TextChannel } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import {
    buildMatchButtons,
    buildMatchEmbed,
    buildMatchSelectionLists,
} from './build-match-ui';
import { checkCanDraft, processBan, processPick } from './draft-functions';

export async function sendDraftUI(
    matchId: number,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
) {
    const match = await prisma.match.findFirstOrThrow({
        where: { id: matchId },
        include: {
            map: true,
            draftSequence: { include: { steps: true } },
            teams: {
                include: {
                    users: { include: { user: true } },
                    picks: true,
                    bans: true,
                },
            },
        },
    });

    const totalSteps = match.draftSequence.steps.length * match.teams.length;

    if (match.currentDraftStep >= totalSteps) {
        prisma.match.update({
            where: { id: matchId },
            data: { state: 'ONGOING' },
        });

        if (match.currentDraftStep >= totalSteps) {
            prisma.match.update({
                where: { id: matchId },
                data: { state: 'ONGOING' },
            });

            const mainEmbed = buildMatchEmbed(match, guild);

            for (const tc of teamChannels) {
                tc.send({ embeds: [mainEmbed] });
            }

            const matchHistoryChannel = guild.channels.resolve(
                dbGuild.matchHistoryChannel || '',
            );

            if (matchHistoryChannel instanceof TextChannel) {
                matchHistoryChannel.send({ embeds: [mainEmbed] });
            }

            return;
        }

        return;
    }

    const roundNumber = Math.floor(match.currentDraftStep / match.teams.length);
    const pickNumber = match.currentDraftStep % match.teams.length;
    const currentDraftTeam =
        roundNumber % 2 === 1
            ? match.teams.length - pickNumber - 1
            : pickNumber;

    const draftStep = match.draftSequence.steps.find(
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

    const categoryButtonsRow = buildMatchButtons();

    const draftUIMessages: Message[] = [];

    for (const tc of teamChannels) {
        const matchingTeam = match.teams.find((t) => t.teamChannel === tc.id);

        if (!matchingTeam) {
            throw new Error('[Draft UI] No matching team for team channel!');
        }

        const captain = matchingTeam.users.find((u) => u.captain);

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

        const buttonCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        const selectCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
        });

        buttonCollector?.on('collect', async (i) => {
            if (!checkCanDraft(i, captain, currentDraftTeam, matchingTeam)) {
                return;
            }

            const row = buildMatchSelectionLists(
                match,
                matchingTeam,
                draftStep,
                champions,
            );

            switch (i.customId) {
                case 'meleeButton':
                    i.update({ components: [categoryButtonsRow, row.melee] });
                    break;
                case 'rangedButton':
                    i.update({ components: [categoryButtonsRow, row.ranged] });
                    break;
                case 'supportButton':
                    i.update({ components: [categoryButtonsRow, row.support] });
                    break;
            }
        });

        selectCollector.on('collect', async (i) => {
            if (!checkCanDraft(i, captain, currentDraftTeam, matchingTeam)) {
                return;
            }

            switch (i.customId) {
                case 'meleeList':
                case 'rangedList':
                case 'supportList':
                    if (draftStep.type === 'BAN') {
                        await processBan(
                            matchingTeam,
                            i,
                            match,
                            guild,
                            dbGuild,
                            teamChannels,
                            draftUIMessages,
                        );
                    }

                    if (draftStep.type === 'PICK') {
                        await processPick(
                            matchingTeam,
                            i,
                            match,
                            guild,
                            dbGuild,
                            teamChannels,
                            draftUIMessages,
                        );
                    }
                    break;
            }
        });
    }
}

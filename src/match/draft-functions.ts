import {
    Guild,
    Message,
    MessageComponentInteraction,
    StringSelectMenuInteraction,
    TextChannel,
} from 'discord.js';
import {
    Match,
    MatchDraftStep,
    MatchTeam,
    Prisma,
    Guild as dbGuild,
} from '../../.prisma';
import { prisma } from '../config';
import { tempReply } from '../interaction-utils';
import { sendDraftUI } from './send-draft-ui';

export async function checkCanDraft(
    i: MessageComponentInteraction<'cached'>,
    captain: Prisma.MatchPlayerGetPayload<{ include: { member: true } }>,
    currentDraftTeam: number,
    team: MatchTeam,
) {
    if (i.member.id !== captain?.member.discordId) {
        tempReply(i, 'You are not captain!');
        return false;
    }

    if (currentDraftTeam !== team.order) {
        tempReply(i, 'It is not your turn to draft!');
        return false;
    }

    return true;
}
export async function sendNextStep(
    match: Match,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    await prisma.match.update({
        where: { id: match.id },
        data: {
            currentDraftStep: match.currentDraftStep + 1,
        },
    });

    for (const message of draftUIMessages) {
        await message.delete();
    }

    await sendDraftUI(match.id, guild, dbGuild, teamChannels);
}

export async function processDraftStep(
    match: Match,
    team: MatchTeam,
    step: MatchDraftStep,
    i: StringSelectMenuInteraction,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    let updated = null;
    if (['BAN', 'GLOBAL_BAN'].includes(step.type)) {
        updated = await prisma.matchTeam.update({
            where: { id: team.id },
            data: {
                bans: {
                    create: {
                        global: step.type === 'GLOBAL_BAN',
                        draftOrder: match.currentDraftStep,
                        championId: parseInt(i.values[0]),
                    },
                },
            },
        });
    }
    if (step.type === 'PICK') {
        updated = await prisma.matchTeam.update({
            where: { id: team.id },
            data: {
                picks: {
                    create: {
                        draftOrder: match.currentDraftStep,
                        championId: parseInt(i.values[0]),
                    },
                },
            },
        });
    }

    if (updated) {
        tempReply(i, 'Draft action registered!');
        await sendNextStep(
            match,
            guild,
            dbGuild,
            teamChannels,
            draftUIMessages,
        );
    }
}

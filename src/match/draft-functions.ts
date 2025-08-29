import {
    Guild,
    Message,
    MessageComponentInteraction,
    StringSelectMenuInteraction,
    TextChannel,
} from 'discord.js';
import { Match, MatchTeam, Prisma, Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { tempReply } from '../interaction-utils';
import { sendDraftUI } from './send-draft-ui';

export async function checkCanDraft(
    i: MessageComponentInteraction<'cached'>,
    captain: Prisma.MatchUserGetPayload<{ include: { user: true } }>,
    currentDraftTeam: number,
    team: MatchTeam,
) {
    if (i.member.id !== captain?.user.userDiscordId) {
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
export async function processPick(
    matchingTeam: MatchTeam,
    i: StringSelectMenuInteraction,
    match: Match,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    const updated = await prisma.matchTeam.update({
        where: { id: matchingTeam.id },
        data: {
            picks: {
                connect: { id: parseInt(i.values[0]) },
            },
        },
    });

    if (updated) {
        tempReply(i, 'Pick registered!');

        await sendNextStep(
            match,
            guild,
            dbGuild,
            teamChannels,
            draftUIMessages,
        );
    }
}
export async function processBan(
    matchingTeam: MatchTeam,
    i: StringSelectMenuInteraction,
    match: Match,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    const updated = await prisma.matchTeam.update({
        where: { id: matchingTeam.id },
        data: {
            bans: {
                connect: { id: parseInt(i.values[0]) },
            },
        },
    });

    if (updated) {
        tempReply(i, 'Ban registered!');

        await sendNextStep(
            match,
            guild,
            dbGuild,
            teamChannels,
            draftUIMessages,
        );
    }
}

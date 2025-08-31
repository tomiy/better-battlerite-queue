import {
    ButtonInteraction,
    Guild,
    Message,
    MessageComponentInteraction,
    StringSelectMenuInteraction,
    TextChannel,
} from 'discord.js';
import {
    Match,
    MatchDraftStep,
    MatchPlayer,
    MatchTeam,
    Prisma,
    Guild as dbGuild,
} from '../../.prisma';
import { prisma } from '../config';
import { tempReply } from '../interaction-utils';
import { sendDraftUI } from './send-draft-ui';

export async function canDraft(
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

export async function tryClaimCaptain(
    i: ButtonInteraction<'cached'>,
    captain: Prisma.MatchPlayerGetPayload<{ include: { member: true } }>,
    currentDraftTeam: number,
    team: Prisma.MatchTeamGetPayload<{
        include: { players: { include: { member: true } } };
    }>,
    matchId: number,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
    tc: TextChannel,
) {
    if (i.member.id === captain?.member.discordId) {
        await tempReply(i, 'You are already captain!');
        return;
    }

    if (currentDraftTeam !== team.order) {
        tempReply(i, 'You can only claim captain on your turn!');
    }

    if (captainClaimTimeouts.get(team.id)) {
        await tempReply(
            i,
            'A claim request has already been made for this team!',
        );
        return;
    }

    const newCaptain = team.players.find(
        (p) => p.member.discordId === i.member.id,
    );

    if (!newCaptain) {
        throw new Error('[Draft UI] No matching player for new captain!');
    }

    captainClaimTimeouts.set(
        team.id,
        setTimeout(async () => {
            await claimCaptain(newCaptain, captain);
            clearCaptainClaimTimeouts(team.id);

            for (const message of draftUIMessages) {
                await message.delete();
            }

            await sendDraftUI(matchId, guild, dbGuild, teamChannels);
        }, 60000),
    );

    await tc.send(
        `A captain claim request has been made for this team.
                        If the current captain doesn't perform any draft action within 1 minute,
                        the player making the request will be appointed as new captain.`,
    );

    tempReply(i, 'Claim registered!');
}

async function claimCaptain(newCaptain: MatchPlayer, oldCaptain: MatchPlayer) {
    await prisma.matchPlayer.update({
        where: { id: newCaptain.id },
        data: { captain: true },
    });

    await prisma.matchPlayer.update({
        where: { id: oldCaptain.id },
        data: { captain: false },
    });
}

const captainClaimTimeouts: Map<number, NodeJS.Timeout> = new Map();
export function clearCaptainClaimTimeouts(teamId: number) {
    const claim = captainClaimTimeouts.get(teamId);
    if (claim) {
        clearTimeout(claim);
        captainClaimTimeouts.delete(teamId);
    }
}

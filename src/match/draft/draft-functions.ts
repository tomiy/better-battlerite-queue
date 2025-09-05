import {
    ButtonInteraction,
    Guild,
    Message,
    MessageComponentInteraction,
    StringSelectMenuInteraction,
    TextChannel,
} from 'discord.js';
import {
    MatchDraftStep,
    MatchPlayer,
    MatchTeam,
    Guild as dbGuild,
} from '../../../.prisma';
import { tempReply } from '../../interaction-utils';
import {
    FullMatchPlayer,
    FullMatchTeam,
    MatchRepository,
} from '../../repository/match.repository';
import { sendDraftUI } from './send-draft-ui';

export async function canDraft(
    i: MessageComponentInteraction<'cached'>,
    captain: FullMatchPlayer,
    currentDraftTeam: number,
    team: MatchTeam,
) {
    if (i.member.id !== captain?.member.discordId) {
        await tempReply(i, 'You are not captain!');
        return false;
    }

    if (currentDraftTeam !== team.order) {
        await tempReply(i, 'It is not your turn to draft!');
        return false;
    }

    return true;
}

export async function sendNextStep(
    match: MatchRepository,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    await match.update({
        currentDraftStep: match.data.currentDraftStep + 1,
    });

    for (const message of draftUIMessages) {
        await message.delete();
    }

    await sendDraftUI(match, guild, dbGuild, teamChannels);
}

export async function processDraftStep(
    match: MatchRepository,
    team: MatchTeam,
    step: MatchDraftStep,
    i: StringSelectMenuInteraction,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
    draftUIMessages: Message[],
) {
    let updated = false;
    if (['BAN', 'GLOBAL_BAN'].includes(step.type)) {
        await match.updateTeam(team.id, {
            bans: {
                create: {
                    global: step.type === 'GLOBAL_BAN',
                    draftOrder: match.data.currentDraftStep,
                    championId: parseInt(i.values[0]),
                },
            },
        });
        updated = true;
    }
    if (step.type === 'PICK') {
        await match.updateTeam(team.id, {
            picks: {
                create: {
                    draftOrder: match.data.currentDraftStep,
                    championId: parseInt(i.values[0]),
                },
            },
        });
        updated = true;
    }

    if (updated) {
        await tempReply(i, 'Draft action registered!');
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
    captain: FullMatchPlayer,
    currentDraftTeam: number,
    team: FullMatchTeam,
    match: MatchRepository,
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
        await tempReply(i, 'You can only claim captain on your turn!');
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
            await claimCaptain(match, newCaptain, captain);
            clearCaptainClaimTimeouts(team.id);

            for (const message of draftUIMessages) {
                await message.delete();
            }

            await sendDraftUI(match, guild, dbGuild, teamChannels);
        }, 60000),
    );

    await tc.send(
        `A captain claim request has been made for this team. If the current captain doesn't perform any draft action within 1 minute, the player making the request will be appointed as new captain.`,
    );

    await tempReply(i, 'Claim registered!');
}

async function claimCaptain(
    match: MatchRepository,
    newCaptain: MatchPlayer,
    oldCaptain: MatchPlayer,
) {
    await match.updatePlayer(newCaptain.id, { captain: true });
    await match.updatePlayer(oldCaptain.id, { captain: false });
}

const captainClaimTimeouts: Map<number, NodeJS.Timeout> = new Map();
export function clearCaptainClaimTimeouts(teamId: number) {
    const claim = captainClaimTimeouts.get(teamId);
    if (claim) {
        clearTimeout(claim);
        captainClaimTimeouts.delete(teamId);
    }
}

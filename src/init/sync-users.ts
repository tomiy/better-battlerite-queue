import { Guild, GuildMember } from 'discord.js';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';

export async function syncUsers(guild: Guild) {
    try {
        DebugUtils.debug(`[Sync users] Syncing users for guild ${guild.id}`);

        const dbGuild = await prisma.guild.findFirstOrThrow({
            where: { guildDiscordId: guild.id },
        });

        const queueRole = dbGuild.queueRole;
        const matchRole = dbGuild.matchRole;
        const registeredRole = dbGuild.registeredRole;

        if (queueRole === null) {
            throw new Error('[Sync users] No queue role found, check bot logs');
        }

        if (matchRole === null) {
            throw new Error('[Sync users] No match role found, check bot logs');
        }

        if (registeredRole === null) {
            throw new Error(
                '[Sync users] No registered role found, check bot logs',
            );
        }

        const members = await guild.members.fetch();

        const syncedMembers: GuildMember[] = [];
        const dbUsers = await prisma.user.findMany({
            where: { guild: { guildDiscordId: guild.id } },
        });

        for (const dbUser of dbUsers) {
            const matchingMember = members.find(
                (m) => m.id === dbUser.userDiscordId,
            );

            if (
                matchingMember &&
                !matchingMember.roles.cache.has(registeredRole)
            ) {
                matchingMember.roles.add(registeredRole);

                syncedMembers.push(matchingMember);
            }
        }

        for (const [clientUserId, clientUser] of members) {
            const syncedMember = syncedMembers.find(
                (syncedMember) => syncedMember.id === clientUserId,
            );
            const dbUser = dbUsers.find(
                (dbUser) => dbUser.userDiscordId === clientUserId,
            );

            if (!syncedMember && !dbUser) {
                clientUser.roles.remove(registeredRole);
            }
        }

        const queuedMembers = members.filter((m) =>
            m.roles.cache.has(queueRole),
        );

        if (queuedMembers.size) {
            DebugUtils.debug('[Sync users] Purging old queued users...');

            queuedMembers.forEach(async (m) => await m.roles.remove(queueRole));

            DebugUtils.debug('[Sync users] Purged old queued users');
        }

        const matchedMembers = members.filter((m) =>
            m.roles.cache.has(matchRole),
        );

        if (matchedMembers.size) {
            DebugUtils.debug('[Sync users] Purging old matched users...');

            matchedMembers.forEach(
                async (m) => await m.roles.remove(matchRole),
            );

            DebugUtils.debug('[Sync users] Purged old matched users');
        }

        DebugUtils.debug('[Sync users] Dropping old matches...');

        const finishedMatches = await prisma.match.updateManyAndReturn({
            where: { state: { notIn: ['DROPPED', 'FINISHED'] } },
            data: { state: 'DROPPED' },
        });

        const finishedMatchesTeams = await prisma.matchTeam.findMany({
            where: { matchId: { in: finishedMatches.map((fm) => fm.id) } },
        });

        for (const finishedMatchTeam of finishedMatchesTeams) {
            if (finishedMatchTeam.teamChannel) {
                await guild.channels.delete(finishedMatchTeam.teamChannel);
            }
        }

        DebugUtils.debug('[Sync users] Dropped old matches');

        DebugUtils.debug(
            `[Sync users] Successfully synced users for guild ${guild.id}`,
        );
    } catch (e) {
        DebugUtils.error(`[Sync users] Error: ${e}`);
    }
}

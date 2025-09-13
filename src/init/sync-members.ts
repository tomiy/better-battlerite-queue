import { Guild, GuildMember, TextChannel } from 'discord.js';
import { prisma } from '../config';
import { DebugUtils } from '../debug-utils';
import { buildMatchEmbed } from '../match/build-match-embed';
import { MatchRepository } from '../repository/match.repository';

export async function syncMembers(guild: Guild) {
    try {
        DebugUtils.debug(
            `[Sync Members] Syncing members for guild ${guild.id}`,
        );

        const dbGuild = await prisma.guild.findFirstOrThrow({
            where: { discordId: guild.id },
        });

        const queueRole = dbGuild.queueRole;
        const matchRole = dbGuild.matchRole;
        const registeredRole = dbGuild.registeredRole;

        if (queueRole === null) {
            throw new Error(
                '[Sync Members] No queue role found, check bot logs',
            );
        }

        if (matchRole === null) {
            throw new Error(
                '[Sync Members] No match role found, check bot logs',
            );
        }

        if (registeredRole === null) {
            throw new Error(
                '[Sync Members] No registered role found, check bot logs',
            );
        }

        const members = await guild.members.fetch();

        const syncedMembers: GuildMember[] = [];
        const dbMembers = await prisma.member.findMany({
            where: { guild: { discordId: guild.id } },
        });

        for (const dbMember of dbMembers) {
            const matchingMember = members.find(
                (m) => m.id === dbMember.discordId,
            );

            if (
                matchingMember &&
                !matchingMember.roles.cache.has(registeredRole)
            ) {
                matchingMember.roles.add(registeredRole);

                syncedMembers.push(matchingMember);
            }
        }

        for (const [clientMemberId, clientMember] of members) {
            const syncedMember = syncedMembers.find(
                (syncedMember) => syncedMember.id === clientMemberId,
            );
            const dbMember = dbMembers.find(
                (dbmember) => dbmember.discordId === clientMemberId,
            );

            if (!syncedMember && !dbMember) {
                clientMember.roles.remove(registeredRole);
            }
        }

        const queuedMembers = members.filter((m) =>
            m.roles.cache.has(queueRole),
        );

        if (queuedMembers.size) {
            DebugUtils.debug('[Sync Members] Purging old queued members...');

            for (const m of queuedMembers.values()) {
                await m.roles.remove(queueRole);
            }

            DebugUtils.debug('[Sync Members] Purged old queued members');
        }

        const matchedMembers = members.filter((m) =>
            m.roles.cache.has(matchRole),
        );

        if (matchedMembers.size) {
            DebugUtils.debug('[Sync Members] Purging old matched members...');

            for (const m of matchedMembers.values()) {
                await m.roles.remove(matchRole);
            }

            DebugUtils.debug('[Sync Members] Purged old matched members');
        }

        DebugUtils.debug('[Sync Members] Dropping old matches...');

        if (!dbGuild.matchHistoryChannel) {
            throw new Error(
                '[Sync Members] No match history channel, check logs',
            );
        }

        const matchHistoryChannel = guild.channels.cache.get(
            dbGuild.matchHistoryChannel,
        );

        const finishedMatches = await prisma.match.updateManyAndReturn({
            where: { state: { notIn: ['DROPPED', 'FINISHED'] } },
            data: { state: 'DROPPED' },
        });

        for (const finishedMatch of finishedMatches) {
            if (matchHistoryChannel instanceof TextChannel) {
                if (finishedMatch.historyMessage) {
                    const historyMessage =
                        await matchHistoryChannel.messages.fetch(
                            finishedMatch.historyMessage,
                        );
                    if (historyMessage.editable) {
                        const fullMatch = await MatchRepository.get(
                            finishedMatch.id,
                        );

                        const matchEmbed = buildMatchEmbed(fullMatch);

                        await historyMessage.edit({
                            embeds: [matchEmbed],
                            components: [],
                        });
                    }
                }
            }
        }

        const finishedMatchesTeams = await prisma.matchTeam.findMany({
            where: { matchId: { in: finishedMatches.map((fm) => fm.id) } },
        });

        for (const finishedMatchTeam of finishedMatchesTeams) {
            if (finishedMatchTeam.teamChannel) {
                await guild.channels.delete(finishedMatchTeam.teamChannel);
            }
        }

        DebugUtils.debug('[Sync Members] Dropped old matches');

        DebugUtils.debug(
            `[Sync Members] Successfully synced members for guild ${guild.id}`,
        );
    } catch (e) {
        DebugUtils.error(`[Sync Members] Error: ${e}`);
    }
}

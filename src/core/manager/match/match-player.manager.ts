import { GuildMember } from 'discord.js';
import { MatchState, Server } from '../../../../.prisma';
import { DebugUtils } from '../../../debug.utils';
import { Manager } from '../manager';

type ReportData = {
    winReport: number | null;
    dropReport: boolean;
};

export class MatchPlayerManager extends Manager {
    async setRatingChange(id: number, ratingChange: number) {
        try {
            const updatedMatchPlayer = await this.prisma.matchPlayer.update({
                where: { id },
                data: { ratingChange },
            });

            if (updatedMatchPlayer) {
                DebugUtils.debug(
                    `[Match Player Manager] Updated rating change for match player id ${updatedMatchPlayer.id}`,
                );

                return updatedMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error updating rating change: ${e}`,
            );
        }

        return null;
    }

    async setReport(id: number, reportData: ReportData) {
        try {
            const updatedMatchPlayer = await this.prisma.matchPlayer.update({
                where: { id },
                data: {
                    winReport: reportData.winReport,
                    dropReport: reportData.dropReport,
                },
            });

            if (updatedMatchPlayer) {
                DebugUtils.debug(
                    `[Match Player Manager] Updated match player report for match player id ${updatedMatchPlayer.id}`,
                );

                return updatedMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error updating match player report: ${e}`,
            );
        }

        return null;
    }

    async isInAnyMatch(discordId: string) {
        try {
            const matchingPlayer = await this.prisma.matchPlayer.findFirst({
                where: {
                    serverGameProfile: { discordId },
                    team: {
                        match: {
                            state: {
                                notIn: [
                                    MatchState.DROPPED,
                                    MatchState.FINISHED,
                                ],
                            },
                        },
                    },
                },
            });

            return !!matchingPlayer;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error checking if player is in a match: ${e}`,
            );
        }

        return null;
    }

    async createMatchPlayer(serverGameProfileId: number, teamId: number) {
        try {
            const createdMatchPlayer = await this.prisma.matchPlayer.create({
                data: { serverGameProfileId, teamId },
            });

            if (createdMatchPlayer) {
                DebugUtils.debug(
                    `[Match Player Manager] Created match player with match player id ${createdMatchPlayer.id}`,
                );

                return createdMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error creating match player: ${e}`,
            );
        }

        return null;
    }

    async findMatchPlayerInLobby(member: GuildMember) {
        try {
            const matchingMatchPlayer = await this.prisma.matchPlayer.findFirst(
                {
                    where: {
                        serverGameProfile: { discordId: member.id },
                        team: { match: { state: MatchState.NEW } },
                    },
                    include: { team: { include: { match: true } } },
                },
            );

            if (matchingMatchPlayer) {
                return matchingMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error fetching match player: ${e}`,
            );
        }

        return null;
    }

    async deleteMatchPlayer(id: number) {
        try {
            const deletedMatchPlayer = await this.prisma.matchPlayer.delete({
                where: { id },
            });

            if (deletedMatchPlayer) {
                DebugUtils.debug(
                    `[Match Player Manager] Deleted match player with match player id ${deletedMatchPlayer.id}`,
                );

                return deletedMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error deleting match player: ${e}`,
            );
        }

        return null;
    }

    async joinMatch(
        member: GuildMember,
        server: Server,
        teamId: number,
        serverGameProfileId: number,
    ) {
        try {
            const createdMatchPlayer = await this.createMatchPlayer(
                serverGameProfileId,
                teamId,
            );

            if (createdMatchPlayer) {
                if (server.matchRoleId) {
                    await member.roles.add(server.matchRoleId);
                } else {
                    DebugUtils.warning(
                        '[Match Player Manager] No match role configured',
                    );
                }

                return createdMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error joining match: ${e}`,
            );
        }

        return null;
    }

    async leaveMatch(member: GuildMember, server: Server, playerId: number) {
        try {
            const deletedMatchPlayer = await this.deleteMatchPlayer(playerId);

            if (deletedMatchPlayer) {
                if (server.matchRoleId) {
                    await member.roles.remove(server.matchRoleId);
                } else {
                    DebugUtils.warning(
                        '[Match Player Manager] No match role configured',
                    );
                }

                return deletedMatchPlayer;
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Player Manager] Error leaving match: ${e}`,
            );
        }

        return null;
    }
}

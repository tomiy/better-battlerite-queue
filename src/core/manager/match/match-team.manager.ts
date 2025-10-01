import { DebugUtils } from '../../../debug.utils';
import { TeamWithPlayers } from '../../data-types.type';
import { Manager } from '../manager';

export class MatchTeamManager extends Manager {
    async setDraftChannel(teamId: number, channelId: string) {
        try {
            const updatedTeam = await this.prisma.matchTeam.update({
                where: { id: teamId },
                data: { draftChannelId: channelId },
            });

            if (updatedTeam) {
                DebugUtils.debug(
                    `[Match Team Manager] Updated draft channel for team ${teamId}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Team Manager] Error setting draft channel: ${e}`,
            );
        }
    }

    async findTeams(matchId: number): Promise<TeamWithPlayers[]> {
        try {
            const matchTeams = await this.prisma.matchTeam.findMany({
                where: { matchId },
                include: { players: { include: { serverGameProfile: true } } },
            });

            if (matchTeams) {
                return matchTeams;
            }

            return [];
        } catch (e) {
            DebugUtils.error(`[Match Team Manager] Error fetching teams: ${e}`);
        }

        return [];
    }

    async findNextValidTeam(matchId: number) {
        try {
            const matchTeams = await this.prisma.matchTeam.findMany({
                where: { matchId },
                include: {
                    match: {
                        include: {
                            gameMode: { include: { draftSequence: true } },
                        },
                    },
                    _count: {
                        select: { players: true },
                    },
                },
            });

            if (matchTeams) {
                return matchTeams.find(
                    (mt) =>
                        mt._count.players <
                        (mt.match.gameMode.draftSequence?.teamSize || 0),
                );
            }

            return null;
        } catch (e) {
            DebugUtils.error(
                `[Match Team Manager] Error finding next valid team: ${e}`,
            );
        }

        return null;
    }

    async updateDraftMessage(teamId: number, messageId: string) {
        try {
            const updatedTeam = await this.prisma.matchTeam.update({
                where: { id: teamId },
                data: { draftMessageId: messageId },
            });

            if (updatedTeam) {
                DebugUtils.debug(
                    `[Match Team Manager] Updated draft channel message for team ${teamId}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Team Manager] Error setting draft channel message: ${e}`,
            );
        }
    }

    async claimCaptain(oldCaptain: MatchPlayer, newCaptain: MatchPlayer) {
        try {
            const updatedOldCaptain = await this.prisma.matchPlayer.update({
                where: { id: oldCaptain.id },
                data: { captain: false },
            });

            const updatedNewCaptain = await this.prisma.matchPlayer.update({
                where: { id: newCaptain.id },
                data: { captain: true },
            });

            if (updatedOldCaptain && updatedNewCaptain) {
                DebugUtils.debug(
                    `[Match Team Manager] Updated team captain for team ${updatedOldCaptain.teamId}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Team Manager] Error updating captain: ${e}`,
            );
        }
    }
}

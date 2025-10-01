import { GameMode, MatchState } from '../../../../.prisma';
import { DebugUtils } from '../../../debug.utils';
import { FullMatch, fullMatchInclude } from '../../data-types.type';
import { Manager } from '../manager';

export class MatchManager extends Manager {
    async finishMatch(id: number, winningTeam: number) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id },
                data: { state: MatchState.FINISHED, winningTeam },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Finished match with match id ${id}`,
                );
            }
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error finishing match: ${e}`);
        }
    }

    async updateHistoryMessage(matchId: number, messageId: string) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id: matchId },
                data: { historyMessageId: messageId },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Updated history message for match ${matchId}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Manager] Error updating history message: ${e}`,
            );
        }
    }

    async setTerrain(matchId: number, gameModeTerrainId: number) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id: matchId },
                data: { gameModeTerrainId },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Set terrain for match ${matchId}`,
                );
            }
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error setting terrain: ${e}`);
        }
    }

    async initDraft(id: number) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id },
                data: { state: MatchState.DRAFT },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Initialized draft for match id ${id}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Manager] Error initializing draft for match: ${e}`,
            );
        }
    }

    async setOngoing(id: number) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id },
                data: { state: MatchState.ONGOING },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Set ongoing for match id ${id}`,
                );
            }
        } catch (e) {
            DebugUtils.error(
                `[Match Manager] Error setting ongoing for match: ${e}`,
            );
        }
    }

    async getFullMatch(id: number): Promise<FullMatch | null> {
        try {
            const matchingMatch = await this.prisma.match.findFirst({
                where: { id },
                include: fullMatchInclude,
            });

            if (matchingMatch) {
                return matchingMatch;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error fetching full match: ${e}`);
        }

        return null;
    }

    async dropMatch(id: number) {
        try {
            const updatedMatch = await this.prisma.match.update({
                where: { id },
                data: { state: MatchState.DROPPED },
            });

            if (updatedMatch) {
                DebugUtils.debug(
                    `[Match Manager] Dropped match with match id ${id}`,
                );
            }
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error dropping match: ${e}`);
        }
    }

    async createMatch(gameMode: GameMode, isLobby: boolean) {
        const lobbyCode = isLobby ? crypto.randomUUID() : null;

        const teamsPayload = new Array(gameMode.teamCount)
            .fill('')
            .map((_, i) => ({ order: i }));

        try {
            const createdMatch = await this.prisma.match.create({
                data: {
                    gameModeId: gameMode.id,
                    state: MatchState.NEW,
                    lobbyCode,
                    teams: { createMany: { data: teamsPayload } },
                },
            });

            if (createdMatch) {
                DebugUtils.debug(
                    `[Match Manager] Created match with match id ${createdMatch.id}`,
                );

                return createdMatch;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error creating match: ${e}`);
        }

        return null;
    }

    async findMatchByLobbyCode(lobbyCode: string): Promise<FullMatch | null> {
        try {
            const matchingMatch = await this.prisma.match.findFirst({
                where: { lobbyCode },
                include: fullMatchInclude,
            });

            if (matchingMatch) {
                return matchingMatch;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Match Manager] Error fetching match: ${e}`);
        }

        return null;
    }

    async isMatchEmpty(id: number) {
        try {
            const matchingMatch = await this.prisma.match.findFirst({
                where: { id },
                include: {
                    teams: {
                        include: { _count: { select: { players: true } } },
                    },
                },
            });

            if (matchingMatch) {
                return matchingMatch.teams.every((t) => t._count.players === 0);
            }

            return false;
        } catch (e) {
            DebugUtils.error(
                `[Match Manager] Error checking empty match: ${e}`,
            );
        }

        return false;
    }
}

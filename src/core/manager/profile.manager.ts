import { Match, Rating } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import { PlayerWithRating, TeamWithPlayers } from '../data-types.type';
import { Manager } from './manager';

export class ProfileManager extends Manager {
    async computeRating(rating: Rating, ratingChange: number) {
        try {
            const updatedRating = await this.prisma.rating.update({
                where: { id: rating.id },
                data: { elo: rating.elo + ratingChange },
            });

            if (updatedRating) {
                DebugUtils.debug(
                    `[Profile Manager] Computed elo for rating id ${updatedRating.id}`,
                );

                return updatedRating;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error computing rating: ${e}`);
        }

        return null;
    }

    async createProfile(
        serverGameId: number,
        discordId: string,
        inGameName: string,
        description?: string,
    ) {
        try {
            const createdProfile = await this.prisma.serverGameProfile.create({
                data: { serverGameId, discordId, inGameName, description },
            });

            if (createdProfile) {
                DebugUtils.debug(
                    `[Profile Manager] Created profile with profile id ${createdProfile.id}`,
                );

                return createdProfile;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error creating profile: ${e}`);
        }

        return null;
    }

    async updateProfile(id: number, inGameName: string, description?: string) {
        try {
            const updatedProfile = await this.prisma.serverGameProfile.update({
                where: { id },
                data: { inGameName, description },
            });

            if (updatedProfile) {
                DebugUtils.debug(
                    `[Profile Manager] Updated profile with profile id ${updatedProfile.id}`,
                );

                return updatedProfile;
            }

            return null;
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error updating profile: ${e}`);
        }

        return null;
    }

    async findProfile(serverGameId: number, discordId: string) {
        try {
            return await this.prisma.serverGameProfile.findFirst({
                where: { serverGameId, discordId },
            });
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error fetching profile: ${e}`);
        }

        return null;
    }

    async getTeamRatings(teams: TeamWithPlayers[], match: Match) {
        const matchPlayers = teams.flatMap((mt) => mt.players);
        const playersWithRatings: PlayerWithRating[] = [];

        for (const player of matchPlayers) {
            const rating = await this.findOrCreateRating(
                player.serverGameProfileId,
                match.gameModeId,
            );

            if (!rating) {
                throw new Error(
                    `Could not find or create player rating for match with match id ${match.id}`,
                );
            }

            playersWithRatings.push({ player, rating });
        }

        return playersWithRatings;
    }

    async findOrCreateRating(serverGameProfileId: number, gameModeId: number) {
        try {
            const matchingRating = await this.prisma.rating.findFirst({
                where: { serverGameProfileId, gameModeId },
            });

            if (!matchingRating) {
                const createdRating = await this.prisma.rating.create({
                    data: { serverGameProfileId, gameModeId },
                });

                if (createdRating) {
                    return createdRating;
                }

                return null;
            }

            return matchingRating;
        } catch (e) {
            DebugUtils.error(`[Profile Manager] Error fetching profile: ${e}`);
        }

        return null;
    }
}

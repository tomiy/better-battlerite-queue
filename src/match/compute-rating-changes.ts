import { Prisma, User } from '../../.prisma';

export function computeRatingChanges(
    teams: Prisma.MatchTeamGetPayload<{
        include: { users: { include: { user: true } } };
    }>[],
    winningTeam: number,
) {
    const n = teams.length;
    const k = 32 / (n - 1);

    const updatedTeams = [...teams];

    for (let i = 0; i < n; i++) {
        const currentElo = getTeamAverageElo(
            teams[i].users.map((tu) => tu.user),
        );

        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const opponentElo = getTeamAverageElo(
                    teams[j].users.map((tu) => tu.user),
                );

                const win = teams[i].order === winningTeam ? 1 : 0;
                const probability =
                    1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));

                updatedTeams[i].users.forEach(
                    (u) =>
                        (u.ratingChange += Math.round(k * (win - probability))),
                );
            }
        }
    }

    return updatedTeams.flatMap((t) => t.users);
}

export function getTeamAverageElo(users: User[]) {
    return users.reduce((s, u) => s + u.elo, 0) / users.length;
}

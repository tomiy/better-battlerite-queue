import { Member } from '../../.prisma';
import { FullMatchTeam } from '../repository/match.repository';

export function computeRatingChanges(
    teams: FullMatchTeam[],
    winningTeam: number,
) {
    const n = teams.length;
    const k = 32 / (n - 1);

    const updatedTeams = [...teams];

    for (let i = 0; i < n; i++) {
        const currentElo = getTeamAverageElo(
            teams[i].players.map((p) => p.member),
        );

        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const opponentElo = getTeamAverageElo(
                    teams[j].players.map((p) => p.member),
                );

                const win = teams[i].order === winningTeam ? 1 : 0;
                const probability =
                    1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));

                updatedTeams[i].players.forEach(
                    (p) =>
                        (p.ratingChange += Math.round(k * (win - probability))),
                );
            }
        }
    }

    return updatedTeams.flatMap((t) => t.players);
}

export function getTeamAverageElo(members: Member[]) {
    return members.reduce((s, u) => s + u.elo, 0) / members.length;
}

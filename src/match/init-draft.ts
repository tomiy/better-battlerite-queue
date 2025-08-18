import { Match, MatchTeam, MatchUser } from '../../.prisma';
import { DebugUtils } from '../debug-utils';

type MatchTeamWithUsers = MatchTeam & { users: MatchUser[] };
type MatchWithTeams = Match & { teams: MatchTeamWithUsers[] };

export async function initDraft(match: MatchWithTeams) {
    DebugUtils.debug(`[Init Draft] initializing draft for match ${match.id}`);
}

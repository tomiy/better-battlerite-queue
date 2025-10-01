import { draftNextPage } from './button/draft/draft-next-page.command';
import { draftPreviousPage } from './button/draft/draft-previous-page.command';
import { reportDrop } from './button/report/report-drop.command';
import { reportNextPage } from './button/report/report-next-page.command';
import { reportPreviousPage } from './button/report/report-previous-page.command';
import { draft } from './chat/admin/draft/draft.command';
import { game } from './chat/admin/game/game.command';
import { ping } from './chat/admin/ping.command';
import { match } from './chat/user/match/match.command';
import { profile } from './chat/user/profile/profile.command';
import { register } from './chat/user/register.command';
import { ButtonCommand, ChatInputCommand, SelectCommand } from './command';
import { characterList } from './select/character-list.command';
import { playerList } from './select/player-list.command';
import { teamList } from './select/team-list.command';
import { queue } from './chat/user/queue/queue.command';
import { joinQueueButton } from './button/queue/queue-join-button.command';
import { leaveQueueButton } from './button/queue/queue-leave-button.command';
import { draftDrop } from './button/draft/draft-drop.command';
import { draftClaimCaptain } from './button/draft/draft-claim-captain.command';

export const chatInputCommands: ChatInputCommand[] = [
    // ADMIN
    ping,
    game,
    draft,
    // USER
    register,
    profile,
    match,
    queue,
];

export const selectCommands: SelectCommand[] = [
    // DRAFT
    playerList,
    characterList,
    // REPORT
    teamList,
];

export const buttonCommands: ButtonCommand[] = [
    //QUEUE
    joinQueueButton,
    leaveQueueButton,
    // DRAFT
    draftPreviousPage,
    draftNextPage,
    draftDrop,
    draftClaimCaptain,
    // REPORT
    reportPreviousPage,
    reportNextPage,
    reportDrop,
];

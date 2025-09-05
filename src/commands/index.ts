import { launch } from './admin/launch.command';
import { matchActions } from './admin/match-actions.command';
import { ping } from './admin/ping.command';
import { queueActions } from './admin/queue-actions.command';
import { Command } from './command';
import { profile } from './member/profile.command';
import { register } from './member/register.command';

export const commands: Command[] = [
    ping,
    launch,
    queueActions,
    matchActions,
    register,
    profile,
];

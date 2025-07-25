import { launch } from './admin/launch.command';
import { ping } from './admin/ping.command';
import { Command } from './command';
import { register } from './user/register.command';

export const commands: Command[] = [ping, register, launch];

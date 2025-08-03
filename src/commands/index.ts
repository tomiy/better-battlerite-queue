import { launch } from './admin/launch.command';
import { ping } from './admin/ping.command';
import { Command } from './command';
import { profile } from './user/profile.command';
import { register } from './user/register.command';

export const commands: Command[] = [ping, launch, register, profile];

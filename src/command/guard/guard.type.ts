import { RepliableInteraction } from 'discord.js';
import { CommandContext } from '../command-context.type';

export type GuardFunction = (
    interaction: RepliableInteraction,
    context: CommandContext,
) => boolean | Promise<boolean>;

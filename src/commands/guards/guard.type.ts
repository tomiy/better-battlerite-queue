import { CommandInteraction } from 'discord.js';
import { Guild as dbGuild } from '../../../.prisma';

export type GuardFunction = (
    interaction: CommandInteraction,
    guild: dbGuild,
) => boolean | Promise<boolean>;

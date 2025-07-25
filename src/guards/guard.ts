import { CommandInteraction } from 'discord.js';
import { Guild } from '../../.prisma';

export type GuardFunction = (interaction: CommandInteraction, guild: Guild) => boolean | Promise<boolean>;

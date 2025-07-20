import { Client } from 'discord.js';
import { PrismaClient } from '../.prisma';
import { commands } from './commands';
import { config } from './config';
import { DebugLevel, DebugUtils } from './debug.utils';
import { deployCommands } from './deploy-commands';

DebugUtils.setDebugLevel(((config.DEBUG_LEVEL || 2) as DebugLevel) || DebugLevel.WARNING);

const prisma = new PrismaClient();

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
});

client.once('ready', () => {
    DebugUtils.debug('[Startup] refreshing commands for joined guilds');
    prisma.guild.findMany().then((guilds) => {
        if (!guilds.length) {
            DebugUtils.debug('[Startup] No guilds in db');
        }
        guilds.forEach((guild) => {
            deployCommands({ guildId: guild.guildId });
        });
    });
});

client.on('guildCreate', (guild) => {
    prisma.guild
        .create({
            data: {
                guildId: guild.id,
            },
        })
        .then((guild) => {
            deployCommands({ guildId: guild.guildId });
            DebugUtils.debug(`[DB Guild] Created guild with guild id ${guild.guildId}`);
        })
        .catch((e) => DebugUtils.error(`[DB Guild] Error creating guild: ${e}`));
});

client.on('guildDelete', (guild) => {
    prisma.guild
        .delete({
            where: {
                guildId: guild.id,
            },
        })
        .then((guild) => DebugUtils.debug(`[DB Guild] Deleted guild with guild id ${guild.guildId}`))
        .catch((e) => DebugUtils.error(`[DB Guild] Error deleting guild: ${e}`));
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
        commands[commandName as keyof typeof commands].execute(interaction);
    }
});

client.login(config.DISCORD_TOKEN);

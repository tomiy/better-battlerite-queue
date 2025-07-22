import { Client } from 'discord.js';
import { PrismaClient } from '../.prisma';
import { commands } from './commands';
import { config } from './config';
import { DebugLevel, DebugUtils } from './debug.utils';
import { deployCommands } from './init/deploy-commands';
import { initSettings } from './init/init-settings';

DebugUtils.setDebugLevel(((config.DEBUG_LEVEL || 2) as DebugLevel) || DebugLevel.WARNING);

const prisma = new PrismaClient();

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
});

client.once('ready', async () => {
    DebugUtils.debug('[Startup] Refreshing commands for joined guilds');
    const guilds = await prisma.guild.findMany();

    if (!guilds.length) {
        DebugUtils.debug('[Startup] No guilds in db');
    }

    for (const guild of guilds) {
        await deployCommands({ guildId: guild.guildId });

        const clientGuild = client.guilds.cache.get(guild.guildId);
        if (client.user?.id && clientGuild) {
            await initSettings(client.user.id, clientGuild);
        }
    }

    DebugUtils.debug('[Startup] Successfully refreshed commands for joined guilds');

    console.log('Bot has started!'); // Unconditional log
});

client.on('guildCreate', async (guild) => {
    try {
        const createdGuild = await prisma.guild.create({ data: { guildId: guild.id } });

        if (createdGuild) {
            DebugUtils.debug(`[DB Guild] Created guild with guild id ${createdGuild.guildId}`);
            deployCommands({ guildId: createdGuild.guildId });
        }
    } catch (e) {
        DebugUtils.error(`[DB Guild] Error creating guild: ${e}`);
    }
});

client.on('guildDelete', async (guild) => {
    try {
        const deletedGuild = await prisma.guild.delete({ where: { guildId: guild.id } });

        if (deletedGuild) {
            DebugUtils.debug(`[DB Guild] Deleted guild with guild id ${deletedGuild.guildId}`);
        }
    } catch (e) {
        DebugUtils.error(`[DB Guild] Error deleting guild: ${e}`);
    }
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

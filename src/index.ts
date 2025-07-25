import { Client, Events, Guild } from 'discord.js';
import { PrismaClient } from '../.prisma';
import { commands } from './commands';
import { executeCommand } from './commands/command';
import { config } from './config';
import { createGuild, deleteGuild } from './db/guild-functions';
import { DebugLevel, DebugUtils } from './debug-utils';
import { initGuild } from './init';

DebugUtils.setDebugLevel((config.DEBUG_LEVEL || DebugLevel.WARNING) as DebugLevel);

const prisma = new PrismaClient();

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'GuildMembers'],
});

client.once(Events.ClientReady, async () => {
    DebugUtils.debug('[Startup] Syncing guilds with db...');
    const dbGuilds = await prisma.guild.findMany();

    const syncedGuilds: Guild[] = [];

    // Delete guilds in db but not in client
    for (const dbGuild of dbGuilds) {
        const clientGuild = client.guilds.cache.get(dbGuild.guildDiscordId);

        if (!clientGuild) {
            await deleteGuild(dbGuild.guildDiscordId);
            return;
        }

        syncedGuilds.push(clientGuild);
    }

    // Create guilds in client but not in db
    for (const [clientGuildId, clientGuild] of client.guilds.cache) {
        const syncedGuild = syncedGuilds.find((syncedGuild) => syncedGuild.id === clientGuildId);
        const dbGuild = dbGuilds.find((dbGuild) => dbGuild.guildDiscordId === clientGuildId);

        if (!syncedGuild && !dbGuild) {
            await createGuild(clientGuildId, () => {
                syncedGuilds.push(clientGuild);
            });
        }
    }

    // init bot on synced guilds
    for (const syncedGuild of syncedGuilds) {
        await initGuild(client, syncedGuild);
    }

    // Purge db queue once for all guilds
    await prisma.queue.deleteMany();

    DebugUtils.debug('[Startup] Successfully synced guilds with db');

    console.log('Bot has started!'); // Unconditional log
});

client.on(Events.GuildCreate, async (guild) => {
    await createGuild(guild.id, async (createdGuild) => {
        const clientGuild = client.guilds.cache.get(createdGuild.guildDiscordId);

        await initGuild(client, clientGuild);
    });
});

client.on(Events.GuildDelete, async (guild) => {
    await deleteGuild(guild.id);
});

client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName } = interaction;
    const command = commands.find((c) => c.data.name === commandName);
    if (command) {
        executeCommand(command, interaction);
    }
});

client.login(config.DISCORD_TOKEN);

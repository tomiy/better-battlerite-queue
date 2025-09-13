import { Events, Guild } from 'discord.js';
import { commands } from './commands';
import { executeCommand } from './commands/command';
import { client, config, prisma } from './config';
import { createGuild, deleteGuild } from './db/guild-functions';
import { DebugLevel, DebugUtils } from './debug-utils';
import { initGuild } from './init';
import { syncGuilds } from './init/sync-guilds';

DebugUtils.setDebugLevel(
    (config.DEBUG_LEVEL || DebugLevel.WARNING) as DebugLevel,
);

client.once(Events.ClientReady, async () => {
    DebugUtils.debug('[Startup] Syncing guilds with db...');
    const dbGuilds = await prisma.guild.findMany();

    const syncedGuilds: Guild[] = await syncGuilds(dbGuilds);

    for (const syncedGuild of syncedGuilds) {
        await initGuild(syncedGuild);
    }

    DebugUtils.debug('[Startup] Successfully synced guilds with db');

    // Purge db queue once for all guilds
    await prisma.queue.deleteMany();

    console.log('Bot has started!'); // Unconditional log
});

client.on(Events.GuildCreate, async (guild) => {
    await createGuild(guild.id, async (createdGuild) => {
        const clientGuild = client.guilds.cache.get(createdGuild.discordId);

        if (clientGuild) {
            await initGuild(clientGuild);
        }
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

import { Client, Guild } from 'discord.js';
import { PrismaClient } from '../.prisma';
import { commands } from './commands';
import { config } from './config';
import { DebugLevel, DebugUtils } from './debug.utils';
import { cleanup } from './init/cleanup';
import { deployCommands } from './init/deploy-commands';
import { setupChannels } from './init/setup-channels';
import { setupRoles } from './init/setup-roles';

DebugUtils.setDebugLevel(((config.DEBUG_LEVEL || 2) as DebugLevel) || DebugLevel.WARNING);

const prisma = new PrismaClient();

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'GuildMembers'],
});

client.once('ready', async () => {
    DebugUtils.debug('[Startup] Refreshing commands for joined guilds');
    const dbGuilds = await prisma.guild.findMany();

    DebugUtils.debug('[Startup] Syncing guilds with db...');
    const syncedGuilds: Guild[] = [];

    // Delete guilds in db but not in client
    for (const dbGuild of dbGuilds) {
        const clientGuild = client.guilds.cache.get(dbGuild.guildDiscordId);

        if (!clientGuild) {
            try {
                const deletedGuild = await prisma.guild.delete({ where: { guildDiscordId: dbGuild.guildDiscordId } });

                if (deletedGuild) {
                    DebugUtils.debug(`[DB Guild] Deleted guild with guild id ${deletedGuild.guildDiscordId}`);
                }
            } catch (e) {
                DebugUtils.error(`[DB Guild] Error deleting guild: ${e}`);
            }

            return;
        }

        syncedGuilds.push(clientGuild);
    }

    // Create guilds in client but not in db
    for (const [clientGuildId, clientGuild] of client.guilds.cache) {
        const syncedGuild = syncedGuilds.find((syncedGuild) => syncedGuild.id === clientGuildId);
        const dbGuild = dbGuilds.find((dbGuild) => dbGuild.guildDiscordId === clientGuildId);

        if (!syncedGuild && !dbGuild) {
            try {
                const createdGuild = await prisma.guild.create({ data: { guildDiscordId: clientGuildId } });

                if (createdGuild) {
                    DebugUtils.debug(`[DB Guild] Created guild with guild id ${createdGuild.guildDiscordId}`);
                    syncedGuilds.push(clientGuild);
                }
            } catch (e) {
                DebugUtils.error(`[DB Guild] Error creating guild: ${e}`);
            }
        }
    }

    // init bot on synced guilds
    for (const syncedGuild of syncedGuilds) {
        if (client.user?.id && syncedGuild) {
            await deployCommands({ guildId: syncedGuild.id });
            await setupChannels(syncedGuild);
            await setupRoles(syncedGuild);
            await cleanup(syncedGuild);
        }
    }

    DebugUtils.debug('[Startup] Successfully synced guilds with db');

    console.log('Bot has started!'); // Unconditional log
});

client.on('guildCreate', async (guild) => {
    try {
        const createdGuild = await prisma.guild.create({ data: { guildDiscordId: guild.id } });

        if (createdGuild) {
            DebugUtils.debug(`[DB Guild] Created guild with guild id ${createdGuild.guildDiscordId}`);
            const clientGuild = client.guilds.cache.get(createdGuild.guildDiscordId);

            if (client.user?.id && clientGuild) {
                await deployCommands({ guildId: createdGuild.guildDiscordId });
                await setupChannels(clientGuild);
                await setupRoles(clientGuild);
                await cleanup(clientGuild);
            }
        }
    } catch (e) {
        DebugUtils.error(`[DB Guild] Error creating guild: ${e}`);
    }
});

client.on('guildDelete', async (guild) => {
    try {
        const deletedGuild = await prisma.guild.delete({ where: { guildDiscordId: guild.id } });

        if (deletedGuild) {
            DebugUtils.debug(`[DB Guild] Deleted guild with guild id ${deletedGuild.guildDiscordId}`);
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

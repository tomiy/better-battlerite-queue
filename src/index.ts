import { Client, Events } from 'discord.js';
import { buttonCommands, chatInputCommands, selectCommands } from './command';
import { executeCommand } from './command/command';
import { env } from './config/env';
import { serverManager } from './config/state';
import { deployCommands } from './core/sync/deploy-commands';
import { syncChannels } from './core/sync/sync-channels';
import { syncRoles } from './core/sync/sync-roles';
import { syncSupportedGames } from './core/sync/sync-supported-games';
import { DebugLevel, DebugUtils } from './debug.utils';

DebugUtils.setDebugLevel((env.DEBUG_LEVEL || DebugLevel.WARNING) as DebugLevel);

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'GuildMembers'],
});

client.once(Events.ClientReady, async () => {
    await syncSupportedGames();

    DebugUtils.debug('[Startup] Syncing guilds with db...');

    const syncedGuilds = await serverManager.syncServers(client);

    for (const syncedGuild of syncedGuilds) {
        await deployCommands(syncedGuild.id);
        await syncChannels(syncedGuild);
        await syncRoles(syncedGuild);
    }

    DebugUtils.debug('[Startup] Successfully synced guilds with db');

    console.log('Bot has started!'); // Unconditional log
});

client.on(Events.GuildCreate, async (guild) => {
    await serverManager.createServer(guild.id);

    await deployCommands(guild.id);
    await syncChannels(guild);
    await syncRoles(guild);
});

client.on(Events.GuildDelete, async (guild) => {
    await serverManager.deleteServer(guild.id);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = chatInputCommands.find(
            (c) => c.data.name === interaction.commandName,
        );
        if (command) {
            await executeCommand(interaction, command, {
                client,
            });
        }
    } else if (interaction.isButton()) {
        const [commandName, ...options] = interaction.customId.split('_');

        const command = buttonCommands.find((c) => c.data.name === commandName);
        if (command) {
            await executeCommand(
                interaction,
                command,
                {
                    client,
                },
                options,
            );
        }
    } else if (interaction.isAnySelectMenu()) {
        const [commandName, ...options] = interaction.customId.split('_');

        const command = selectCommands.find((c) => c.data.name === commandName);
        if (command) {
            await executeCommand(
                interaction,
                command,
                {
                    client,
                },
                options,
            );
        }
    }
});

client.on(Events.GuildMemberRemove, (member) => {
    DebugUtils.debug(member);
    // TODO: queue / match consequences
});

client.login(env.DISCORD_TOKEN).then();

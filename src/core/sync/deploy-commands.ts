import { REST, Routes } from 'discord.js';
import { chatInputCommands } from '../../command';
import { env } from '../../config/env';
import { DebugUtils } from '../../debug.utils';

const commandsData = Object.values(chatInputCommands).map(
    (command) => command.data,
);

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

export async function deployCommands(guildId: string) {
    DebugUtils.debug(
        `[Deploy commands] Started refreshing application (/) commands for guild ${guildId}`,
    );

    try {
        await rest.put(
            Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId),
            {
                body: commandsData,
            },
        );

        DebugUtils.debug(
            `[Deploy commands] Successfully reloaded application (/) commands for guild ${guildId}`,
        );
    } catch (e) {
        DebugUtils.error(`[Deploy commands] Deploy failed: ${e}`);
    }
}

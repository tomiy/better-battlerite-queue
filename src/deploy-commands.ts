import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { config } from './config';
import { DebugUtils } from './debug.utils';

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
    guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
    DebugUtils.debug(`[Deploy commands] Started refreshing application (/) commands for guild ${guildId}`);

    try {
        await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId), {
            body: commandsData,
        });

        DebugUtils.debug(`[Deploy commands] Successfully reloaded application (/) commands for guild ${guildId}`);
    } catch (e) {
        DebugUtils.error(`[Deploy commands] Deploy failed: ${e}`);
    }
}

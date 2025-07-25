import { Client, Guild } from 'discord.js';
import { cleanup } from './cleanup';
import { deployCommands } from './deploy-commands';
import { setupChannels } from './setup-channels';
import { setupRoles } from './setup-roles';

export async function initGuild(client: Client, guild?: Guild) {
    if (client.user?.id && guild) {
        await deployCommands(guild.id);
        await setupChannels(guild);
        await setupRoles(guild);
        await cleanup(guild);
    }
}

import { Client, Guild } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { setupChannels } from './setup-channels';
import { setupRoles } from './setup-roles';
import { syncUsers } from './sync-users';

export async function initGuild(client: Client, guild?: Guild) {
    if (client.user?.id && guild) {
        await deployCommands(guild.id);
        await setupChannels(guild);
        await setupRoles(guild);
        await syncUsers(guild);
    }
}

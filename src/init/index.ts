import { Guild } from 'discord.js';
import { client } from '../config';
import { deployCommands } from './deploy-commands';
import { setupChannels } from './setup-channels';
import { setupRoles } from './setup-roles';
import { syncDefaultData } from './sync-default-data';
import { syncMembers } from './sync-members';

export async function initGuild(guild: Guild) {
    if (client.user?.id && guild) {
        await deployCommands(guild.id);
        await setupChannels(guild);
        await setupRoles(guild);
        await syncMembers(guild);
        await syncDefaultData(guild);
    }
}

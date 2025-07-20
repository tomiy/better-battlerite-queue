import { channelMention, CommandInteraction, GuildMember, MessageFlags, roleMention } from 'discord.js';
import { Guild, PrismaClient } from '../../.prisma';

export async function botModGuard(interaction: CommandInteraction, callback: (guild: Guild) => void) {
    const prisma = new PrismaClient();

    const guild = await prisma.guild.findFirst({
        where: {
            guildId: interaction.guildId!,
        },
    });

    if (!guild?.botCommandsChannel || !guild.queueChannel || !guild.botModRole || !guild.registeredRole || !guild.queueRole) {
        await interaction.reply({ content: 'Bot is not setup. Run /settings and fill out the values', flags: MessageFlags.Ephemeral });
        return;
    }

    if ((interaction.member as GuildMember)?.roles.cache.has(guild?.botModRole) && interaction.channelId === guild?.botCommandsChannel) {
        callback(guild);
    } else {
        await interaction.reply({
            content: `Invalid context, you must use ${channelMention(guild?.botCommandsChannel)} and have the ${roleMention(guild.botModRole)} role`,
            flags: MessageFlags.Ephemeral,
        });
    }
}

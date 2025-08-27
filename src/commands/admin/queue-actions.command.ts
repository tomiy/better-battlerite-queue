import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import { prisma } from '../../config';
import { DebugUtils } from '../../debug-utils';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botModGuard } from '../../guards/bot-mod.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { Command } from '../command';

const data = new SlashCommandBuilder()
    .setName('queue')
    .addSubcommand((sub) =>
        sub.setName('reset').setDescription('Resets the queue'),
    )
    .addSubcommand((sub) =>
        sub.setName('fill').setDescription('Fills the queue'),
    )
    .setDescription('Queue admin functions') as SlashCommandBuilder;

async function execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) {
        DebugUtils.error('[Queue Reset] Invalid context, should never happen');
        return;
    }

    const guild = interaction.guild;

    if (!guild) {
        DebugUtils.error('[Queue Reset] No guild, should never happen');
        return;
    }

    const dbGuild = await prisma.guild.findFirstOrThrow({
        where: { guildDiscordId: guild.id },
    });

    const queueRole = dbGuild.queueRole;

    if (queueRole === null) {
        throw new Error('[Queue Reset] No queue role found, check bot logs');
    }

    if (interaction.options.getSubcommand() === 'reset') {
        const members = await guild.members.fetch();

        const queuedMembers = members.filter((m) =>
            m.roles.cache.has(queueRole),
        );

        if (queuedMembers.size) {
            DebugUtils.debug('[Queue Reset] Purging old queued users...');

            queuedMembers.forEach(async (m) => await m.roles.remove(queueRole));

            DebugUtils.debug('[Queue Reset] Purged old queued users');
        }

        await prisma.queue.deleteMany({
            where: { user: { guild: { guildDiscordId: guild.id } } },
        });

        await interaction.reply({
            content: 'Queue reset!',
            flags: MessageFlags.Ephemeral,
        });
    }

    if (interaction.options.getSubcommand() === 'fill') {
        const allUsers = await prisma.user.findMany();

        await prisma.queue.createMany({
            data: allUsers.map((u) => ({ userId: u.id })),
        });

        await interaction.reply({
            content: 'Queue filled!',
            flags: MessageFlags.Ephemeral,
        });
    }
}

export const queueReset: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel, botModGuard],
};

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, channelMention, CommandInteraction, ComponentType, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import { Guild as dbGuild, PrismaClient } from '../../../.prisma';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botModGuard } from '../../guards/bot-mod.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { Command } from '../command';

const data = new SlashCommandBuilder().setName('launch').setDescription('Starts the queue');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const prisma = new PrismaClient();

    const botCommandsChannelId = dbGuild.botCommandsChannel;
    const queueChannelId = dbGuild.queueChannel;
    const queueRoleId = dbGuild.queueRole;

    if (botCommandsChannelId === null) {
        throw new Error('[Launch command] No bot commands channel found, check bot logs');
    }

    if (queueChannelId === null) {
        throw new Error('[Launch command] No queue channel found, check bot logs');
    }

    if (queueRoleId === null) {
        throw new Error('[Launch command] No queue role found, check bot logs');
    }

    const queueChannel = interaction.client.channels.cache.get(queueChannelId);

    if (!queueChannelId) {
        interaction.reply({ content: 'Queue channel does not exist, check settings', flags: MessageFlags.Ephemeral });
        return;
    }

    if (queueChannel instanceof TextChannel) {
        await queueChannel.bulkDelete(100);

        const queueButton = new ButtonBuilder().setCustomId('queueButton').setLabel('Queue').setStyle(ButtonStyle.Primary);
        const leaveButton = new ButtonBuilder().setCustomId('leaveButton').setLabel('Leave').setStyle(ButtonStyle.Danger);
        const queueButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(queueButton).addComponents(leaveButton);

        const queueMessage = await queueChannel.send({ components: [queueButtonsRow] });

        const buttonCollector = queueMessage.createMessageComponentCollector({ componentType: ComponentType.Button });

        buttonCollector?.on('collect', async (i) => {
            const user = await prisma.user.findFirst({ where: { userDiscordId: i.user.id, guildId: dbGuild.id } });

            if (!user) {
                await i.reply({ content: `You are not registered! Use /register in ${channelMention(botCommandsChannelId)}`, flags: MessageFlags.Ephemeral });
                return;
            }

            const queuedUser = await prisma.queue.findFirst({ where: { userId: user.id } });

            switch (i.customId) {
                case 'queueButton':
                    if (queuedUser) {
                        await i.reply({ content: 'You are already in queue!', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    await prisma.queue.create({ data: { userId: user.id } });
                    await i.member.roles.add(queueRoleId);
                    await i.reply({ content: 'Queue joined!', flags: MessageFlags.Ephemeral });

                    // TODO: check if match can be created

                    break;
                case 'leaveButton':
                    if (!queuedUser) {
                        await i.reply({ content: 'You are not in queue!', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    await prisma.queue.delete({ where: { userId: user.id } });
                    await i.member.roles.remove(queueRoleId);
                    await i.reply({ content: 'Queue left!', flags: MessageFlags.Ephemeral });
                    break;
            }
        });

        interaction.reply({ content: 'Queue has been launched!', flags: MessageFlags.Ephemeral });
    } else {
        interaction.reply({ content: 'Cannot send messages to queue channel, check bot permissions!', flags: MessageFlags.Ephemeral });
    }
}

export const launch: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel, botModGuard],
};

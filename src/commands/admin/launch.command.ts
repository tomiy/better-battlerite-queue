import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    channelMention,
    CommandInteraction,
    ComponentType,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { Guild as dbGuild, Region } from '../../../.prisma';
import { prisma } from '../../config';
import { joinQueue, leaveQueue, toggleRegion } from '../../db/queue-functions';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botModGuard } from '../../guards/bot-mod.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { tempReply } from '../../interaction-utils';
import { tryMatchCreation } from '../../match/try-match-creation';
import { Command } from '../command';

const data = new SlashCommandBuilder()
    .setName('launch')
    .setDescription('Starts the queue');

async function execute(interaction: CommandInteraction, dbGuild: dbGuild) {
    const botCommandsChannelId = dbGuild.botCommandsChannel;
    const queueChannelId = dbGuild.queueChannel;
    const queueRoleId = dbGuild.queueRole;

    if (botCommandsChannelId === null) {
        throw new Error(
            '[Launch command] No bot commands channel found, check bot logs',
        );
    }

    if (queueChannelId === null) {
        throw new Error(
            '[Launch command] No queue channel found, check bot logs',
        );
    }

    if (queueRoleId === null) {
        throw new Error('[Launch command] No queue role found, check bot logs');
    }

    const queueChannel = interaction.client.channels.cache.get(queueChannelId);

    if (!queueChannelId) {
        tempReply(interaction, 'Queue channel does not exist, check settings');
        return;
    }

    if (queueChannel instanceof TextChannel) {
        await queueChannel.bulkDelete(100);

        const queueButton = new ButtonBuilder()
            .setCustomId('queueButton')
            .setLabel('Queue')
            .setStyle(ButtonStyle.Primary);
        const leaveButton = new ButtonBuilder()
            .setCustomId('leaveButton')
            .setLabel('Leave')
            .setStyle(ButtonStyle.Danger);
        const queueButtonsRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(queueButton)
            .addComponents(leaveButton);

        const toggleEUButton = new ButtonBuilder()
            .setCustomId('toggleEUButton')
            .setLabel(Region.EU)
            .setStyle(ButtonStyle.Secondary);
        const toggleNAButton = new ButtonBuilder()
            .setCustomId('toggleNAButton')
            .setLabel(Region.NA)
            .setStyle(ButtonStyle.Secondary);
        const toggleSAButton = new ButtonBuilder()
            .setCustomId('toggleSAButton')
            .setLabel(Region.SA)
            .setStyle(ButtonStyle.Secondary);
        const regionButtonsRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(toggleEUButton)
            .addComponents(toggleNAButton)
            .addComponents(toggleSAButton);

        const queueMessage = await queueChannel.send({
            components: [queueButtonsRow, regionButtonsRow],
        });

        const buttonCollector = queueMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        buttonCollector?.on('collect', async (i) => {
            const user = await prisma.user.findFirst({
                where: { userDiscordId: i.user.id, guildId: dbGuild.id },
            });

            if (!user) {
                tempReply(
                    i,
                    `You are not registered! Use /register in ${channelMention(botCommandsChannelId)}`,
                );
                return;
            }

            const queuedUser = await prisma.queue.findFirst({
                where: { userId: user.id },
            });

            switch (i.customId) {
                case 'queueButton':
                    if (await joinQueue(queuedUser, user, i, queueRoleId)) {
                        await tryMatchCreation(dbGuild, i.member.guild);
                    }
                    break;
                case 'leaveButton':
                    await leaveQueue(queuedUser, user, i, queueRoleId);
                    break;
                case 'toggleEUButton':
                    if (await toggleRegion(user, Region.EU, i, queueRoleId)) {
                        tryMatchCreation(dbGuild, i.member.guild);
                    }
                    break;
                case 'toggleNAButton':
                    if (await toggleRegion(user, Region.NA, i, queueRoleId)) {
                        tryMatchCreation(dbGuild, i.member.guild);
                    }
                    break;
                case 'toggleSAButton':
                    if (await toggleRegion(user, Region.SA, i, queueRoleId)) {
                        tryMatchCreation(dbGuild, i.member.guild);
                    }
                    break;
            }
        });

        tempReply(interaction, 'Queue has been launched!');
    } else {
        tempReply(
            interaction,
            'Cannot send messages to queue channel, check bot permissions!',
        );
    }
}

export const launch: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel, botModGuard],
};

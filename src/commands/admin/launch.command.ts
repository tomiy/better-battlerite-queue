import { ActionRowBuilder, ButtonBuilder, ButtonStyle, channelMention, CommandInteraction, ComponentType, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import { Guild, PrismaClient } from '../../../.prisma';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';
import { botModGuard } from '../../guards/bot-mod.guard';
import { botSetup } from '../../guards/bot-setup.guard';
import { Command } from '../command';

const data = new SlashCommandBuilder().setName('launch').setDescription('Starts the queue');

async function execute(interaction: CommandInteraction, dbGuild: Guild) {
    const prisma = new PrismaClient();
    const queueChannel = interaction.client.channels.cache.get(dbGuild.queueChannel!);

    if (!queueChannel) {
        interaction.reply({ content: 'Queue channel does not exist, check settings', flags: MessageFlags.Ephemeral });
        return;
    }

    if (queueChannel instanceof TextChannel) {
        await queueChannel.bulkDelete(100);

        const queueButton = new ButtonBuilder().setCustomId('queueButton').setLabel('Queue').setStyle(ButtonStyle.Primary);
        const leaveButton = new ButtonBuilder().setCustomId('leaveButton').setLabel('Leave').setStyle(ButtonStyle.Danger);
        const queueButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(queueButton).addComponents(leaveButton);

        const queueMessage = await queueChannel.send({ content: 'Good luck!', components: [queueButtonsRow] });

        const buttonCollector = queueMessage.createMessageComponentCollector({ componentType: ComponentType.Button });

        buttonCollector?.on('collect', async (i) => {
            const user = await prisma.user.findFirst({ where: { userDiscordId: i.user.id, guildId: dbGuild.id } });
            switch (i.customId) {
                case 'queueButton':
                    if (!user) {
                        await i.reply({ content: `You are not registered! Use /register in ${channelMention(dbGuild.botCommandsChannel!)}`, flags: MessageFlags.Ephemeral });
                        return;
                    }

                    // TODO: push user id to queue table
                    // TODO: check if match can be created
                    await i.member.roles.add(dbGuild.queueRole!);
                    await i.reply({ content: 'Queue joined!', flags: MessageFlags.Ephemeral });
                    break;
                case 'leaveButton':
                    // TODO: remove user id from queue table
                    await i.member.roles.remove(dbGuild.queueRole!);
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

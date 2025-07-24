import { ActionRowBuilder, ButtonBuilder, ButtonStyle, channelMention, CommandInteraction, ComponentType, MessageFlags, SlashCommandBuilder, TextChannel } from 'discord.js';
import { PrismaClient } from '../../../.prisma';
import { botModGuard } from '../../guards/bot-mod.guard';

export const data = new SlashCommandBuilder().setName('launch').setDescription('Starts the queue');

export async function execute(interaction: CommandInteraction) {
    botModGuard(interaction, async (guild) => {
        const prisma = new PrismaClient();
        const queueChannel = interaction.client.channels.cache.get(guild.queueChannel!);

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
                const user = await prisma.user.findFirst({ where: { userDiscordId: i.user.id, guildId: guild.id } });
                switch (i.customId) {
                    case 'queueButton':
                        if (!user) {
                            await i.reply({ content: `You are not registered! Use /register in ${channelMention(guild.botCommandsChannel!)}`, flags: MessageFlags.Ephemeral });
                            return;
                        }

                        // TODO: push user id to queue table
                        // TODO: check if match can be created
                        await i.member.roles.add(guild.queueRole!);
                        await i.reply({ content: 'Queue joined!', flags: MessageFlags.Ephemeral });
                        break;
                    case 'leaveButton':
                        // TODO: remove user id from queue table
                        await i.member.roles.remove(guild.queueRole!);
                        await i.reply({ content: 'Queue left!', flags: MessageFlags.Ephemeral });
                        break;
                }
            });

            interaction.reply({ content: 'Queue has been launched!', flags: MessageFlags.Ephemeral });
        } else {
            interaction.reply({ content: 'Cannot send messages to queue channel, check bot permissions!', flags: MessageFlags.Ephemeral });
        }
    });
}

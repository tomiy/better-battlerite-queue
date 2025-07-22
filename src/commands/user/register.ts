import { ActionRowBuilder, CommandInteraction, GuildMember, MessageFlags, ModalActionRowComponentBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { PrismaClient } from '../../../.prisma';
import { DebugUtils } from '../../debug.utils';
import { botCommandsChannel } from '../../guards/bot-command-channel.guard';

export const data = new SlashCommandBuilder().setName('register').setDescription('Register');

export async function execute(interaction: CommandInteraction) {
    botCommandsChannel(interaction, async (guild) => {
        const prisma = new PrismaClient();

        const user = await prisma.user.findFirst({ where: { userId: interaction.user.id, guildId: guild.guildId } });

        if (user) {
            await interaction.reply({ content: 'You are already registered!', flags: MessageFlags.Ephemeral });
            return;
        }

        const registerModal = new ModalBuilder().setCustomId('registerModal').setTitle('Registration form').addComponents();

        const inGameNameInput = new TextInputBuilder().setCustomId('inGameNameInput').setLabel('Battlerite username').setStyle(TextInputStyle.Short).setRequired(true);
        const inGameNameRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(inGameNameInput);

        registerModal.addComponents(inGameNameRow);

        await interaction.showModal(registerModal);

        try {
            const submitted = await interaction.awaitModalSubmit({ time: 60000, filter: (i) => i.user.id === interaction.user.id });

            if (submitted) {
                const inGameName = submitted.fields.getTextInputValue('inGameNameInput');

                const user = await prisma.user.create({
                    data: {
                        userId: interaction.user.id,
                        guildId: guild.guildId,
                        inGameName: inGameName,
                    },
                });

                if (user) {
                    await (interaction.member as GuildMember)?.roles.add(guild.registeredRole!);
                    await submitted.reply({ content: `You are now registered!`, flags: MessageFlags.Ephemeral });
                }
            }
        } catch (e) {
            DebugUtils.error(`[Register] Timeout: ${e}`);
        }
    });
}

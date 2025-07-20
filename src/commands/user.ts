import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { PrismaClient } from '../../.prisma';
import { DebugUtils } from '../debug.utils';

export const data = new SlashCommandBuilder()
    .setName('user')
    .setDescription('User management')
    .addStringOption((option) =>
        option.setName('action').setDescription('User action to perform').setRequired(true).addChoices({ name: 'Create a user', value: 'create' }, { name: 'Delete a user', value: 'delete' }),
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const prisma = new PrismaClient();

    if (interaction.options.getString('action') == 'create') {
        await interaction.reply({ content: 'Creating user...', withResponse: true });

        const user = await prisma.user.findFirst({
            where: {
                userId: interaction.user.id,
            },
        });

        if (user) {
            interaction.editReply(`User ${user.userId} already exists in database`);
            return;
        }

        prisma.user
            .create({
                data: {
                    userId: interaction.user.id,
                },
            })
            .then((user) => {
                interaction.editReply(`Created user with user id ${user.userId}`);
            })
            .catch((e) => {
                DebugUtils.error(`[DB User] Error creating user: ${e}`);
                interaction.editReply('Could not create user');
            });
    }

    if (interaction.options.getString('action') == 'delete') {
        await interaction.reply({ content: 'Deleting user...', withResponse: true });

        const user = await prisma.user.findFirst({
            where: {
                userId: interaction.user.id,
            },
        });

        if (!user) {
            interaction.editReply(`User ${interaction.user.id} does not exist in database`);
            return;
        }

        prisma.user
            .delete({
                where: {
                    userId: interaction.user.id,
                },
            })
            .then((user) => {
                interaction.editReply(`Deleted user with user id ${user.userId}`);
            })
            .catch((e) => {
                DebugUtils.error(`[DB User] Error deleting user: ${e}`);
                interaction.editReply('Could not delete user');
            });
    }
}

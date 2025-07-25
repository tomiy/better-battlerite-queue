import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Guild, PrismaClient } from '../../.prisma';
import { GuardFunction } from '../guards/guard';

export type Command = {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction, dbGuild: Guild) => void | Promise<void>;
    guards: GuardFunction[];
};

export async function executeCommand(command: Command, interaction: CommandInteraction) {
    const prisma = new PrismaClient();

    const dbGuild = await prisma.guild.findFirstOrThrow({ where: { guildDiscordId: interaction.guildId! } });

    for (const guard of command.guards) {
        const guardResult = await guard(interaction, dbGuild);
        if (!guardResult) {
            return;
        }
    }

    await command.execute(interaction, dbGuild);
}

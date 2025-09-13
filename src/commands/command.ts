import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { GuardFunction } from './guards/guard.type';

export type Command = {
    data: SlashCommandBuilder;
    execute: (
        interaction: CommandInteraction,
        dbGuild: dbGuild,
    ) => void | Promise<void>;
    guards: GuardFunction[];
};

export async function executeCommand(
    command: Command,
    interaction: CommandInteraction,
) {
    const dbGuild = await prisma.guild.findFirstOrThrow({
        where: { discordId: interaction.guildId || '' },
    });

    for (const guard of command.guards) {
        const guardResult = await guard(interaction, dbGuild);
        if (!guardResult) {
            return;
        }
    }

    await command.execute(interaction, dbGuild);
}

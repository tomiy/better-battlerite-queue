import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    RepliableInteraction,
    SharedSlashCommand,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { serverManager } from '../config/state';
import { CommandContext } from './command-context.type';
import { GuardFunction } from './guard/guard.type';

export type Command<T extends RepliableInteraction> = {
    data: { name: string };
    populateContext?: (
        interaction: T,
        context: CommandContext,
        options: string[],
    ) => void;
    execute: (interaction: T, context: CommandContext) => void | Promise<void>;
    guards: GuardFunction[];
};

export type ChatInputCommand = Command<ChatInputCommandInteraction> & {
    data: SharedSlashCommand;
};
export type ChatInputSubcommandGroup = Command<ChatInputCommandInteraction> & {
    data: SlashCommandSubcommandGroupBuilder;
};
export type ChatInputSubcommand = Command<ChatInputCommandInteraction> & {
    data: SlashCommandSubcommandBuilder;
};
export type SelectCommand = Command<AnySelectMenuInteraction>;
export type ButtonCommand = Command<ButtonInteraction>;

export async function executeCommand<T extends RepliableInteraction>(
    interaction: T,
    command: Command<T>,
    context: CommandContext,
    options: string[] = [],
) {
    if (!interaction.guild) {
        return;
    }

    if (!context.guild) {
        context.guild = interaction.guild;
    }

    if (!context.server) {
        const server = await serverManager.findServerByGuildId(
            interaction.guild.id,
        );

        if (!server) {
            throw new Error(
                `No server found for guild id ${interaction.guild.id}`,
            );
        }
        context.server = server;
    }

    if (command.populateContext) {
        command.populateContext(interaction, context, options);
    }

    for (const guard of command.guards) {
        const guardResult = await guard(interaction, context);
        if (!guardResult) {
            return;
        }
    }

    await command.execute(interaction, context);
}

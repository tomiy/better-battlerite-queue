import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { serverManager } from '../../../../config/state';
import { safeReply, tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { formatListCodeBlock } from '../../../../discord/format.utils';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_LIST)
    .setDescription('List games');

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server']);

    const games = await serverManager.findServerGames(context.server.id);

    if (!games.length) {
        await tempReply(interaction, 'No games found for this server!');
        return;
    }

    const gameNames = games.map((g) => g.game.name);

    await safeReply(
        interaction,
        `Available games on this server: ${formatListCodeBlock(gameNames)}`,
    );
}

export const listGames: ChatInputSubcommand = {
    data: data,
    execute: execute,
    guards: [],
};

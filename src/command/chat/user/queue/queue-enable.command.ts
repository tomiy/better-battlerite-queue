import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandName } from '../../../command-name.type';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { ChatInputSubcommand } from '../../../command';
import { matchingServerGame } from '../../../guard/game/matching-server-game.guard';
import { queueManager } from '../../../../config/state';
import { tempReply } from '../../../../discord/interaction.utils';
import { matchingMode } from '../../../guard/game/matching-mode.guard';
import { botMod } from '../../../guard/bot/bot-mod.guard';
import { updateQueueUI } from '../../../../discord/ui/queue/update-queue-ui';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.QUEUE_ENABLE)
    .setDescription('Enable queue')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('mode_name')
            .setDescription('Mode name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['guild', 'server', 'serverGame', 'gameMode']);

    const enabledGameMode = await queueManager.setQueueAvailability(
        context.gameMode.id,
        true,
    );

    if (enabledGameMode) {
        await tempReply(
            interaction,
            `Queue enabled for mode ${context.gameMode.name} and game ${context.serverGame.game.name}!`,
        );

        await updateQueueUI(
            context.server,
            context.guild,
            context.serverGame.game,
            enabledGameMode,
        );
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const enableQueue: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [botMod, matchingServerGame, matchingMode],
};

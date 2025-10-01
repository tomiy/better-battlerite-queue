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
    .setName(CommandName.QUEUE_DISABLE)
    .setDescription('Disable queue')
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

    const disabledGameMode = await queueManager.setQueueAvailability(
        context.gameMode.id,
        false,
    );

    if (disabledGameMode) {
        await tempReply(
            interaction,
            `Queue disabled for mode ${context.gameMode.name} and game ${context.serverGame.game.name}!`,
        );

        await updateQueueUI(
            context.server,
            context.guild,
            context.serverGame.game,
            disabledGameMode,
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

export const disableQueue: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [botMod, matchingServerGame, matchingMode],
};

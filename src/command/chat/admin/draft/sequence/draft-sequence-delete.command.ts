import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { draftSequenceManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.DRAFT_SEQUENCE_DELETE)
    .setDescription('Delete draft sequences')
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

    ensureContext(context, ['server', 'serverGame', 'gameMode']);

    const deletedSequencesPayload =
        await draftSequenceManager.deleteDraftSequences(context.gameMode.id);

    if (deletedSequencesPayload && deletedSequencesPayload.count) {
        await tempReply(
            interaction,
            `Draft sequences deleted for mode ${context.gameMode.name} for game ${context.serverGame.game.name}!`,
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

export const deleteSequences: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode],
};

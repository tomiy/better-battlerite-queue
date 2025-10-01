import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { draftSequenceManager } from '../../../../../config/state';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { invertedDraftStepMap } from '../../../../../core/manager/draft-sequence.manager';
import { safeReply, tempReply } from '../../../../../discord/interaction.utils';
import { formatListCodeBlock } from '../../../../../discord/format.utils';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.DRAFT_SEQUENCE_LIST)
    .setDescription('List draft sequences')
    .addStringOption((option) =>
        option
            .setName('game_name')
            .setDescription('Game name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame']);

    const draftSequences = await draftSequenceManager.findDraftSequences(
        context.serverGame.id,
    );

    if (!draftSequences.length) {
        await tempReply(interaction, 'No draft sequences for this game!');
        return;
    }

    const sequenceList = draftSequences.map(
        (ds) =>
            ds.steps
                .sort((a, b) => a.order - b.order)
                .map((s) => invertedDraftStepMap.get(s.type))
                .join(', ') +
            ` - mode: ${ds.gameMode.name} (${ds.gameMode.teamCount} teams of ${ds.teamSize} player(s))`,
    );

    await safeReply(
        interaction,
        `Game modes for ${context.serverGame.game.name}: ${formatListCodeBlock(sequenceList)}`,
    );
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
}

export const listSequences: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame],
};

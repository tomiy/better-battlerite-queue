import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { draftSequenceManager } from '../../../../../config/state';
import { safeReply, tempReply } from '../../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { DraftSequenceType } from '../../../../../../.prisma';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';

const draftSequenceTypeChoices = Object.values(DraftSequenceType).map((v) => ({
    name: v,
    value: v,
}));

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.DRAFT_SEQUENCE_ADD)
    .setDescription('Add draft sequence')
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
    )
    .addStringOption((option) =>
        option
            .setName('sequence_type')
            .setDescription('Sequence type')
            .setChoices(draftSequenceTypeChoices)
            .setRequired(true),
    )
    .addIntegerOption((option) =>
        option
            .setName('team_size')
            .setDescription('Team size')
            .setMinValue(1)
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('sequence')
            .setDescription('Sequence (PP, TB, TP, GB, GP, B, P)')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['server', 'serverGame', 'gameMode']);

    const sequenceType = interaction.options.getString(
        'sequence_type',
        true,
    ) as DraftSequenceType;
    const teamSize = interaction.options.getInteger('team_size', true);
    const sequence = interaction.options.getString('sequence', true);

    if (context.gameMode.draftSequence) {
        await tempReply(
            interaction,
            `A draft sequence already exists for ${context.gameMode.name} for game ${context.serverGame.game.name}`,
        );
        return;
    }

    if (!Object.values(DraftSequenceType).includes(sequenceType)) {
        await tempReply(interaction, `Invalid sequence type ${sequenceType}`);
        return;
    }

    if (teamSize < 1) {
        await tempReply(interaction, 'Invalid team size, should be 1 or more');
        return;
    }

    try {
        const steps = draftSequenceManager.parseDraftStepTokens(
            context.gameMode,
            sequenceType,
            teamSize,
            sequence.split(' '),
        );

        const createdDraftSequence =
            await draftSequenceManager.createDraftSequence(
                context.gameMode.id,
                sequenceType,
                teamSize,
                steps,
            );

        if (createdDraftSequence) {
            await tempReply(
                interaction,
                `Draft sequence ${sequence} has been created for ${context.gameMode.name} for game ${context.serverGame.game.name}!`,
            );
        }
    } catch (e) {
        await safeReply(interaction, `Parsing sequence: ${e}`);
        return;
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
}

export const addSequence: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode],
};

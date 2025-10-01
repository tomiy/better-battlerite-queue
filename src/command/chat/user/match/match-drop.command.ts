import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import { matchManager } from '../../../../config/state';
import { cleanupMatchVisuals } from '../../../../discord/cleanup-match-embeds';
import { tempReply } from '../../../../discord/interaction.utils';
import { ChatInputSubcommand } from '../../../command';
import { CommandContext, ensureContext } from '../../../command-context.type';
import { botMod } from '../../../guard/bot/bot-mod.guard';
import { matchingMatch } from '../../../guard/match/matching-match.guard';
import { CommandName } from '../../../command-name.type';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.MATCH_DROP)
    .setDescription('Drop match')
    .addIntegerOption((option) =>
        option.setName('match_id').setDescription('Match id').setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['guild', 'server', 'matchId']);

    await matchManager.dropMatch(context.matchId);

    await tempReply(interaction, 'Match dropped!');

    await cleanupMatchVisuals(context.matchId, context.server, context.guild);
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.matchId = interaction.options.getInteger('match_id', true);
}

export const dropMatch: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [botMod, matchingMatch],
};

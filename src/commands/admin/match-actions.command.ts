import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { prisma } from '../../config';
import { DebugUtils } from '../../debug-utils';
import { tempReply } from '../../interaction-utils';
import { buildMatchEmbed } from '../../match/build-match-embed';
import { MatchRepository } from '../../repository/match.repository';
import { Command } from '../command';
import { botCommandsChannel } from '../guards/bot-command-channel.guard';
import { botModGuard } from '../guards/bot-mod.guard';
import { botSetup } from '../guards/bot-setup.guard';

const data = new SlashCommandBuilder()
    .setName('match')
    .addSubcommand((sub) =>
        sub
            .setName('drop')
            .setDescription('Drops a match')
            .addIntegerOption((o) =>
                o.setName('id').setDescription('Match id').setRequired(true),
            ),
    )
    .setDescription('Match admin functions') as SlashCommandBuilder;

async function execute(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.isChatInputCommand()) {
        DebugUtils.error(
            '[Match Actions] Invalid context, should never happen',
        );
        return;
    }

    const guild = interaction.guild;

    if (!guild) {
        DebugUtils.error('[Match Actions] No guild, should never happen');
        return;
    }

    const dbGuild = await prisma.guild.findFirstOrThrow({
        where: { discordId: guild.id },
    });

    if (interaction.options.getSubcommand() === 'drop') {
        const matchId = interaction.options.getInteger('id');

        if (!matchId) {
            await tempReply(interaction, 'No match id provided!');
            return;
        }

        const match = await MatchRepository.get(matchId);

        if (!match) {
            await tempReply(interaction, `No match found for id ${matchId}`);
            return;
        }

        await match.update({ state: 'DROPPED' });

        const updatedEmbed = buildMatchEmbed(match);

        const matchHistoryChannel = guild.channels.resolve(
            dbGuild.matchHistoryChannel || '',
        );

        if (matchHistoryChannel instanceof TextChannel) {
            if (!match.data.historyMessage) {
                const historyMessage = await matchHistoryChannel.send({
                    embeds: [updatedEmbed],
                    components: [],
                });
                await match.update({
                    historyMessage: historyMessage.id,
                });
            } else {
                const historyMessage = await matchHistoryChannel.messages.fetch(
                    match.data.historyMessage,
                );

                if (historyMessage) {
                    historyMessage.edit({
                        embeds: [updatedEmbed],
                        components: [],
                    });
                }
            }
        }

        for (const team of match.teams) {
            for (const player of team.players) {
                await guild.members.cache
                    .get(player.member.discordId)
                    ?.roles.remove(dbGuild.matchRole || '');
            }

            await guild.channels.delete(team.teamChannel || '');
        }

        await tempReply(interaction, 'Match dropped!');
    }
}

export const matchActions: Command = {
    data: data,
    execute: execute,
    guards: [botSetup, botCommandsChannel, botModGuard],
};

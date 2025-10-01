import { MessageFlags, RepliableInteraction } from 'discord.js';
import { CommandName } from '../command-name.type';
import { CommandContext, ensureContext } from '../command-context.type';
import { tempReply } from '../../discord/interaction.utils';
import { matchPlayerManager, queueManager } from '../../config/state';
import { Command } from '../command';
import { updateQueueUI } from '../../discord/ui/queue/update-queue-ui';

async function execute(
    interaction: RepliableInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, ['guild', 'server', 'member']);

    const isInAnyMatch = await matchPlayerManager.isInAnyMatch(
        context.member.id,
    );

    if (isInAnyMatch === null) {
        await tempReply(interaction, `Error checking for match availability`);
        return;
    }

    if (isInAnyMatch) {
        await tempReply(interaction, 'You are in a match!');
        return;
    }

    const existingQueueEntry = await queueManager.isQueuedInAnyMode(
        context.member.id,
    );

    if (!existingQueueEntry) {
        await tempReply(interaction, 'You are not in queue!');
        return;
    }

    const deletedQueueEntries = await queueManager.deleteQueueEntries(
        context.server,
        context.member,
    );

    if (deletedQueueEntries) {
        await tempReply(interaction, `Queue left!`);

        if (context.serverGame && context.gameMode) {
            await updateQueueUI(
                context.server,
                context.guild,
                context.serverGame.game,
                context.gameMode,
            );
            return;
        }

        const uniqueModes = new Map();
        for (const deletedEntry of deletedQueueEntries) {
            if (!uniqueModes.has(deletedEntry.gameModeId)) {
                uniqueModes.set(deletedEntry.gameModeId, deletedEntry);
                await updateQueueUI(
                    context.server,
                    context.guild,
                    deletedEntry.gameMode.serverGame.game,
                    deletedEntry.gameMode,
                );
            }
        }
    }
}

export const leaveQueueShared: Command<RepliableInteraction> = {
    data: { name: CommandName.QUEUE_LEAVE },
    execute: execute,
    guards: [],
};

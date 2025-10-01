import { MessageFlags, RepliableInteraction } from 'discord.js';
import { CommandName } from '../command-name.type';
import { CommandContext, ensureContext } from '../command-context.type';
import { tempReply } from '../../discord/interaction.utils';
import { matchPlayerManager, queueManager } from '../../config/state';
import { Command } from '../command';
import { attemptQueueMatchCreation } from '../../core/shared/attempt-queue-match-creation';
import { updateQueueUI } from '../../discord/ui/queue/update-queue-ui';

async function execute(
    interaction: RepliableInteraction,
    context: CommandContext,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    ensureContext(context, [
        'guild',
        'server',
        'serverGame',
        'gameMode',
        'member',
        'profile',
    ]);

    if (!context.gameMode.queueable) {
        await tempReply(interaction, 'This game mode cannot be queued!');
        return;
    }

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

    const hasRegions = await queueManager.hasRegions(context.profile.id);

    if (hasRegions === null) {
        await tempReply(interaction, 'Error determining region availability');
        return;
    }

    if (!hasRegions) {
        await tempReply(
            interaction,
            'You need to enable at least one region to queue!',
        );
        return;
    }

    const existingQueueEntry = await queueManager.isQueuedInAnyMode(
        context.member.id,
    );

    if (existingQueueEntry) {
        await tempReply(
            interaction,
            `You are already queued for ${existingQueueEntry.gameMode.name}!`,
        );
        return;
    }

    const newQueueEntry = await queueManager.createQueueEntry(
        context.gameMode.id,
        context.profile.id,
        context.server,
        context.member,
    );

    if (newQueueEntry) {
        await tempReply(
            interaction,
            `Queue joined for ${context.gameMode.name}!`,
        );

        await attemptQueueMatchCreation(interaction, context);

        await updateQueueUI(
            context.server,
            context.guild,
            context.serverGame.game,
            context.gameMode,
        );
        return;
    }

    await tempReply(interaction, 'Could not join queue!');
}

export const joinQueueShared: Command<RepliableInteraction> = {
    data: { name: CommandName.QUEUE_JOIN },
    execute: execute,
    guards: [],
};

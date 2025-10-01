import { Guild } from 'discord.js';
import { queueManager } from '../../../config/state';
import { DebugUtils } from '../../../debug.utils';
import { Game, GameMode, Server } from '../../../../.prisma';
import { buildQueueEmbed } from '../../embed/build-queue-embed';
import { buildQueueUI } from './build-queue-ui';

export async function updateQueueUI(
    server: Server,
    guild: Guild,
    game: Game,
    gameMode: GameMode,
) {
    if (server.queueChannelId) {
        const queueChannel = await guild.channels.fetch(server.queueChannelId);

        if (!queueChannel || !queueChannel.isTextBased()) {
            DebugUtils.warning(`Queue channel not found!`);
            return;
        }

        const embed = await buildQueueEmbed(guild, game, gameMode);
        const queueUI = buildQueueUI(gameMode);

        if (gameMode.queueMessageId) {
            try {
                const existingQueueMessage = await queueChannel.messages.fetch(
                    gameMode.queueMessageId,
                );

                if (existingQueueMessage) {
                    await existingQueueMessage.edit({
                        embeds: [embed],
                        components: queueUI,
                    });

                    return;
                }
            } catch (e) {
                DebugUtils.warning(`Message not found: ${e}`);
            }
        }
        const queueMessage = await queueChannel.send({
            embeds: [embed],
            components: queueUI,
        });

        if (queueMessage) {
            await queueManager.setQueueMessageId(gameMode.id, queueMessage.id);
        }
    } else {
        DebugUtils.warning('No queue channel configured');
    }
}

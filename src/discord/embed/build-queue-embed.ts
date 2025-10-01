import { Game, GameMode } from '../../../.prisma';
import {
    APIEmbedField,
    ColorResolvable,
    Colors,
    EmbedAuthorOptions,
    EmbedBuilder,
    Guild,
} from 'discord.js';
import { queueManager } from '../../config/state';
import { formatListCodeBlock } from '../format.utils';

export async function buildQueueEmbed(
    guild: Guild,
    game: Game,
    gameMode: GameMode,
) {
    const queueEntries = await queueManager.getQueueEntriesForMode(gameMode.id);

    const infoFields: APIEmbedField[] = [
        {
            name: 'Status',
            value: gameMode.queueable ? 'Enabled' : 'Disabled',
        },
        {
            name: 'Queued players',
            value: formatListCodeBlock(
                queueEntries.map((qe) => qe.serverGameProfile.inGameName),
            ),
        },
    ];

    const author: EmbedAuthorOptions = {
        name: `Queue: ${game.name} - ${gameMode.name}`,
    };

    const icon = guild.iconURL();

    if (icon) {
        author.iconURL = icon;
    }

    return new EmbedBuilder()
        .setAuthor(author)
        .setColor(getEmbedColor(gameMode.queueable))
        .addFields(infoFields)
        .setTimestamp();
}

function getEmbedColor(queueable: boolean): ColorResolvable {
    return queueable ? Colors.Green : Colors.Red;
}

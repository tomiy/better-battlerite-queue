import {
    APIEmbedField,
    EmbedAuthorOptions,
    EmbedBuilder,
    Guild,
} from 'discord.js';
import { Rating, ServerGameProfile } from '../../../.prisma';

export function buildPlayerEmbed(
    guild: Guild,
    profile: ServerGameProfile,
    playerRating: Rating,
) {
    const infoFields: APIEmbedField[] = [
        {
            name: 'Rating',
            value: playerRating.elo.toString(),
        },
        {
            name: 'Description',
            value: profile.description || '',
        },
    ];

    const author: EmbedAuthorOptions = {
        name: `Player card: ${profile.inGameName}`,
    };

    const icon = guild.iconURL();

    if (icon) {
        author.iconURL = icon;
    }

    return new EmbedBuilder()
        .setAuthor(author)
        .addFields(infoFields)
        .setTimestamp();
}

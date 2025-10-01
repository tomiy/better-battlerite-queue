import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { gameManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingGameCharacter: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'game', 'characterName']);

    const { matchingCharacter, validCharacterNames } =
        await gameManager.findCharacter(context.game.id, context.characterName);

    if (!matchingCharacter) {
        await safeReply(
            interaction,
            `No matching character for "${context.characterName}". Available characters: ${formatListCodeBlock(validCharacterNames)}`,
        );
        return false;
    }

    context.gameCharacter = matchingCharacter;

    return true;
};

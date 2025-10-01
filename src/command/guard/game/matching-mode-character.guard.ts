import { RepliableInteraction } from 'discord.js';
import { safeReply } from '../../../discord/interaction.utils';
import { GuardFunction } from '../guard.type';
import { CommandContext, ensureContext } from '../../command-context.type';
import { characterManager } from '../../../config/state';
import { formatListCodeBlock } from '../../../discord/format.utils';

export const matchingModeCharacter: GuardFunction = async (
    interaction: RepliableInteraction,
    context: CommandContext,
) => {
    ensureContext(context, ['server', 'gameMode', 'characterName']);

    const { matchingCharacter, validCharacterNames } =
        await characterManager.findCharacter(
            context.gameMode.id,
            context.characterName,
        );

    if (!matchingCharacter) {
        await safeReply(
            interaction,
            `No matching character for "${context.characterName}" for game mode ${context.gameMode.name}. Available characters: ${formatListCodeBlock(validCharacterNames)}`,
        );
        return false;
    }

    context.gameModeCharacter = matchingCharacter;

    return true;
};

import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandSubcommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { ChatInputSubcommand } from '../../../../command';
import {
    CommandContext,
    ensureContext,
} from '../../../../command-context.type';
import { characterManager } from '../../../../../config/state';
import { tempReply } from '../../../../../discord/interaction.utils';
import { DebugUtils } from '../../../../../debug.utils';
import { CommandName } from '../../../../command-name.type';
import { matchingServerGame } from '../../../../guard/game/matching-server-game.guard';
import { matchingMode } from '../../../../guard/game/matching-mode.guard';
import { matchingModeCharacter } from '../../../../guard/game/matching-mode-character.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_CHARACTER_EDIT)
    .setDescription('Edit character')
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
            .setName('character_name')
            .setDescription('Character name')
            .setRequired(true),
    );

async function execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    ensureContext(context, ['server', 'serverGame', 'gameModeCharacter']);

    const restrictionsInput = new TextInputBuilder()
        .setCustomId('restrictionsInput')
        .setLabel('Restrictions')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(context.gameModeCharacter.restrictions || '');
    const restrictionsRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            restrictionsInput,
        );

    const characterModal = new ModalBuilder()
        .setCustomId(`characterEditModal-${interaction.id}`)
        .setTitle(`${context.gameModeCharacter.character.name} edit form`)
        .addComponents(restrictionsRow);

    await interaction.showModal(characterModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 600000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId === `characterEditModal-${interaction.id}`,
        });

        if (submitted) {
            const restrictions =
                submitted.fields.getTextInputValue('restrictionsInput');

            const updatedCharacter = await characterManager.updateCharacter(
                context.gameModeCharacter.id,
                restrictions,
            );

            if (updatedCharacter) {
                await tempReply(
                    submitted,
                    `Character ${context.gameModeCharacter.character.name} updated!`,
                );
            }
        } else {
            await tempReply(
                interaction,
                'Something went wrong with the character modal :/',
            );
            DebugUtils.error(
                `[Character Edit] Something went wrong with the character modal`,
            );
        }
    } catch (e) {
        DebugUtils.error(`[Character Edit] Timeout: ${e}`);
    }
}

function populateContext(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
) {
    context.gameName = interaction.options.getString('game_name', true);
    context.modeName = interaction.options.getString('mode_name', true);
    context.characterName = interaction.options.getString(
        'character_name',
        true,
    );
}

export const editCharacter: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [matchingServerGame, matchingMode, matchingModeCharacter],
};

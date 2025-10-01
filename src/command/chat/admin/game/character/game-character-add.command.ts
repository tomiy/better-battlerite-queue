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
import { matchingGameCharacter } from '../../../../guard/game/matching-game-character.guard';
import { matchingGame } from '../../../../guard/game/matching-game.guard';

const data = new SlashCommandSubcommandBuilder()
    .setName(CommandName.GAME_CHARACTER_ADD)
    .setDescription('Add character')
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
    ensureContext(context, [
        'server',
        'serverGame',
        'gameMode',
        'characterName',
        'gameCharacter',
    ]);

    const { matchingCharacter } = await characterManager.findCharacter(
        context.gameMode.id,
        context.characterName,
    );

    if (matchingCharacter) {
        await tempReply(
            interaction,
            'A character with this name already exists for this game mode!',
        );
        return;
    }

    const restrictionsInput = new TextInputBuilder()
        .setCustomId('restrictionsInput')
        .setLabel('Restrictions')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
    const restrictionsRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            restrictionsInput,
        );

    const characterModal = new ModalBuilder()
        .setCustomId(`characterAddModal-${interaction.id}`)
        .setTitle(`${context.gameCharacter.name} creation form`)
        .addComponents(restrictionsRow);

    await interaction.showModal(characterModal);

    try {
        const submitted = await interaction.awaitModalSubmit({
            time: 600000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                i.customId === `characterAddModal-${interaction.id}`,
        });

        if (submitted) {
            const restrictions =
                submitted.fields.getTextInputValue('restrictionsInput');

            const updatedCharacter = await characterManager.createCharacter(
                context.gameMode.id,
                context.gameCharacter.id,
                restrictions,
            );

            if (updatedCharacter) {
                await tempReply(
                    submitted,
                    `Character ${context.gameCharacter.name} created!`,
                );
            }
        } else {
            await tempReply(
                interaction,
                'Something went wrong with the character modal :/',
            );
            DebugUtils.error(
                `[Character Add] Something went wrong with the character modal`,
            );
        }
    } catch (e) {
        DebugUtils.error(`[Character Add] Timeout: ${e}`);
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

export const addCharacter: ChatInputSubcommand = {
    data: data,
    populateContext: populateContext,
    execute: execute,
    guards: [
        matchingGame,
        matchingServerGame,
        matchingMode,
        matchingGameCharacter,
    ],
};

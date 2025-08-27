import {
    ActionRowBuilder,
    APIEmbedField,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Guild,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextChannel,
    userMention,
} from 'discord.js';
import { ChampionData, Guild as dbGuild } from '../../.prisma';
import { prisma } from '../config';
import { championToChampionName } from '../data/championMappings';
import { maptoMapName } from '../data/mapMappings';

export async function sendDraftUI(
    matchId: number,
    guild: Guild,
    dbGuild: dbGuild,
    teamChannels: TextChannel[],
) {
    const match = await prisma.match.findFirstOrThrow({
        where: { id: matchId },
        include: {
            map: true,
            draftSequence: { include: { steps: true } },
            teams: { include: { users: { include: { user: true } } } },
        },
    });

    const champions = await prisma.championData.findMany({
        where: { guildId: dbGuild.id },
    });

    const championToSelectOption = (c: ChampionData) => {
        const championName =
            championToChampionName.get(c.champion) || 'Unknown';
        return new StringSelectMenuOptionBuilder()
            .setLabel(championName)
            .setDescription(championName)
            .setValue(c.champion);
    };

    const meleeChampions = champions
        .filter((c) => c.type === 'MELEE')
        .map(championToSelectOption);
    const rangedChampions = champions
        .filter((c) => c.type === 'RANGED')
        .map(championToSelectOption);
    const supportChampions = champions
        .filter((c) => c.type === 'SUPPORT')
        .map(championToSelectOption);

    const teamsFields: APIEmbedField[] = match.teams.map((t) => {
        const userMentions = t.users
            .map(
                (u) =>
                    `${userMention(u.user.userDiscordId)} ${u.captain ? '- Captain' : ''}`,
            )
            .join('\n');
        return {
            name: `Team ${t.order + 1}`,
            value: userMentions,
            inline: true,
        };
    });

    const mapName = maptoMapName.get(match.map.map) || 'Unknown';
    const mapVariantName = match.map.variant === 'DAY' ? 'Day' : 'Night';

    const draftStep = match.draftSequence.steps.find(
        (s) => s.order === match.currentDraftStep,
    );

    const mainEmbed = new EmbedBuilder()
        .setAuthor({ name: `Match #${match.id}`, iconURL: guild.iconURL()! })
        .addFields(teamsFields)
        .addFields([
            { name: 'Map', value: `${mapName} ${mapVariantName}` },
            {
                name: 'Current Step',
                value: `Team ${match.currentDraftTeam + 1} ${draftStep?.type}`,
            },
        ])
        .setTimestamp();

    const meleeButton = new ButtonBuilder()
        .setCustomId('meleeButton')
        .setLabel('Melee')
        .setStyle(ButtonStyle.Primary);

    const rangedButton = new ButtonBuilder()
        .setCustomId('rangedButton')
        .setLabel('Ranged')
        .setStyle(ButtonStyle.Primary);

    const supportButton = new ButtonBuilder()
        .setCustomId('supportButton')
        .setLabel('Support')
        .setStyle(ButtonStyle.Primary);
    const categoryButtonsRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(meleeButton)
        .addComponents(rangedButton)
        .addComponents(supportButton);

    const meleeList = new StringSelectMenuBuilder()
        .setCustomId('meleeList')
        .setPlaceholder('Choose a melee champion')
        .addOptions(meleeChampions);
    const rangedList = new StringSelectMenuBuilder()
        .setCustomId('rangedList')
        .setPlaceholder('Choose a ranged champion')
        .addOptions(rangedChampions);
    const supportList = new StringSelectMenuBuilder()
        .setCustomId('supportList')
        .setPlaceholder('Choose a support champion')
        .addOptions(supportChampions);

    const meleeRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            meleeList,
        );
    const rangedRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            rangedList,
        );
    const supportRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            supportList,
        );

    for (const tc of teamChannels) {
        const matchingTeam = match.teams.find((t) => t.teamChannel === tc.id);

        if (!matchingTeam) {
            throw new Error('[Draft UI] No matching team for team channel!');
        }

        const captain = matchingTeam.users.find((u) => u.captain);

        if (!captain) {
            throw new Error(
                `[Draft UI] No captain for team ${matchingTeam.id}!`,
            );
        }

        const draftUIMessage = await tc.send({
            embeds: [mainEmbed],
            components: [categoryButtonsRow],
        });

        const buttonCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        const selectCollector = draftUIMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
        });

        buttonCollector?.on('collect', async (i) => {
            if (i.member.id !== captain?.user.userDiscordId) {
                i.reply({
                    content: 'You are not captain!',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            switch (i.customId) {
                case 'meleeButton':
                    i.update({ components: [categoryButtonsRow, meleeRow] });
                    break;
                case 'rangedButton':
                    i.update({ components: [categoryButtonsRow, rangedRow] });
                    break;
                case 'supportButton':
                    i.update({ components: [categoryButtonsRow, supportRow] });
                    break;
            }
        });

        selectCollector.on('collect', async (i) => {
            if (i.member.id !== captain?.user.userDiscordId) {
                i.reply({
                    content: 'You are not captain!',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            switch (i.customId) {
                case 'meleeList':
                case 'rangedList':
                case 'supportList':
                    if (match.currentDraftTeam !== matchingTeam.order) {
                        i.reply({
                            content: 'It is not your turn to draft!',
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }

                    // TODO: check if champ is pick/bannable
                    // TODO: pick/ban depending on current draft step
                    // TODO: refresh draft UI (by calling the funcion again lol!)
                    break;
            }
        });
    }
}

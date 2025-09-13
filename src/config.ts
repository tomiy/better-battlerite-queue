import { Client } from 'discord.js';
import dotenv from 'dotenv';
import { DraftStep, PrismaClient } from '../.prisma';

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DEBUG_LEVEL } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    throw new Error('Missing environment variables');
}

export const config = {
    DISCORD_TOKEN,
    DISCORD_CLIENT_ID,
    DEBUG_LEVEL,
};

export const categoryChannelName = 'Better Battlerite Queue';
export const botCommandsChannelName = 'bbq-bot-commands';
export const queueChannelName = 'bbq-queue';
export const matchHistoryChannelName = 'bbq-match-history';

export const defaultDraftSequence = [
    DraftStep.GLOBAL_BAN,
    DraftStep.BAN,
    DraftStep.PICK,
    DraftStep.PICK,
    DraftStep.BAN,
    DraftStep.PICK,
];
export const defaultDraftSequenceName = 'DEFAULT';

export const defaultDataFolder = 'battlerite';

export const prisma = new PrismaClient();
export const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'GuildMembers'],
});

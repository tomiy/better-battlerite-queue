import dotenv from 'dotenv';
import { PrismaClient } from '../.prisma';

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

export const prisma = new PrismaClient();

import { PrismaClient } from '../../.prisma';
import { DebugUtils } from '../debug.utils';

export const prisma = new PrismaClient();

prisma.$connect().catch((error) => {
    DebugUtils.error(`Cannot connect to Prisma: ${error}`);
    process.exit(1);
});

process.once('SIGINT', async () => {
    DebugUtils.debug('[Prisma] Disconnecting db...');
    await prisma.$disconnect();
    DebugUtils.debug('[Prisma] Disconnected db');
});

process.once('beforeExit', async () => {
    DebugUtils.debug('[Prisma] Disconnecting db...');
    await prisma.$disconnect();
    DebugUtils.debug('[Prisma] Disconnected db');
});

import { PrismaClient } from '../../../.prisma';

export abstract class Manager {
    constructor(protected readonly prisma: PrismaClient) {}
}

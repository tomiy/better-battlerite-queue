import { Prisma } from '../../.prisma';

export type FullMatch = Prisma.MatchGetPayload<{
    include: {
        map: true;
        teams: {
            include: {
                users: { include: { user: true } };
                bans: { include: { champion: true } };
                picks: { include: { champion: true } };
            };
        };
    };
}>;

export const fullMatchInclude = {
    map: true,
    draftSequence: { include: { steps: true } },
    teams: {
        include: {
            users: { include: { user: true } },
            picks: { include: { champion: true } },
            bans: { include: { champion: true } },
        },
    },
};

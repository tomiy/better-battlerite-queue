import { DraftSequenceManager } from '../core/manager/draft-sequence.manager';
import { DraftManager } from '../core/manager/draft.manager';
import { GameModeManager } from '../core/manager/game-mode.manager';
import { GameManager } from '../core/manager/game.manager';
import { MatchBalanceManager } from '../core/manager/match/match-balance.manager';
import { MatchPlayerManager } from '../core/manager/match/match-player.manager';
import { MatchTeamManager } from '../core/manager/match/match-team.manager';
import { MatchManager } from '../core/manager/match/match.manager';
import { ProfileManager } from '../core/manager/profile.manager';
import { RegionManager } from '../core/manager/region.manager';
import { ServerManager } from '../core/manager/server.manager';
import { prisma } from '../db/prisma';
import { TerrainManager } from '../core/manager/terrain.manager';
import { CharacterManager } from '../core/manager/character.manager';
import { QueueManager } from '../core/manager/queue.manager';

export const serverManager = new ServerManager(prisma);
export const profileManager = new ProfileManager(prisma);
export const gameManager = new GameManager(prisma);
export const regionManager = new RegionManager(prisma);

export const queueManager = new QueueManager(prisma);

export const gameModeManager = new GameModeManager(prisma);
export const terrainManager = new TerrainManager(prisma);
export const characterManager = new CharacterManager(prisma);

export const draftSequenceManager = new DraftSequenceManager(prisma);
export const draftManager = new DraftManager(prisma);

export const matchManager = new MatchManager(prisma);
export const matchBalanceManager = new MatchBalanceManager(prisma);
export const matchTeamManager = new MatchTeamManager(prisma);
export const matchPlayerManager = new MatchPlayerManager(prisma);

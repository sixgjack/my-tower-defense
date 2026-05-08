// src/services/studentService.ts
// Service to manage student data and game statistics

import * as db from './postgresDatabase';
import { STARTER_CORE_TOWERS } from '../config/starterTowers';

export interface GameResult {
  wave: number;
  enemiesKilled: number;
  moneyEarned: number;
  towersBuilt: number;
  encounteredEnemies?: string[]; // Array of enemy type names encountered
}

export interface StudentStatus {
  userId: string;
  totalGames: number;
  totalWaves: number;
  totalEnemiesKilled: number;
  totalMoneyEarned: number;
  highestWave: number;
  credits: number;
  unlockedTowers: string[];
  encounteredEnemies: string[];
  lastPlayed: string;
}

/**
 * Update student status after a game ends
 */
export async function updateStudentStatusAfterGame(
  userId: string,
  gameResult: GameResult
): Promise<void> {
  try {
    // Get current status
    const currentStatusResult = await db.getStudentStatus(userId);
    if (!currentStatusResult.success || !currentStatusResult.data) {
      const starterTowers = [...STARTER_CORE_TOWERS];
      const initialEncountered = Array.isArray(gameResult.encounteredEnemies)
        ? [...new Set(gameResult.encounteredEnemies)]
        : [];
      const creditsEarned = gameResult.wave * 5;
      // Self-heal missing profile so first completed run is still persisted.
      await db.createStudentStatus(userId, {
        userId,
        totalGames: 1,
        totalWaves: gameResult.wave,
        totalEnemiesKilled: gameResult.enemiesKilled,
        totalMoneyEarned: gameResult.moneyEarned,
        highestWave: gameResult.wave,
        credits: creditsEarned,
        unlockedTowers: starterTowers,
        encounteredEnemies: initialEncountered,
        lastPlayed: new Date().toISOString(),
      });
      return;
    }

    const currentStatus = currentStatusResult.data;
    
    // Ensure starter towers are unlocked for every player
    const basicTowers = [...STARTER_CORE_TOWERS];
    const currentUnlocked = currentStatus.unlockedTowers || [];
    const allUnlocked = [...new Set([...basicTowers, ...currentUnlocked])];
    
    // Merge encountered enemies with previously encountered ones
    const currentEncountered = Array.isArray(currentStatus.encounteredEnemies)
      ? currentStatus.encounteredEnemies
      : [];
    const newEncountered = Array.isArray(gameResult.encounteredEnemies)
      ? gameResult.encounteredEnemies
      : [];
    const allEncountered = [...new Set([...currentEncountered, ...newEncountered])];
    
    // Credits based on waves achieved: 5 credits per wave (wave-based, not money-based)
    const creditsEarned = gameResult.wave * 5;
    const isNewHighWave = gameResult.wave > (currentStatus.highestWave || 0);

    await db.updateStudentStatus(userId, {
      increment: {
        totalGames: 1,
        totalWaves: gameResult.wave,
        totalEnemiesKilled: gameResult.enemiesKilled,
        totalMoneyEarned: gameResult.moneyEarned,
        credits: creditsEarned,
        highestWave: isNewHighWave ? gameResult.wave : 0
      },
      unlockedTowers: allUnlocked, // Ensure basic towers are always unlocked
      encounteredEnemies: allEncountered // Save all encountered enemies
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    throw error;
  }
}

/**
 * Get student status
 */
export async function getStudentStatus(userId: string): Promise<StudentStatus | null> {
  try {
    const result = await db.getStudentStatus(userId);
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Error getting student status:', error);
    throw error;
  }
}

/**
 * Create student status
 */
export async function createStudentStatus(userId: string, initialData: Partial<StudentStatus> = {}): Promise<void> {
  const result = await db.createStudentStatus(userId, initialData);
  if (!result.success) {
    throw new Error(result.error || 'Failed to create student status');
  }
}

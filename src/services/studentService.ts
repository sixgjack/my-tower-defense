// src/services/studentService.ts
// Service to manage student data and game statistics

import * as db from './postgresDatabase';

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
      console.error('Student status does not exist');
      return;
    }

    const currentStatus = currentStatusResult.data;
    
    // Ensure 8 basic towers are unlocked (for existing players who might not have them)
    const basicTowers = [
      'BASIC_RIFLE', 'BASIC_CANNON', 'BASIC_SNIPER', 'BASIC_SHOTGUN',
      'BASIC_FREEZE', 'BASIC_BURN', 'BASIC_STUN', 'BASIC_HEAL'
    ];
    const currentUnlocked = currentStatus.unlockedTowers || [];
    const allUnlocked = [...new Set([...basicTowers, ...currentUnlocked])];
    
    // Merge encountered enemies with previously encountered ones
    const currentEncountered = currentStatus.encounteredEnemies || [];
    const newEncountered = gameResult.encounteredEnemies || [];
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

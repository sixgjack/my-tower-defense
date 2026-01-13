// src/services/studentService.ts
// Service to manage student data and game statistics

import { doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface GameResult {
  wave: number;
  enemiesKilled: number;
  moneyEarned: number;
  towersBuilt: number;
  encounteredEnemies?: string[]; // Array of enemy type names encountered
}

/**
 * Update student status after a game ends
 */
export async function updateStudentStatusAfterGame(
  userId: string,
  gameResult: GameResult
): Promise<void> {
  try {
    const statusRef = doc(db, 'students', userId);
    const statusSnap = await getDoc(statusRef);

    if (!statusSnap.exists()) {
      console.error('Student status document does not exist');
      return;
    }

    const currentStatus = statusSnap.data();
    const creditsEarned = Math.floor(gameResult.moneyEarned / 10); // 1 credit per 10 money earned
    const isNewHighWave = gameResult.wave > (currentStatus.highestWave || 0);

    await updateDoc(statusRef, {
      totalGames: increment(1),
      totalWaves: increment(gameResult.wave),
      totalEnemiesKilled: increment(gameResult.enemiesKilled),
      totalMoneyEarned: increment(gameResult.moneyEarned),
      credits: increment(creditsEarned),
      highestWave: isNewHighWave ? gameResult.wave : currentStatus.highestWave,
      lastPlayed: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    throw error;
  }
}

/**
 * Get student status
 */
export async function getStudentStatus(userId: string) {
  try {
    const statusRef = doc(db, 'students', userId);
    const statusSnap = await getDoc(statusRef);
    
    if (statusSnap.exists()) {
      return statusSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting student status:', error);
    throw error;
  }
}

// src/engine/SpreadAttackHandler.ts
// Handles spread/shotgun attacks - fires multiple pellets in an arc pattern
import type { Tower, Enemy, Projectile } from './types';
import type { TowerStats } from './types';

export interface SpreadAttackConfig {
  pelletCount: number; // Number of pellets to fire
  spreadAngle: number; // Total spread angle in degrees
  baseAngle: number; // Base angle toward target
  tower: Tower;
  target: Enemy;
  stats: TowerStats;
}

/**
 * Creates multiple projectiles for spread/shotgun attacks
 */
export class SpreadAttackHandler {
  /**
   * Create spread attack projectiles
   */
  static createSpreadProjectiles(
    tower: Tower,
    target: Enemy,
    stats: TowerStats,
    addProjectile: (proj: Projectile) => void
  ): void {
    const pelletCount = stats.multiTarget || 5; // Default to 5 pellets
    const spreadAngle = 40; // Total spread angle in degrees (wider for visibility)
    
    // Calculate base angle toward target
    const baseAngle = Math.atan2(
      (target.r + (target.yOffset || 0)) - tower.r,
      (target.c + (target.xOffset || 0)) - tower.c
    );
    
    // Calculate distance to target
    const distance = Math.sqrt(
      Math.pow((target.c + (target.xOffset || 0)) - tower.c, 2) +
      Math.pow((target.r + (target.yOffset || 0)) - tower.r, 2)
    );
    
    // Create each pellet
    for (let i = 0; i < pelletCount; i++) {
      // Calculate angle offset for this pellet
      // Distribute pellets evenly across the spread angle
      const angleOffset = (i / (pelletCount - 1) - 0.5) * spreadAngle * (Math.PI / 180);
      const pelletAngle = baseAngle + angleOffset;
      
      // Calculate target position for this pellet (at same distance as original target)
      const pelletTx = tower.c + Math.cos(pelletAngle) * distance;
      const pelletTy = tower.r + Math.sin(pelletAngle) * distance;
      
      // Damage per pellet (total damage divided by pellet count)
      const pelletDamage = tower.damage / pelletCount;
      
      // Create projectile
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: pelletTx,
        ty: pelletTy,
        targetId: target.id, // Still track original target for homing
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'shotgun',
        damage: pelletDamage,
        speed: stats.projectileSpeed || 0.15, // Slightly faster for visibility
        splash: 0, // No splash for individual pellets
        progress: 0,
        type: 'arrow'
      });
    }
  }
  
  /**
   * Check if a tower should use spread attack
   */
  static isSpreadAttack(stats: TowerStats): boolean {
    return stats.type === 'spread';
  }
}

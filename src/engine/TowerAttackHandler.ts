// src/engine/TowerAttackHandler.ts
// Handles different tower attack patterns: spread, beam, missile, area, etc.
// This file provides a structured approach to tower attacks, but the current implementation
// in GameEngine.ts already handles these patterns. This file can be used for future refactoring.
import type { Tower, Enemy, Projectile } from './types';
import type { TowerStats } from './types';

interface AttackContext {
  tower: Tower;
  target: Enemy;
  stats: TowerStats;
  addProjectile: (proj: Projectile) => void;
  addParticle: (x: number, y: number, type: string, color: string) => void;
  playSound: (sound: string) => void;
  applyDamage: (enemy: Enemy, damage: number) => void;
  killEnemy: (enemy: Enemy) => void;
  getEnemiesInRange: (centerR: number, centerC: number, radius: number) => Enemy[];
}

/**
 * Handles tower attacks based on tower type
 */
export class TowerAttackHandler {
  /**
   * Main attack handler - routes to appropriate attack method based on tower type
   */
  static handleAttack(context: AttackContext): void {
    const { stats } = context;

    switch (stats.type) {
      case 'beam':
        this.handleBeamAttack(context);
        break;
      case 'spread':
        this.handleSpreadAttack(context);
        break;
      case 'area':
        this.handleAreaAttack(context);
        break;
      case 'projectile':
        this.handleProjectileAttack(context);
        break;
      case 'line':
        this.handleLineAttack(context);
        break;
      default:
        // Fallback to projectile
        this.handleProjectileAttack(context);
    }
  }

  /**
   * Beam attack - continuous damage over time
   */
  private static handleBeamAttack(context: AttackContext): void {
    const { tower, target, stats, applyDamage, addParticle } = context;
    
    // Continuous damage per tick
    const damage = tower.damage * 0.1;
    applyDamage(target, damage);
    
    // Visual particle effect
    addParticle(
      target.c * 60 + 30,
      target.r * 60 + 30,
      stats.projectileStyle === 'ice' || stats.projectileStyle === 'lightning' ? 'electric' : 'beam',
      stats.color
    );
    
    // Apply status effects
    if (stats.projectileStyle === 'ice' || stats.projectileStyle === 'lightning') {
      // Status effects handled by effect manager
    }
  }

  /**
   * Spread/Shotgun attack - fires multiple pellets in an arc
   */
  private static handleSpreadAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound } = context;
    
    const pelletCount = stats.multiTarget || 5; // Default 5 pellets
    const spreadAngle = 30; // Total spread angle in degrees
    const baseAngle = Math.atan2(
      (target.r + (target.yOffset || 0)) - tower.r,
      (target.c + (target.xOffset || 0)) - tower.c
    );
    
    for (let i = 0; i < pelletCount; i++) {
      const angleOffset = (i / (pelletCount - 1) - 0.5) * spreadAngle * (Math.PI / 180);
      const pelletAngle = baseAngle + angleOffset;
      const pelletDamage = tower.damage / pelletCount; // Each pellet does less damage
      
      // Calculate target position for this pellet
      const distance = Math.sqrt(
        Math.pow((target.c + (target.xOffset || 0)) - tower.c, 2) +
        Math.pow((target.r + (target.yOffset || 0)) - tower.r, 2)
      );
      const pelletTx = tower.c + Math.cos(pelletAngle) * distance;
      const pelletTy = tower.r + Math.sin(pelletAngle) * distance;
      
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: pelletTx,
        ty: pelletTy,
        targetId: target.id,
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'shotgun',
        damage: pelletDamage,
        speed: stats.projectileSpeed || 0.15,
        splash: 0,
        progress: 0,
        type: 'arrow'
      });
    }
    
    playSound('shoot');
    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
  }

  /**
   * Area attack - explosive projectiles with splash damage
   */
  private static handleAreaAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound, getEnemiesInRange, applyDamage, killEnemy } = context;
    
    // Create projectile that will explode on impact
    addProjectile({
      id: Math.random(),
      x: tower.c,
      y: tower.r,
      startX: tower.c,
      startY: tower.r,
      tx: target.c + (target.xOffset || 0),
      ty: target.r + (target.yOffset || 0),
      targetId: target.id,
      color: stats.color,
      life: 100,
      maxLife: 100,
      style: stats.projectileStyle || 'arc',
      damage: tower.damage,
      speed: stats.projectileSpeed || 0.12,
      splash: stats.areaRadius || 1.5, // Splash radius
      progress: 0,
      type: 'arrow'
    });
    
    playSound('shoot');
    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
  }

  /**
   * Standard projectile attack - single or multi-target
   */
  private static handleProjectileAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound, applyDamage, killEnemy } = context;
    
    // Instant hit for sniper/lightning
    if (stats.projectileStyle === 'sniper' || stats.projectileStyle === 'lightning') {
      applyDamage(target, tower.damage);
      
      if (stats.projectileStyle === 'lightning') {
        addParticle(target.c * 60 + 30, target.r * 60 + 30, 'electric', stats.color);
      }
      
      // Visual projectile (instant)
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        tx: target.c,
        ty: target.r,
        startX: tower.c,
        startY: tower.r,
        targetId: target.id,
        color: stats.color,
        life: 10,
        maxLife: 10,
        style: stats.projectileStyle || 'dot',
        damage: 0, // Already applied
        speed: 0,
        progress: 0,
        type: 'arrow'
      });
      
      if (target.hp <= 0) killEnemy(target);
      playSound('shoot');
    } else {
      // Traveling projectile
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: target.c + (target.xOffset || 0),
        ty: target.r + (target.yOffset || 0),
        targetId: target.id,
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'dot',
        damage: tower.damage,
        speed: stats.projectileSpeed || 0.12,
        splash: stats.areaRadius,
        progress: 0,
        type: 'arrow'
      });
      
      playSound('shoot');
      const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
      addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
    }
  }

  /**
   * Line attack - pierces through multiple enemies
   */
  private static handleLineAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound, getEnemiesInRange, applyDamage, killEnemy } = context;
    
    // Calculate line direction
    const dx = (target.c + (target.xOffset || 0)) - tower.c;
    const dy = (target.r + (target.yOffset || 0)) - tower.r;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Find all enemies in line
    const enemiesInLine = getEnemiesInRange(tower.r, tower.c, tower.range)
      .filter(e => {
        // Check if enemy is in the line path
        const ex = e.c + (e.xOffset || 0);
        const ey = e.r + (e.yOffset || 0);
        const tx = tower.c;
        const ty = tower.r;
        
        // Distance from line
        const distToLine = Math.abs(
          (dy * ex - dx * ey + tower.c * (target.r + (target.yOffset || 0)) - tower.r * (target.c + (target.xOffset || 0))) / distance
        );
        
        return distToLine < 0.3; // Within line width
      })
      .sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.c - tower.c, 2) + Math.pow(a.r - tower.r, 2));
        const distB = Math.sqrt(Math.pow(b.c - tower.c, 2) + Math.pow(b.r - tower.r, 2));
        return distA - distB;
      });
    
    // Damage all enemies in line
    enemiesInLine.forEach(enemy => {
      applyDamage(enemy, tower.damage);
      if (enemy.hp <= 0) killEnemy(enemy);
    });
    
    // Visual projectile
    if (enemiesInLine.length > 0) {
      const lastEnemy = enemiesInLine[enemiesInLine.length - 1];
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: lastEnemy.c + (lastEnemy.xOffset || 0),
        ty: lastEnemy.r + (lastEnemy.yOffset || 0),
        targetId: lastEnemy.id,
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'laser',
        damage: 0, // Already applied
        speed: stats.projectileSpeed || 0.2,
        splash: 0,
        progress: 0,
        type: 'arrow'
      });
    }
    
    playSound('shoot');
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }
}

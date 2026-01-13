// src/engine/TowerAttackHandler.ts
// Comprehensive tower attack handler implementing all attack patterns
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
  getTowersInRange: (centerR: number, centerC: number, radius: number) => Tower[];
  healTower: (tower: Tower, amount: number) => void;
  buffTower: (tower: Tower, buffType: string, value: number) => void;
}

/**
 * Comprehensive tower attack handler
 * Implements all attack patterns: spread, beam, area, boomerang, bloomerang, etc.
 */
export class TowerAttackHandler {
  /**
   * Main attack handler - routes to appropriate attack method
   */
  static handleAttack(context: AttackContext): void {
    const { stats } = context;

    // Healer/Support towers don't attack enemies
    if (stats.damage === 0 || stats.type === 'aura' && (stats.description.includes('Heal') || stats.description.includes('heal') || stats.description.includes('buff') || stats.description.includes('Buff'))) {
      this.handleSupportTower(context);
      return;
    }

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
      case 'line':
        this.handleLineAttack(context);
        break;
      case 'pull':
        this.handlePullAttack(context);
        break;
      case 'projectile':
        this.handleProjectileAttack(context);
        break;
      case 'aura':
        this.handleAuraAttack(context);
        break;
      default:
        this.handleProjectileAttack(context);
    }
  }

  /**
   * Support towers - heal/buff/shield nearby towers
   */
  private static handleSupportTower(context: AttackContext): void {
    const { tower, stats, getTowersInRange, healTower, buffTower, addParticle } = context;
    
    const nearbyTowers = getTowersInRange(tower.r, tower.c, tower.range);
    
    nearbyTowers.forEach(nearbyTower => {
      if (nearbyTower.id === tower.id) return; // Don't heal self
      
      // Heal towers
      if (stats.description.includes('Heal') || stats.description.includes('heal') || stats.description.includes('Medic')) {
        const healAmount = 5; // Base heal per tick
        healTower(nearbyTower, healAmount);
        addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'heal', '#10b981');
      }
      
      // Buff towers (damage/range/cooldown boost)
      if (stats.description.includes('buff') || stats.description.includes('Buff') || stats.description.includes('Command')) {
        buffTower(nearbyTower, 'damage', 1.1); // 10% damage boost
        buffTower(nearbyTower, 'range', 1.05); // 5% range boost
        addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#fbbf24');
      }
    });
  }

  /**
   * Beam attack - continuous damage over time
   */
  private static handleBeamAttack(context: AttackContext): void {
    const { tower, target, stats, applyDamage, addParticle, killEnemy } = context;
    
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
    
    if (target.hp <= 0) killEnemy(target);
  }

  /**
   * Spread/Shotgun attack - fires multiple pellets in an arc
   */
  private static handleSpreadAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound } = context;
    
    const pelletCount = stats.multiTarget || 5;
    const spreadAngle = 35; // Wider spread for visibility
    const baseAngle = Math.atan2(
      (target.r + (target.yOffset || 0)) - tower.r,
      (target.c + (target.xOffset || 0)) - tower.c
    );
    
    for (let i = 0; i < pelletCount; i++) {
      const angleOffset = (i / (pelletCount - 1) - 0.5) * spreadAngle * (Math.PI / 180);
      const pelletAngle = baseAngle + angleOffset;
      const pelletDamage = tower.damage / pelletCount;
      
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
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }

  /**
   * Area attack - explosive projectiles with splash damage
   */
  private static handleAreaAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound } = context;
    
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
      splash: stats.areaRadius || 1.5,
      progress: 0,
      type: 'arrow'
    });
    
    playSound('shoot');
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }

  /**
   * Boomerang/Bloomerang attack - projectiles return after hitting
   */
  private static handleBoomerangAttack(context: AttackContext, isBloomerang: boolean = false): void {
    const { tower, target, stats, addProjectile, addParticle, playSound } = context;
    
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
      life: 200, // Longer life for return trip
      maxLife: 200,
      style: isBloomerang ? 'bloomerang' : 'boomerang',
      damage: tower.damage,
      speed: stats.projectileSpeed || 0.12,
      splash: 0,
      progress: 0,
      type: 'boomerang', // Special type for return logic
      returnToTower: true,
      returnProgress: 0
    });
    
    playSound('shoot');
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }

  /**
   * Standard projectile attack
   */
  private static handleProjectileAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound, applyDamage, killEnemy } = context;
    
    // Check for boomerang/bloomerang
    if (stats.projectileStyle === 'boomerang') {
      this.handleBoomerangAttack(context, false);
      return;
    }
    if (stats.projectileStyle === 'bloomerang') {
      this.handleBoomerangAttack(context, true);
      return;
    }
    
    // Instant hit for sniper/lightning
    if (stats.projectileStyle === 'sniper' || stats.projectileStyle === 'lightning') {
      applyDamage(target, tower.damage);
      
      if (stats.projectileStyle === 'lightning') {
        addParticle(target.c * 60 + 30, target.r * 60 + 30, 'electric', stats.color);
      }
      
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
        damage: 0,
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
      addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
    }
  }

  /**
   * Line attack - pierces through multiple enemies
   */
  private static handleLineAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound, getEnemiesInRange, applyDamage, killEnemy } = context;
    
    const dx = (target.c + (target.xOffset || 0)) - tower.c;
    const dy = (target.r + (target.yOffset || 0)) - tower.r;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Find all enemies in line
    const enemiesInLine = getEnemiesInRange(tower.r, tower.c, tower.range)
      .filter(e => {
        const ex = e.c + (e.xOffset || 0);
        const ey = e.r + (e.yOffset || 0);
        const tx = tower.c;
        const ty = tower.r;
        
        const distToLine = Math.abs(
          (dy * ex - dx * ey + tower.c * (target.r + (target.yOffset || 0)) - tower.r * (target.c + (target.xOffset || 0))) / distance
        );
        
        return distToLine < 0.3;
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
      const lastEnemyX = lastEnemy.c + (lastEnemy.xOffset || 0);
      const lastEnemyY = lastEnemy.r + (lastEnemy.yOffset || 0);
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: lastEnemyX,
        ty: lastEnemyY,
        targetId: lastEnemy.id,
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'laser',
        damage: 0,
        speed: stats.projectileSpeed || 0.2,
        splash: 0,
        progress: 0,
        type: 'arrow'
      });
    } else {
      // No enemies in line, still show visual
      const targetX = target.c + (target.xOffset || 0);
      const targetY = target.r + (target.yOffset || 0);
      addProjectile({
        id: Math.random(),
        x: tower.c,
        y: tower.r,
        startX: tower.c,
        startY: tower.r,
        tx: targetX,
        ty: targetY,
        targetId: target.id,
        color: stats.color,
        life: 100,
        maxLife: 100,
        style: stats.projectileStyle || 'laser',
        damage: 0,
        speed: stats.projectileSpeed || 0.2,
        splash: 0,
        progress: 0,
        type: 'arrow'
      });
    }
    
    playSound('shoot');
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }

  /**
   * Pull attack - pulls enemies closer
   */
  private static handlePullAttack(context: AttackContext): void {
    const { tower, target, stats, addProjectile, addParticle, playSound } = context;
    
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
      style: stats.projectileStyle || 'vortex',
      damage: tower.damage,
      speed: stats.projectileSpeed || 0.12,
      splash: 0,
      progress: 0,
      type: 'arrow',
      pullStrength: stats.pullStrength || 1.0
    });
    
    playSound('shoot');
    addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
  }

  /**
   * Aura attack - damages all enemies in range
   */
  private static handleAuraAttack(context: AttackContext): void {
    const { tower, stats, getEnemiesInRange, applyDamage, killEnemy, addParticle } = context;
    
    const enemiesInRange = getEnemiesInRange(tower.r, tower.c, tower.range);
    
    enemiesInRange.forEach(enemy => {
      applyDamage(enemy, tower.damage * 0.1); // Continuous aura damage
      if (enemy.hp <= 0) killEnemy(enemy);
      addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'aura', stats.color);
    });
  }
}

// src/engine/GameEngine.ts
import { generateMap, ROWS, COLS } from './MapGenerator';
import { TOWERS, ENEMY_TYPES, THEMES } from './data';
import { soundSystem } from './SoundSystem';
import { effectManager } from './EffectManager';
import { applyDamageToEnemy } from './BossAbilities';
import type { ElementType, Particle, Projectile, TargetMode, Tower } from './types';
import { isDeveloperMode, DEV_STARTING_MONEY } from '../config/developerMode';
import { COMMANDERS } from '../config/characters';

type ActionType = { type: 'BUILD', r: number, c: number, towerKey: string } 
  | { type: 'UPGRADE', towerId: number, cost: number } 
  | { type: 'EARN_MONEY' }; 

interface Point { r: number; c: number; }

export class GameEngine {
  // --- VISUALS & NOTIFICATIONS ---
  notification: string | null = null;
  notificationType: 'wave' | 'boss' | 'alert' = 'wave';
  notificationTimer: number = 0;
  bossAbilityPopup: { name: string; bossType: 'mini' | 'big'; abilities: string[] } | null = null;
  bossAbilityPopupTimer: number = 0;
  baseHitEffect: number = 0; // > 0 triggers red flash on screen

  // --- GAME STATE ---
  map: any[][] = [];
  path: Point[] = [];
  towers: any[] = []; // Using 'any' for flexibility, or use Tower interface
  enemies: any[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];

  money: number = 500; // Reduced starting money for better balance
  lives: number = 20;
  wave: number = 1;
  gameSpeed: number = 1;
  isTacticalMode: boolean = false;
  
  // Game Over Stats
  isGameOver: boolean = false;
  totalMoneyEarned: number = 0;
  totalEnemiesKilled: number = 0;
  
  // Current Theme (for environmental effects)
  currentTheme: any = null;
  
  // Active Buffs (from roguelike rewards)
  activeBuffs: Array<{ buff: any; appliedAtWave: number; expiresAtWave?: number }> = [];
  
  // Buff Selection State
  showBuffSelection: boolean = false;

  // Wave Shop State (every 10 waves)
  showWaveShop: boolean = false;

  // Incremented whenever map is regenerated so PixiJS knows to redraw tiles
  mapVersion: number = 0;
  
  // Enemy Dictionary Tracking
  encounteredEnemyNames: Set<string> = new Set();
  
  // Deploy Points (Arknights)
  deployPoints: number = 10;
  maxDeployPoints: number = 20;

  // Support Tower Limits
  maxSupportTowers: number = 5;
  supportTowerCount: number = 0;

  // Commander System
  activeCommanderId: string = 'GHOST';
  commanderAbilityCooldownTicks: number = 0;
  commanderAbilityActiveTicks: number = 0;
  commanderMarkedEnemyId: number | null = null;

  // Tower Card XP tracking (session)
  sessionCardXp: Record<string, number> = {};
  currentAttackingTowerKey: string | null = null;

  // Card stat data (set before game start by UI layer)
  activeCardData: Record<string, { level: number; stars: number; bondLevel: number }> = {};
  
  // Mine System
  mines: Array<{ id: number; r: number; c: number; damage: number; maxMines: number }> = [];
  maxMinesPerTower: number = 3; // Default max mines per mine tower
  
  // --- AUTO-WAVE & LOGIC INTERNALS ---
  speedAccumulator: number = 0;
  tickCount: number = 0;
  pendingAction: ActionType | null = null;
  
  // Wave Management
  waveInProgress: boolean = false;
  waveCountdown: number = 180; // Delay before first wave (approx 3s)
  enemiesRemainingToSpawn: number = 0;
  spawnCooldown: number = 0;
  
  constructor() { 
      this.startNewGame(); 
  }

  startNewGame() {
    this.encounteredEnemyNames.clear();
    this.wave = 1;
    this.money = isDeveloperMode() ? DEV_STARTING_MONEY : 500;
    this.lives = 20;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.mines = [];
    this.supportTowerCount = 0;
    this.waveInProgress = false;
    this.waveCountdown = 180;
    this.isGameOver = false;
    this.totalMoneyEarned = 0;
    this.totalEnemiesKilled = 0;
    this.activeBuffs = [];
    this.showBuffSelection = false;
    this.showWaveShop = false;
    this.commanderAbilityCooldownTicks = 0;
    this.commanderAbilityActiveTicks = 0;
    this.commanderMarkedEnemyId = null;
    this.sessionCardXp = {};
    this.currentAttackingTowerKey = null;
    this.deployPoints = 10;

    // Initialize theme
    const themeIndex = Math.floor((this.wave - 1) / 10) % THEMES.length;
    this.currentTheme = THEMES[themeIndex];
    
    // Generate Initial Map
    this.map = generateMap(this.wave, 1.0);
    this.recalculatePath();
    this.mapVersion = 0;
  }

  // --- COMMANDER SYSTEM ---

  setCommander(id: string) {
    this.activeCommanderId = id;
  }

  getCommanderAbilityCooldownPct(): number {
    const cd = COMMANDERS[this.activeCommanderId]?.active.cooldown || 1;
    const maxTicks = cd * 60;
    return Math.max(0, 1 - this.commanderAbilityCooldownTicks / maxTicks);
  }

  triggerCommanderAbility() {
    if (this.commanderAbilityCooldownTicks > 0) return;
    if (this.isGameOver) return;
    const commander = COMMANDERS[this.activeCommanderId];
    if (!commander) return;
    const ability = commander.active;
    this.commanderAbilityCooldownTicks = ability.cooldown * 60;

    switch (ability.id) {
      case 'phantom_mark': {
        // Mark the frontmost enemy (highest pathIndex + progress)
        const frontmost = this.enemies.reduce((best: any, e: any) => {
          if (!best) return e;
          return (e.pathIndex + e.progress) > (best.pathIndex + best.progress) ? e : best;
        }, null as any);
        if (frontmost) {
          this.commanderMarkedEnemyId = frontmost.id;
          this.commanderAbilityActiveTicks = 8 * 60;
          this.addTextParticle(frontmost.c, frontmost.r, '[ PHANTOM MARK ]', '#00ff88');
          this.showNotification('PHANTOM MARK', 'alert');
        }
        break;
      }
      case 'orbital_hammer': {
        if (this.enemies.length === 0) break;
        const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        const blastRadius = 3;
        const blastDmg = 3000;
        this.enemies.forEach((e: any) => {
          const dist = Math.sqrt((e.c - target.c) ** 2 + (e.r - target.r) ** 2);
          if (dist <= blastRadius) {
            applyDamageToEnemy(e, blastDmg * (1 - dist / blastRadius * 0.4));
            if (e.hp <= 0) this.killEnemy(e);
          }
        });
        this.createExplosion(target.c * 60 + 30, target.r * 60 + 30, '#3b82f6', 3.5, 'cannonball');
        this.showNotification('ORBITAL HAMMER', 'boss');
        break;
      }
      case 'overclock': {
        this.commanderAbilityActiveTicks = 8 * 60;
        this.showNotification('SYSTEM OVERCLOCK', 'alert');
        break;
      }
      case 'emp_cascade': {
        const stunDur = 4 * 60;
        this.enemies.forEach((e: any) => {
          this.applyStunToEnemy(e, stunDur);
          this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'electric', '#a855f7');
        });
        this.showNotification('EMP CASCADE', 'alert');
        break;
      }
      case 'emergency_repair': {
        this.towers.forEach((t: any) => {
          t.hp = t.maxHp || 100;
          t.statusEffects = [];
        });
        this.showNotification('EMERGENCY REPAIR', 'alert');
        break;
      }
      case 'carpet_bomb': {
        let delay = 0;
        for (let i = 0; i < 5; i++) {
          const strikeDelay = delay;
          setTimeout(() => {
            if (this.enemies.length === 0) return;
            const tgt = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemies.forEach((e: any) => {
              const d = Math.sqrt((e.c - tgt.c) ** 2 + (e.r - tgt.r) ** 2);
              if (d <= 2) { applyDamageToEnemy(e, 1000); if (e.hp <= 0) this.killEnemy(e); }
            });
            this.createExplosion(tgt.c * 60 + 30, tgt.r * 60 + 30, '#ef4444', 2.5, 'arc');
          }, strikeDelay);
          delay += 350;
        }
        this.showNotification('CARPET BOMB', 'boss');
        break;
      }
    }
  }

  // --- MAIN LOOP ---
  tick() {
    if (this.isTacticalMode) return; 

    // Commander ability timers
    if (this.commanderAbilityCooldownTicks > 0) this.commanderAbilityCooldownTicks--;
    if (this.commanderAbilityActiveTicks > 0) {
      this.commanderAbilityActiveTicks--;
      if (this.commanderAbilityActiveTicks === 0) this.commanderMarkedEnemyId = null;
    }

    // Handle Visual Timers
    if (this.notificationTimer > 0) {
        this.notificationTimer--;
        if (this.notificationTimer <= 0) this.notification = null;
    }
    if (this.bossAbilityPopupTimer > 0) {
        this.bossAbilityPopupTimer--;
        if (this.bossAbilityPopupTimer <= 0) this.bossAbilityPopup = null;
    }
    if (this.baseHitEffect > 0) this.baseHitEffect--;

    // Game Loop (with speed catch-up)
    this.speedAccumulator += this.gameSpeed;
    let steps = 0;
    while (this.speedAccumulator >= 1.0 && steps < 10) {
        this.updateGameLogic();
        this.speedAccumulator -= 1.0;
        steps++;
    }
  }

  private updateGameLogic() {
    if (this.pendingAction) return; // Pause logic if modal is open

    this.tickCount++;

    // Passive DP gen (~1 DP every 4 seconds, boosted by vanguards)
    if (this.tickCount % 1 === 0) {
        const vanguardCount = this.towers.filter((t: any) => (TOWERS[t.key] as any)?.operatorClass === 'vanguard').length;
        const dpRate = 0.008 + vanguardCount * 0.005;
        this.deployPoints = Math.min(this.maxDeployPoints, this.deployPoints + dpRate);
    }

    // 1. AUTO WAVE MANAGEMENT
    if (!this.waveInProgress) {
        if (this.waveCountdown > 0) {
            this.waveCountdown--;
            if (this.waveCountdown === 0) {
                this.startWave();
            }
        }
    }

    // 2. SPAWNING
    if (this.waveInProgress) {
        if (this.enemiesRemainingToSpawn > 0) {
            if (this.spawnCooldown > 0) {
                this.spawnCooldown--;
            } else {
                this.spawnEnemy();
                this.enemiesRemainingToSpawn--;
                // Formula: Spawns get faster as waves progress
                this.spawnCooldown = Math.max(10, 60 - this.wave);
            }
        } else if (this.enemies.length === 0) {
            // Wave Complete
            this.endWave();
        }
    }

    // 3. ENTITY UPDATES
    this.updateEnemies();
    this.updateTowers();
    this.updateProjectiles();
    this.updateParticles(); 
  }

  // --- WAVE CONTROL ---
  
  startWave() {
      if (this.waveInProgress) return;

      // Check for Map Switch (Every 10 waves, start of 11, 21...)
      if (this.wave > 1 && (this.wave - 1) % 10 === 0) {
          this.changeMap();
          const themeIndex = Math.floor((this.wave - 1) / 10) % THEMES.length;
          this.currentTheme = THEMES[themeIndex];
          this.showNotification(`SECTOR ${Math.ceil(this.wave/10)}: ${this.currentTheme.name}`, 'alert');
      } 
      else {
          const isBigBoss = this.wave % 10 === 0;
          if (isBigBoss) {
              this.showNotification("⚠️ BIG BOSS INCOMING ⚠️", 'boss');
              soundSystem.play('boss');
              // Spawn big boss immediately
              this.spawnBossEnemy(true, false);
          } else if (this.wave % 5 === 0) {
              this.showNotification("⚠️ MINI BOSS INCOMING ⚠️", 'boss');
              soundSystem.play('boss');
              // Spawn mini boss immediately
              this.spawnBossEnemy(false, true);
          } else {
              this.showNotification(`WAVE ${this.wave}`, 'wave');
          }
      }

      // Boss waves: fewer regular enemies, regular waves: normal count
      const isBossWave = this.wave % 5 === 0;
      if (isBossWave) {
          this.enemiesRemainingToSpawn = Math.max(3, Math.floor((5 + Math.floor(this.wave * 1.5)) * 0.5));
      } else {
          this.enemiesRemainingToSpawn = 5 + Math.floor(this.wave * 1.5);
      }
      this.waveInProgress = true;
  }

  endWave() {
      this.waveInProgress = false;
      this.wave++;
      this.waveCountdown = 600; // 10 second break when shop/buff appears, 4s otherwise

      // Wave Shop every 10 waves (environment transition)
      if (this.wave > 1 && (this.wave - 1) % 10 === 0) {
          this.showWaveShop = true;
          this.showNotification('ENVIRONMENT SHIFT', 'boss');
      }
      // Buff selection every 3 waves (skip if wave shop triggers)
      else if (this.wave > 1 && (this.wave - 1) % 3 === 0) {
          this.showBuffSelection = true;
          this.showNotification('LEVEL BONUS READY', 'alert');
      } else {
          this.waveCountdown = 240; // 4 seconds for normal waves
      }
      
      // Clean up expired buffs
      this.activeBuffs = this.activeBuffs.filter(b => {
          if (b.buff.durationType === 'permanent') return true;
          if (b.expiresAtWave && this.wave > b.expiresAtWave) return false;
          return true;
      });
      
      // Optional: soundSystem.play('wave_clear');
  }
  
  // Apply a selected buff
  applyBuff(buff: any) {
      this.activeBuffs.push({
          buff,
          appliedAtWave: this.wave,
          expiresAtWave: buff.durationType === 'wave' && buff.waves 
              ? this.wave + buff.waves 
              : undefined
      });
      
      // Apply immediate effects
      if (buff.livesChange) {
          this.lives = Math.max(0, this.lives + buff.livesChange);
      }
      
      this.showBuffSelection = false;
  }

  closeWaveShop() {
      this.showWaveShop = false;
      // ── ROGUELIKE ENVIRONMENT TRANSITION ──────────────────────────────
      // Advance theme
      const newThemeIdx = Math.min(Math.floor((this.wave - 1) / 10), THEMES.length - 1);
      this.currentTheme = THEMES[newThemeIdx];

      // Regenerate map with a new layout for this wave block
      this.map = generateMap(this.wave, 1.0);
      this.recalculatePath();

      // Refund towers that now sit on the new path or spawn/base cells
      let refundTotal = 0;
      this.towers = this.towers.filter(t => {
          const cell = this.map[t.r]?.[t.c];
          if (cell === 'S' || cell === 'B' || cell === 1) {
              const stats = TOWERS[t.key];
              let invest = stats?.cost ?? 0;
              for (let i = 1; i < (t.level || 1); i++) invest += Math.floor((stats?.cost ?? 0) * 1.5 * i);
              refundTotal += Math.floor(invest * 0.70);
              return false;
          }
          return true;
      });

      if (refundTotal > 0) {
          this.money += refundTotal;
          this.showNotification(`REFUND +$${refundTotal}`, 'alert');
      }

      // Bump version so PixiGameBoard redraws tiles immediately
      this.mapVersion++;
      // Give players time to rebuild on the new map
      this.waveCountdown = 420;
      this.projectiles = [];
      this.enemies = [];
  }

  purchaseWaveShopItem(itemId: string) {
      switch (itemId) {
          // Higher prices — gold is more plentiful by wave 10+
          case 'life_3':
              if (this.money >= 400) { this.money -= 400; this.lives = Math.min(this.lives + 3, 20); }
              break;
          case 'life_5':
              if (this.money >= 700) { this.money -= 700; this.lives = Math.min(this.lives + 5, 20); }
              break;
          case 'life_restore_15':
              if (this.money >= 1400) { this.money -= 1400; this.lives = Math.max(this.lives, 15); }
              break;
      }
  }

  retreatOperator(towerId: number) {
      const idx = this.towers.findIndex(t => t.id === towerId);
      if (idx === -1) return;
      const tower = this.towers[idx];
      const stats = TOWERS[tower.key];
      // Refund 50% DP for path-deployed operators
      const isPathOp = Boolean((stats as any).canDeployOnPath) && this.map[tower.r]?.[tower.c] === 1;
      if (isPathOp) {
          const dpCost = (stats as any).dpCost as number | undefined;
          if (dpCost) {
              this.deployPoints = Math.min(this.maxDeployPoints, this.deployPoints + Math.floor(dpCost * 0.5));
          }
      }
      // Also refund some gold
      let invest = stats.cost;
      for (let i = 1; i < tower.level; i++) invest += Math.floor(stats.cost * 1.5 * i);
      this.money += Math.floor(invest * 0.5);
      // Unblock all enemies this tower was blocking
      this.enemies.forEach((e: any) => {
          if (e.blockedByTowerId === towerId) e.blockedByTowerId = undefined;
      });
      this.towers.splice(idx, 1);
      soundSystem.play('sell');
  }

  // Get active buff multipliers for towers
  getTowerBuffMultipliers() {
      const multipliers = {
          damage: 1.0,
          attackSpeed: 1.0,
          range: 1.0,
          money: 1.0
      };
      
      for (const activeBuff of this.activeBuffs) {
          const buff = activeBuff.buff;
          if (buff.damageMultiplier) {
              multipliers.damage *= (1 + buff.damageMultiplier);
          }
          if (buff.attackSpeedMultiplier) {
              multipliers.attackSpeed *= (1 + buff.attackSpeedMultiplier);
          }
          if (buff.rangeMultiplier) {
              multipliers.range *= (1 + buff.rangeMultiplier);
          }
          if (buff.moneyMultiplier) {
              multipliers.money *= (1 + buff.moneyMultiplier);
          }
      }
      
      return multipliers;
  }
  
  // Get active buff multipliers for enemies
  getEnemyBuffMultipliers() {
      const multipliers = {
          speed: 1.0,
          hp: 1.0
      };
      
      for (const activeBuff of this.activeBuffs) {
          const buff = activeBuff.buff;
          if (buff.enemySpeedMultiplier) {
              multipliers.speed *= (1 + buff.enemySpeedMultiplier);
          }
          if (buff.enemyHpMultiplier) {
              multipliers.hp *= (1 + buff.enemyHpMultiplier);
          }
      }
      
      return multipliers;
  }

  private getEnemyMovementType(enemy: any): 'ground' | 'air' {
      if (enemy?.movementType === 'air') return 'air';
      if (enemy?.isFlying) return 'air';
      if (Array.isArray(enemy?.abilities) && enemy.abilities.includes('fly')) return 'air';
      return 'ground';
  }

  private getTowerTargetMode(stats: any): TargetMode {
      return (stats?.targetMode as TargetMode) || 'ground';
  }

  private canTowerTargetEnemy(stats: any, enemy: any): boolean {
      const targetMode = this.getTowerTargetMode(stats);
      const movement = this.getEnemyMovementType(enemy);
      if (targetMode === 'both') return true;
      return targetMode === movement;
  }

  private enemyImmuneToElement(enemy: any, element?: ElementType): boolean {
      if (!element) return false;
      const imm = Array.isArray(enemy?.immunities) ? enemy.immunities : [];
      return imm.includes(element);
  }

  private applyTowerDamage(enemy: any, damage: number, stats: any): boolean {
      const element = (stats?.element as ElementType) || 'physical';
      if (this.enemyImmuneToElement(enemy, element)) {
          if (Math.random() > 0.65) this.addTextParticle(enemy.c, enemy.r, 'IMMUNE', '#94a3b8');
          return false;
      }
      // Phantom Mark (GHOST active): 3x damage to marked enemy
      let finalDamage = damage;
      if (this.commanderMarkedEnemyId !== null && enemy.id === this.commanderMarkedEnemyId) {
          finalDamage *= 3;
          if (Math.random() > 0.75) this.addTextParticle(enemy.c, enemy.r, '3x MARK', '#00ff88');
      }
      applyDamageToEnemy(enemy, finalDamage);
      return true;
  }

  applyStunToEnemy(enemy: any, duration: number = 90): boolean {
      if (!enemy) return false;
      const isBossEnemy = Boolean(enemy?.bossType || enemy?.isBoss);
      if (!isBossEnemy) {
          effectManager.applyEffectToEnemy(enemy, 'stunned', duration);
          return true;
      }

      const immuneUntil = enemy.stunImmuneUntil || 0;
      if (this.tickCount < immuneUntil) {
          if (Math.random() > 0.72) this.addTextParticle(enemy.c, enemy.r, 'STUN RESIST', '#fbbf24');
          return false;
      }

      // Bosses can still be controlled, but not chain-locked forever.
      effectManager.applyEffectToEnemy(enemy, 'stunned', Math.min(duration, 75));
      enemy.stunImmuneUntil = this.tickCount + 210; // ~3.5s immunity window
      return true;
  }

  private projectileCanHitEnemy(p: Projectile, enemy: any): boolean {
      const movement = this.getEnemyMovementType(enemy);
      const projMode: TargetMode = p.targetMode || 'both';
      if (projMode !== 'both' && projMode !== movement) return false;
      if (this.enemyImmuneToElement(enemy, p.element)) return false;
      return true;
  }
  
  /**
   * Track catalog name for enemy dictionary (boss waves, regular spawn, etc.).
   */
  recordEnemyEncounter(name?: string) {
    if (name && !this.encounteredEnemyNames.has(name)) {
      this.encounteredEnemyNames.add(name);
    }
  }

  /** Map cells covered by Flamethrower (BASIC_BURN) 3×3 ground hazard — used for flame overlay rendering. */
  collectFlameThrowerAuraCells(): { r: number; c: number }[] {
    const seen = new Set<string>();
    const out: { r: number; c: number }[] = [];
    for (const tower of this.towers) {
      if (tower.key !== 'BASIC_BURN') continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = tower.r + dr;
          const c = tower.c + dc;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          const key = `${r},${c}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ r, c });
        }
      }
    }
    return out;
  }

  spawnBossEnemy(isBigBoss: boolean, _isMiniBoss: boolean) {
      if (!this.path.length) return;
      
      const diff = Math.pow(1.1, this.wave);
      const availableBossTypes = ENEMY_TYPES.filter(t => t.isBoss === true);
      
      if (availableBossTypes.length === 0) return;
      
      const typeIdx = Math.floor(Math.random() * availableBossTypes.length);
      const stats = availableBossTypes[typeIdx];
      
      // Boss HP multipliers: mini-boss = 3x, big boss = 8x
      // Scale down for early waves - first wave boss should be manageable
      const waveScale = Math.max(0.5, Math.min(1.0, this.wave / 5)); // Scale from 0.5x at wave 1 to 1.0x at wave 5+
      const bossHpMultiplier = (isBigBoss ? 8 : 3) * waveScale;
      let hp = stats.hp * bossHpMultiplier * diff;
      
      // Boss money bonus
      const baseReward = stats.reward * bossHpMultiplier;
      const moneyBonus = stats.moneyBonus ? stats.moneyBonus : 1.0;
      const reward = baseReward * moneyBonus;
      
      // Apply theme environmental effects
      if (this.currentTheme && this.currentTheme.enemyHpMultiplier) {
          hp *= this.currentTheme.enemyHpMultiplier;
      }
      
      // Generate boss abilities
      let bossAbilities: string[] = stats.abilities ? [...stats.abilities] : [];
      const abilityPool: string[] = [
        'shield', 'slow_towers', 'deactivate_towers', 'regenerate', 'heal_allies',
        'speed_aura', 'shield_allies', 'charge', 'area_disable', 'damage_reflect',
      ];
      if (isBigBoss) {
          const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
          const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(4, additionalAbilities.length));
          bossAbilities = [...new Set([...bossAbilities, ...selected])];
      } else {
          const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
          const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(3, additionalAbilities.length));
          bossAbilities = [...new Set([...bossAbilities, ...selected])];
      }

      if (isDeveloperMode()) {
        bossAbilities = bossAbilities.filter((a) => a !== 'invisible');
      }
      
      // Boss speed multiplier
      const bossSpeedMultiplier = isBigBoss ? 0.5 : 0.7;
      const baseSpeed = 0.035 * stats.speed * bossSpeedMultiplier;
      
      const bossType = isBigBoss ? 'big' : 'mini';
      
      this.enemies.push({ 
          id: Date.now() + Math.random(), 
          pathIndex: 0, progress: 0.0, 
          r: this.path[0].r, c: this.path[0].c, 
          hp, maxHp: hp, 
          baseSpeed: baseSpeed, 
          speedMultiplier: 1.0,
          icon: isBigBoss ? "👹" : "👺", 
          color: stats.color, 
          reward: reward, 
          scale: isBigBoss ? 2.5 : 2.0, 
          frozen: 0,
          xOffset: 0,
          yOffset: 0,
          money: reward,
          damage: bossHpMultiplier,
          abilities: bossAbilities,
          abilityCooldown: stats.abilityCooldown || 200,
          lastAbilityUse: -999,
          isInvisible: isDeveloperMode() ? false : bossAbilities.includes('invisible'),
          isFlying: bossAbilities.includes('fly') || false,
          isBurrowed: bossAbilities.includes('burrow') || false,
          bossType: bossType,
          bossShieldHp: bossAbilities.includes('shield') ? (isBigBoss ? hp * 0.5 : hp * 0.3) : undefined,
          statusEffects: [],
          name: stats.name,
          isBoss: true,
          movementType: (stats as any).movementType || (bossAbilities.includes('fly') ? 'air' : 'ground'),
          immunities: Array.isArray((stats as any).immunities) ? [...(stats as any).immunities] : [],
      });
      this.recordEnemyEncounter(stats.name);
      this.bossAbilityPopup = {
        name: stats.name,
        bossType,
        abilities: bossAbilities,
      };
      this.bossAbilityPopupTimer = 420; // 7 seconds
  }

  // --- MAP & PATH ---

  changeMap() {
      // 1. Refund Towers (30% value - reduced from 70%)
      let refundTotal = 0;
      this.towers.forEach(t => {
          const cost = TOWERS[t.key].cost;
          refundTotal += Math.floor(cost * (t.level || 1) * 0.3);
      });
      
      if (refundTotal > 0) {
          this.money += refundTotal;
          // this.showNotification(`REFUND: +$${refundTotal}`, 'alert'); // Optional
      }

      // 2. Clear Board
      this.towers = [];
      this.projectiles = [];
      this.enemies = [];
      this.particles = [];

      // 3. Generate New Map
      this.map = generateMap(this.wave);
      this.recalculatePath();
  }

  recalculatePath() {
      this.path = [];
      let start: Point | null = null;

      // Find Start ('S')
      for(let r=0; r<ROWS; r++) {
          for(let c=0; c<COLS; c++) {
              if (this.map[r][c] === 'S') start = {r, c};
          }
      }

      if (!start) return;

      // BFS to find path to 'B'
      // Since map generator creates a single wide path, we can just follow the '1's
      let curr = start;
      const visited = new Set<string>();
      this.path.push(curr);
      visited.add(`${curr.r},${curr.c}`);

      let found = true;
      let safety = 0;
      while(found && safety < 1000) {
          safety++;
          found = false;
          const neighbors = [
              {r: curr.r-1, c: curr.c}, {r: curr.r+1, c: curr.c},
              {r: curr.r, c: curr.c-1}, {r: curr.r, c: curr.c+1}
          ];

          for(const n of neighbors) {
              if (n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS) {
                  const val = this.map[n.r][n.c];
                  // Walk on Path(1) or Base('B')
                  if ((val === 1 || val === 'B') && !visited.has(`${n.r},${n.c}`)) {
                      curr = n;
                      this.path.push(curr);
                      visited.add(`${curr.r},${curr.c}`);
                      found = true;
                      if (val === 'B') found = false; // Stop at base
                      break; 
                  }
              }
          }
      }
  }

  // --- ENTITIES ---

  spawnEnemy() {
    if (!this.path.length) return;
    
    const diff = Math.pow(1.1, this.wave); // Scaling difficulty
    
    // Boss waves are handled in startWave(), so regular spawnEnemy only spawns regular enemies
    // At wave > 20, 5% chance for a previous boss to randomly appear
    const allowRandomBoss = this.wave > 20 && Math.random() < 0.05;
    
    // Progressive enemy unlocking by theme
    // Theme 0 (waves 1-10): 5 types, Theme 1 (waves 11-20): 10 types, Theme 2 (waves 21-30): 15 types, etc.
    const themeIndex = Math.floor((this.wave - 1) / 10);
    const maxEnemyTypes = 5 * (themeIndex + 1); // 5, 10, 15, 20...
    
    const nonBossTypes = ENEMY_TYPES.filter(t => {
      // Exclude bosses on regular waves (unless random boss spawn)
      if (t.isBoss && !allowRandomBoss) return false;
      
      // First 10 waves: no hard enemies
      if (this.wave <= 10) {
        const hardAbilities = ['deactivate_towers', 'slow_towers', 'teleport', 'heal_allies', 'spawn_minions', 'split'];
        if (t.abilities && t.abilities.some(a => hardAbilities.includes(a))) {
          return false;
        }
      }
      
      // Check minWave requirement
      if (t.minWave && t.minWave > this.wave) return false;
      
      return true;
    });
    
    // Limit to first maxEnemyTypes enemies (unlock progressively)
    let availableTypes = nonBossTypes.slice(0, Math.min(maxEnemyTypes, nonBossTypes.length));
    
    if (availableTypes.length === 0) availableTypes = ENEMY_TYPES.filter(t => !t.minWave || t.minWave <= this.wave);
    
    const typeIdx = Math.floor(Math.random() * availableTypes.length);
    const stats = availableTypes[typeIdx];
    // isBoss removed - regular enemies only in spawnEnemy
    
    let hp = stats.hp * diff;
    const reward = stats.reward;
    
    // Apply theme environmental effects to enemy HP
    if (this.currentTheme && this.currentTheme.enemyHpMultiplier) {
      hp *= this.currentTheme.enemyHpMultiplier;
    }
    
    // Apply active buff multipliers to enemy HP
    const enemyBuffs = this.getEnemyBuffMultipliers();
    hp *= enemyBuffs.hp;
    
    // Overall speed: slightly increased for better pacing (0.035)
    let baseSpeed = 0.035 * stats.speed;
    
    // Apply active buff multipliers to enemy speed
    baseSpeed *= enemyBuffs.speed;

    // Ghost Protocol (WRAITH passive): enemies spawn at reduced speed
    const commanderMods = COMMANDERS[this.activeCommanderId]?.gameModifiers || {};
    if (commanderMods.enemySpeedOnStart) baseSpeed *= commanderMods.enemySpeedOnStart;

    const enemy = {
        id: Date.now() + Math.random(),
        pathIndex: 0, progress: 0.0, 
        r: this.path[0].r, c: this.path[0].c, 
        hp, maxHp: hp, 
        baseSpeed: baseSpeed, 
        speedMultiplier: 1.0,
        icon: stats.icon, 
        color: stats.color, 
        reward: reward, 
        scale: 1.0, 
        frozen: 0,
        xOffset: 0,
        yOffset: 0,
        money: reward,
        damage: 0,
        abilities: stats.abilities || [],
        abilityCooldown: stats.abilityCooldown || 0,
        lastAbilityUse: -999,
        isInvisible:
          isDeveloperMode() && stats.isBoss
            ? false
            : Boolean(stats.abilities && stats.abilities.includes('invisible')),
        isFlying: (stats.abilities && stats.abilities.includes('fly')) || false,
        isBurrowed: (stats.abilities && stats.abilities.includes('burrow')) || false,
        isCCImmune: (stats.abilities && stats.abilities.includes('cc_immune')) || false,
        bossType: undefined,
        bossShieldHp: undefined,
        statusEffects: [],
        name: stats.name, // Track enemy name for dictionary
        isBoss: Boolean(stats.isBoss),
        movementType: (stats as any).movementType || ((stats.abilities && stats.abilities.includes('fly')) ? 'air' : 'ground'),
        immunities: Array.isArray((stats as any).immunities) ? [...(stats as any).immunities] : [],
    };
    this.enemies.push(enemy);
    this.recordEnemyEncounter(stats.name);
  }

  updateEnemies() {
     this.enemies.forEach(enemy => {
        if (isDeveloperMode() && (enemy.bossType || enemy.isBoss)) {
          enemy.isInvisible = false;
        }
        // Update status effects (decrease duration, apply tick damage/healing)
        effectManager.updateEnemyEffects(enemy, this.tickCount);
        
        // Execute enemy abilities (teleport, heal, etc.)
        this.executeEnemyAbilities(enemy);
        
        // Decrease ability cooldown
        if (enemy.abilityCooldown && enemy.abilityCooldown > 0) {
            enemy.abilityCooldown--;
        }
        
        // Calculate effective speed based on status effects
        let currentSpeed = effectManager.getEffectiveEnemySpeed(enemy, enemy.baseSpeed);

        // Apply speed_aura boost (expires automatically via tick count)
        if ((enemy as any).speedBuffExpiry > this.tickCount) {
          currentSpeed *= 1.3;
        }

        // Apply theme environmental effects to enemy speed
        if (this.currentTheme && this.currentTheme.enemySpeedMultiplier) {
          currentSpeed *= this.currentTheme.enemySpeedMultiplier;
        }

        // Apply active buff multipliers to enemy speed (for already spawned enemies)
        const enemyBuffs = this.getEnemyBuffMultipliers();
        currentSpeed *= enemyBuffs.speed;
        
        // ── Arknights blocking ──────────────────────────────────────────────────
        const blockedByTowerId: number | undefined = (enemy as any).blockedByTowerId;
        if (blockedByTowerId != null) {
            const blocker = this.towers.find((t: any) => t.id === blockedByTowerId);
            if (!blocker || (blocker.hp ?? 1) <= 0) {
                // Blocker died — unblock
                (enemy as any).blockedByTowerId = undefined;
                (enemy as any).atkTimer = undefined;
            } else {
                // Enemy attacks the blocking tower
                (enemy as any).atkTimer = ((enemy as any).atkTimer ?? 0) - 1;
                if (((enemy as any).atkTimer ?? 0) <= 0) {
                    const rawAtk = enemy.maxHp * 0.006;
                    const def = (blocker as any).def ?? 0;
                    const dmg = Math.max(rawAtk * 0.1, rawAtk - def * 0.4);
                    blocker.hp = Math.max(0, (blocker.hp ?? 100) - dmg);
                    (enemy as any).atkTimer = 50;
                    this.addTextParticle(blocker.c, blocker.r, `-${Math.round(dmg)}`, '#ff4444');
                    soundSystem.play('hit');
                }
                return; // Skip movement entirely while blocked
            }
        }

        // Move along path
        enemy.progress += currentSpeed;
        if (enemy.progress >= 1.0) {
            const nextIdx = enemy.pathIndex + 1;

            // Check Base Hit
            if (nextIdx >= this.path.length - 1) {
                enemy.pathIndex = nextIdx;
                enemy.progress = 0;
                // Boss deals more damage based on boss type
                const damage = enemy.bossType === 'big' ? 8 : (enemy.bossType === 'mini' ? 3 : 1);
                this.lives -= damage;
                this.baseHitEffect = 15; // Trigger Red Flash
                enemy.hp = 0;
                enemy.escaped = true;
                soundSystem.play('hit_base'); // Assuming sound exists
            } else {
                const nextR = this.path[nextIdx].r;
                const nextC = this.path[nextIdx].c;
                // Check for blocking operator on next tile (ground enemies only)
                if (this.getEnemyMovementType(enemy) === 'ground') {
                    const blocker = this.towers.find((t: any) => {
                        if (t.r !== nextR || t.c !== nextC) return false;
                        const bc = (TOWERS[t.key] as any)?.blockCount ?? 0;
                        if (bc <= 0) return false;
                        const nbBlocked = this.enemies.filter((e: any) => (e as any).blockedByTowerId === t.id).length;
                        return nbBlocked < bc;
                    });
                    if (blocker) {
                        (enemy as any).blockedByTowerId = blocker.id;
                        (enemy as any).atkTimer = 30;
                        enemy.progress = 0.88; // Stop just before blocker tile
                        return; // Don't advance
                    }
                }
                enemy.pathIndex = nextIdx;
                enemy.progress = 0;
                const current = this.path[enemy.pathIndex];
                enemy.r = current.r;
                enemy.c = current.c;
            }
        }
        
        // Check for mine hits
        this.mines.forEach((mine, mineIndex) => {
            if (this.getEnemyMovementType(enemy) === 'air') return;
            const dist = Math.sqrt((enemy.c + (enemy.xOffset || 0) - mine.c)**2 + (enemy.r + (enemy.yOffset || 0) - mine.r)**2);
            if (dist < 0.3) { // Hit mine
                applyDamageToEnemy(enemy, mine.damage);
                this.createExplosion(mine.c * 60 + 30, mine.r * 60 + 30, '#f59e0b', 1.5, 'grenade');
                this.mines.splice(mineIndex, 1); // Remove mine after explosion
                if (enemy.hp <= 0) this.killEnemy(enemy);
            }
        });
        
        // Smooth Rendering Position
        if (!enemy.escaped && this.path[enemy.pathIndex] && this.path[enemy.pathIndex + 1]) {
            const current = this.path[enemy.pathIndex];
            const next = this.path[enemy.pathIndex + 1];
            enemy.xOffset = (next.c - current.c) * enemy.progress;
            enemy.yOffset = (next.r - current.r) * enemy.progress;
        }
    });
    
    // Remove dead/escaped
    this.enemies = this.enemies.filter(e => e.hp > 0 && !e.escaped);
    
    // Remove destroyed towers
    this.towers = this.towers.filter(t => (t.hp || t.maxHp || 100) > 0);
    
    if (this.lives <= 0 && !this.isGameOver) {
        this.isGameOver = true;
        this.isTacticalMode = true; // Pause game
        this.showNotification("GAME OVER", 'boss');
        soundSystem.play('gameover');
    }
  }

  updateTowers() {
    this.towers.forEach(tower => {
        this.currentAttackingTowerKey = tower.key;
        const stats = TOWERS[tower.key];
        
        // Initialize base stats if not set (for existing towers)
        // Use level to calculate base stats if they're not set
        if (!tower.baseDamage) {
            tower.baseDamage = stats.damage * (tower.level || 1);
        }
        if (!tower.baseRange) {
            tower.baseRange = stats.range * (1 + ((tower.level || 1) - 1) * 0.1);
        }
        if (!tower.baseCooldown) {
            tower.baseCooldown = stats.cooldown / (1 + ((tower.level || 1) - 1) * 0.1);
        }
        
        // Update status effects (decrease duration, call callbacks)
        effectManager.updateTowerEffects(tower);
        
        // Recalculate effective stats based on status effects
        let effectiveDamage = effectManager.getEffectiveTowerDamage(tower);
        let effectiveRange = effectManager.getEffectiveTowerRange(tower);
        
        // Apply theme environmental effects
        if (this.currentTheme) {
          if (this.currentTheme.towerDamageMultiplier) {
            effectiveDamage *= this.currentTheme.towerDamageMultiplier;
          }
          if (this.currentTheme.towerRangeMultiplier) {
            effectiveRange *= this.currentTheme.towerRangeMultiplier;
          }
        }
        
        tower.damage = effectiveDamage;
        tower.range = effectiveRange;
        
        // 1. Farm/BANKER Tower Logic
        if (stats.type === 'farm') {
            if (!tower.farmInitialized) {
                tower.cooldown = stats.cooldown; // Start with full delay
                tower.farmInitialized = true;
            }
            if (tower.cooldown > 0) {
                tower.cooldown--;
            } else {
                const amount = Math.floor(50 * (1 + (tower.level - 1) * 0.2));
                this.money += amount;
                this.totalMoneyEarned += amount;
                this.addTextParticle(tower.c, tower.r, `+$${amount}`, "#10b981");
                this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'star', '#10b981');
                tower.cooldown = stats.cooldown;
            }
            return;
        }
        
        // 2. Target Finding (use effective range + targetPriority)
        const inRange = this.enemies.filter(e => {
            if (!this.canTowerTargetEnemy(stats, e)) return false;
            const dist = Math.sqrt((e.r - tower.r)**2 + (e.c - tower.c)**2);
            return dist <= tower.range;
        });
        let target = null;
        const priority = tower.targetPriority || 'near';
        if (inRange.length > 0) {
            if (priority === 'first') {
                // furthest along path = highest pathIndex + xOffset progress
                target = inRange.reduce((best, e) => {
                    const bScore = best.pathIndex + (best.xOffset || 0) * 0.01;
                    const eScore = e.pathIndex + (e.xOffset || 0) * 0.01;
                    return eScore > bScore ? e : best;
                });
            } else if (priority === 'last') {
                target = inRange.reduce((best, e) => {
                    const bScore = best.pathIndex + (best.xOffset || 0) * 0.01;
                    const eScore = e.pathIndex + (e.xOffset || 0) * 0.01;
                    return eScore < bScore ? e : best;
                });
            } else if (priority === 'strong') {
                target = inRange.reduce((best, e) => e.hp > best.hp ? e : best);
            } else if (priority === 'weak') {
                target = inRange.reduce((best, e) => e.hp < best.hp ? e : best);
            } else {
                // 'near' — closest distance (default)
                target = inRange.reduce((best, e) => {
                    const bd = Math.sqrt((best.r - tower.r)**2 + (best.c - tower.c)**2);
                    const ed = Math.sqrt((e.r - tower.r)**2 + (e.c - tower.c)**2);
                    return ed < bd ? e : best;
                });
            }
        }

        // 3. Attack Logic (use effective cooldown)
        const baseCooldown = tower.baseCooldown || stats.cooldown;
        let effectiveCooldown = effectManager.getEffectiveTowerCooldown(tower, baseCooldown);
        
        // Apply theme environmental effects to cooldown
        if (this.currentTheme && this.currentTheme.towerCooldownMultiplier) {
          effectiveCooldown *= this.currentTheme.towerCooldownMultiplier;
        }
        
        // Apply active buff multipliers (attack speed = inverse of cooldown)
        const buffMultipliers = this.getTowerBuffMultipliers();
        effectiveCooldown /= buffMultipliers.attackSpeed;

        // System Overclock (CIPHER active): fire rate +60%
        if (this.commanderAbilityActiveTicks > 0 && COMMANDERS[this.activeCommanderId]?.active.id === 'overclock') {
          effectiveCooldown /= 1.6;
        }

        if (tower.cooldown > 0) tower.cooldown--;
        const towerIsStunned = Boolean(
          tower.statusEffects?.some((effect: { effectId: string }) => effect.effectId === 'stunned')
        );
        if (towerIsStunned) {
            // While disabled, do not fire or reset cooldown to huge values.
            return;
        }

        // Drone Spawner: emits autonomous attack drones
        if (tower.key === 'SUMMONER') {
            if (tower.cooldown <= 0) {
                tower.cooldown = effectiveCooldown;
                const droneSlotsUsed = this.projectiles.filter(
                    p => (p as any).droneOwner === tower.id
                ).length;
                const maxDrones = 5;
                const toSpawn = Math.max(0, maxDrones - droneSlotsUsed);
                for (let i = 0; i < Math.min(toSpawn, 2); i++) {
                    const spawnAngle = (i * Math.PI) + (this.tickCount * 0.05);
                    const spawnX = tower.c + Math.cos(spawnAngle) * 0.6;
                    const spawnY = tower.r + Math.sin(spawnAngle) * 0.6;
                    this.projectiles.push({
                        id: Math.random(),
                        x: spawnX, y: spawnY,
                        startX: spawnX, startY: spawnY,
                        tx: spawnX, ty: spawnY,
                        targetId: undefined,
                        color: stats.color,
                        life: 300, maxLife: 300,
                        style: 'drone',
                        damage: tower.damage,
                        speed: 0.055,
                        splash: 0,
                        progress: 0,
                        type: 'drone',
                        targetMode: this.getTowerTargetMode(stats),
                        element: (stats.element as ElementType) || 'physical',
                        droneOwner: tower.id,
                    } as any);
                }
                this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'electric', stats.color);
            }
            return;
        }

        // Flamethrower: passive 3×3 zone DoT + active fire-stream projectiles at enemies
        if (tower.key === 'BASIC_BURN') {
            if (tower.cooldown <= 0) {
                tower.cooldown = effectiveCooldown;

                // Zone damage — any enemy stepping into the 3×3 flame field takes DoT
                this.enemies.forEach(enemy => {
                    if (!this.canTowerTargetEnemy(stats, enemy)) return;
                    const ex = enemy.c + (enemy.xOffset || 0);
                    const ey = enemy.r + (enemy.yOffset || 0);
                    const inAura = Math.abs(ex - tower.c) <= 1 && Math.abs(ey - tower.r) <= 1;
                    if (!inAura) return;
                    if (!this.applyTowerDamage(enemy, tower.damage, stats)) return;
                    effectManager.applyEffectToEnemy(enemy, 'burning');
                    if (Math.random() < 0.45) {
                        this.addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'flame', '#ef4444');
                    }
                    if (enemy.hp <= 0) this.killEnemy(enemy);
                });

                // Active fire-stream: shoot a fire projectile at the nearest enemy in range
                let fireTarget: any = null;
                let fireMinD = Infinity;
                for (const e of this.enemies) {
                    if (!this.canTowerTargetEnemy(stats, e)) continue;
                    const fd = Math.sqrt((e.r - tower.r) ** 2 + (e.c - tower.c) ** 2);
                    if (fd <= tower.range && fd < fireMinD) { fireMinD = fd; fireTarget = e; }
                }
                if (fireTarget) {
                    this.projectiles.push({
                        id: Math.random(),
                        x: tower.c, y: tower.r,
                        startX: tower.c, startY: tower.r,
                        tx: fireTarget.c + (fireTarget.xOffset || 0),
                        ty: fireTarget.r + (fireTarget.yOffset || 0),
                        targetId: fireTarget.id,
                        color: '#ef4444',
                        life: 80, maxLife: 80,
                        style: 'fire',
                        damage: tower.damage * 1.5,
                        speed: 0.12,
                        splash: 0.6,
                        progress: 0,
                        type: 'arrow',
                        targetMode: this.getTowerTargetMode(stats),
                        element: 'fire',
                    });
                }
                this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'flame', '#ef4444');
            }
            return;
        }
        
        // Mine towers - plant mines on route
        if (stats.description.includes('Mine') || stats.description.includes('mine') || tower.key.includes('MINE')) {
            if (tower.cooldown <= 0) {
                tower.cooldown = effectiveCooldown;
                // Find a spot on the path to plant mine
                if (this.path.length > 0) {
                    const pathIndex = Math.floor(Math.random() * this.path.length);
                    const pathPoint = this.path[pathIndex];
                    
                    // Count existing mines from this tower
                    const towerMines = this.mines.filter(m => {
                        const dist = Math.sqrt((m.r - tower.r)**2 + (m.c - tower.c)**2);
                        return dist <= tower.range * 2; // Assume mines within 2x range belong to this tower
                    });
                    
                    const maxMines = (tower.level || 1) * this.maxMinesPerTower;
                    if (towerMines.length < maxMines) {
                        this.mines.push({
                            id: Date.now() + Math.random(),
                            r: pathPoint.r,
                            c: pathPoint.c,
                            damage: tower.damage * (tower.level || 1),
                            maxMines: maxMines
                        });
                        this.addParticle(pathPoint.c * 60 + 30, pathPoint.r * 60 + 30, 'impact', '#f59e0b');
                        soundSystem.play('build');
                    }
                }
            }
            return; // Don't attack enemies
        }
        
        // Healer/Support/Aura towers - handle buff/slow/heal effects instead of attacking
        if (stats.type === 'aura' || stats.damage === 0) {
            if (tower.cooldown <= 0) {
                tower.cooldown = effectiveCooldown;
                // Find nearby towers to heal/buff
                for (const nearbyTower of this.towers) {
                    if (nearbyTower.id === tower.id) continue;
                    const dist = Math.sqrt((nearbyTower.r - tower.r)**2 + (nearbyTower.c - tower.c)**2);
                    if (dist <= tower.range) {
                        // Heal towers - green + sign effect
                        if (stats.description.includes('Heal') || stats.description.includes('heal') || stats.description.includes('Medic') || stats.description.includes('Repair')) {
                            const healAmount = 5 + (tower.level - 1) * 2; // Scale with level
                            nearbyTower.hp = Math.min((nearbyTower.maxHp || 100), (nearbyTower.hp || 100) + healAmount);
                            // Green heal particle (no text to avoid clutter)
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'heal', '#10b981');
                        }
                        
                        // Speed/Attack Speed Buff
                        if (stats.description.includes('Speed') || stats.description.includes('speed') || stats.description.includes('attack speed') || tower.key === 'SPEED_BUFF') {
                            effectManager.applyEffectToTower(nearbyTower, 'haste', 120); // 2 second duration
                            if (Math.random() < 0.1) { // Only show particle occasionally
                                this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'star', '#fbbf24');
                            }
                        }
                        
                        // Damage Buff
                        if (stats.description.includes('Damage') || stats.description.includes('damage') || stats.description.includes('Amplifier') || tower.key === 'DAMAGE_BUFF') {
                            effectManager.applyEffectToTower(nearbyTower, 'power_boost', 120); // 2 second duration
                            if (Math.random() < 0.1) {
                                this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'star', '#ef4444');
                            }
                        }
                        
                        // Range Buff
                        if (stats.description.includes('Range') || stats.description.includes('range') || stats.description.includes('Extender') || tower.key === 'RANGE_BUFF') {
                            effectManager.applyEffectToTower(nearbyTower, 'range_boost', 120); // 2 second duration
                            if (Math.random() < 0.1) {
                                this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'star', '#3b82f6');
                            }
                        }
                        
                        // Frost Aura - makes attacks apply freeze
                        if (stats.description.includes('Frost') || stats.description.includes('frost') || tower.key === 'FROST_ENHANCER') {
                            effectManager.applyEffectToTower(nearbyTower, 'frost_aura', 120);
                            if (Math.random() < 0.1) {
                                this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'freeze', '#bfdbfe');
                            }
                        }
                        
                        // Venom Aura - makes attacks apply poison
                        if (stats.description.includes('Venom') || stats.description.includes('venom') || stats.description.includes('Poison') || tower.key === 'VENOM_ENHANCER') {
                            effectManager.applyEffectToTower(nearbyTower, 'venom_aura', 120);
                            if (Math.random() < 0.1) {
                                this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'poison_cloud', '#14b8a6');
                            }
                        }
                    }
                }
            }
            
            // Slow Field - affects enemies in range (not towers)
            if (stats.description.includes('Slow') || stats.description.includes('slow') || tower.key === 'SLOW_FIELD') {
                for (const enemy of this.enemies) {
                    const dist = Math.sqrt((enemy.r - tower.r)**2 + (enemy.c - tower.c)**2);
                    if (dist <= tower.range) {
                        effectManager.applyEffectToEnemy(enemy, 'slowed');
                        if (Math.random() < 0.02) {
                            this.addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'freeze', '#60a5fa');
                        }
                    }
                }
            }
            
            // Weakening Field - affects enemies in range
            if (stats.description.includes('Weaken') || stats.description.includes('armor') || tower.key === 'WEAKEN') {
                for (const enemy of this.enemies) {
                    const dist = Math.sqrt((enemy.r - tower.r)**2 + (enemy.c - tower.c)**2);
                    if (dist <= tower.range) {
                        effectManager.applyEffectToEnemy(enemy, 'weakened');
                        if (Math.random() < 0.02) {
                            this.addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'shadow_cloud', '#a855f7');
                        }
                    }
                }
            }
            
            return; // Don't attack enemies
        }
        
        if (target) {
            // Calculate tower rotation angle to face target
            const dx = (target.c + (target.xOffset || 0)) - tower.c;
            const dy = (target.r + (target.yOffset || 0)) - tower.r;
            tower.angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90) % 360; // Convert to degrees, adjust for sprite orientation
            
            if (stats.type === 'beam') {
                // Continuous Laser/Beam — fires through ALL enemies in a straight line to map edge
                tower.targetId = target.id;

                // Beam ramp damage - damage increases over time while facing same direction
                if (!tower.damageCharge) tower.damageCharge = 0;
                if (!tower.beamDuration) tower.beamDuration = 0;

                if (tower.lastTargetId === target.id) {
                    tower.damageCharge = Math.min(tower.damageCharge + (stats.beamRamp || 0.3), 5);
                    tower.beamDuration++;
                    if (tower.beamDuration > 300) {
                      tower.damageCharge = Math.max(0, tower.damageCharge - 0.5);
                      if (tower.beamDuration > 360) { tower.beamDuration = 0; tower.damageCharge = 0; }
                    }
                } else {
                    tower.damageCharge = 0;
                    tower.beamDuration = 0;
                    tower.lastFireBeamBurnTick = 0;
                }
                tower.lastTargetId = target.id;

                const rampMultiplier = 1 + tower.damageCharge;
                const damage = tower.damage * 0.08 * rampMultiplier;

                // LASER_BEAM fires a line through entire map — damage ALL enemies in line
                const bdx = (target.c + (target.xOffset || 0)) - tower.c;
                const bdy = (target.r + (target.yOffset || 0)) - tower.r;
                const blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
                const bnx = bdx / blen, bny = bdy / blen;

                // Store beam endpoint at map edge for rendering (30 cells covers any map size)
                (tower as any).beamEndX = tower.c + bnx * 30;
                (tower as any).beamEndY = tower.r + bny * 30;

                const beamLineEnemies = this.enemies.filter(e => {
                    if (!this.canTowerTargetEnemy(stats, e)) return false;
                    const ex = (e.c + (e.xOffset || 0)) - tower.c;
                    const ey = (e.r + (e.yOffset || 0)) - tower.r;
                    const proj = ex * bnx + ey * bny;
                    if (proj < 0.3) return false;
                    return Math.abs(ex * bny - ey * bnx) < 0.6;
                });

                beamLineEnemies.forEach(e => {
                    this.applyTowerDamage(e, damage, stats);
                    // Apply status effects based on beam type
                    if (stats.projectileStyle === 'ice') {
                        effectManager.applyEffectToEnemy(e, 'frostbite');
                        this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'freeze', '#60a5fa');
                    } else if (stats.projectileStyle === 'lightning') {
                        if (Math.random() < 0.05) this.applyStunToEnemy(e, 90);
                        this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'electric', '#facc15');
                    } else if (stats.element === 'fire' && stats.burnDamage && stats.burnDamage > 0) {
                        const lastBurn = tower.lastFireBeamBurnTick || 0;
                        if (!lastBurn || this.tickCount - lastBurn >= 22) {
                            tower.lastFireBeamBurnTick = this.tickCount;
                            effectManager.applyEffectToEnemy(e, 'burning');
                            if (Math.random() < 0.35) this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'flame', '#ef4444');
                        }
                    }
                    if (e.hp <= 0) this.killEnemy(e);
                });

                // Fallback: still damage primary target if not caught by line filter
                if (beamLineEnemies.length === 0) {
                    this.applyTowerDamage(target, damage, stats);
                    if (target.hp <= 0) this.killEnemy(target);
                }
            } else if (tower.cooldown <= 0) {
                // Shoot (reset cooldown to effective cooldown)
                tower.cooldown = effectiveCooldown;
                
                // Instant hit for sniper/lightning projectiles
                if (stats.projectileStyle === 'sniper' || stats.projectileStyle === 'lightning') {
                    // Instant Hit (Lightning/Sniper)
                    this.applyTowerDamage(target, tower.damage, stats);
                    if (stats.projectileStyle === 'lightning') {
                        this.addParticle(target.c*60+30, target.r*60+30, 'electric', stats.color);

                        // CHAIN LIGHTNING: bounce to additional enemies
                        if (stats.multiTarget && stats.multiTarget > 1) {
                            const maxChains = Math.floor(stats.multiTarget) - 1;
                            const hitIds = new Set<number>([target.id]);
                            let lastHit: any = target;
                            let chainDmg = tower.damage * 0.75;
                            for (let ch = 0; ch < maxChains; ch++) {
                                let next: any = null;
                                let minD = 3.5;
                                for (const e of this.enemies) {
                                    if (hitIds.has(e.id)) continue;
                                    if (!this.canTowerTargetEnemy(stats, e)) continue;
                                    const d = Math.sqrt((e.r - lastHit.r)**2 + (e.c - lastHit.c)**2);
                                    if (d < minD) { minD = d; next = e; }
                                }
                                if (!next) break;
                                if (!this.canTowerTargetEnemy(stats, next)) continue;
                                this.applyTowerDamage(next, chainDmg, stats);
                                hitIds.add(next.id);
                                this.projectiles.push({
                                    id: Math.random(),
                                    x: lastHit.c, y: lastHit.r,
                                    startX: lastHit.c, startY: lastHit.r,
                                    tx: next.c + (next.xOffset || 0),
                                    ty: next.r + (next.yOffset || 0),
                                    targetId: next.id, color: '#fcd34d',
                                    life: 8, maxLife: 8,
                                    style: 'lightning', damage: 0, speed: 0, progress: 0,
                                    type: 'arrow',
                                    targetMode: this.getTowerTargetMode(stats),
                                    element: (stats.element as ElementType) || 'physical',
                                });
                                this.addParticle(next.c * 60 + 30, next.r * 60 + 30, 'electric', '#fcd34d');
                                if (next.hp <= 0) this.killEnemy(next);
                                lastHit = next;
                                chainDmg *= 0.75;
                            }
                        }
                    }

                    // Visual Projectile
                    this.projectiles.push({
                        id: Math.random(), x: tower.c, y: tower.r, tx: target.c, ty: target.r,
                        startX: tower.c, startY: tower.r,
                        targetId: target.id, color: stats.color, life: 10, maxLife: 10,
                        style: stats.projectileStyle || 'dot', damage: 0, speed: 0, progress: 0,
                        type: 'arrow',
                        targetMode: this.getTowerTargetMode(stats),
                        element: (stats.element as ElementType) || 'physical',
                    });

                    if(target.hp <= 0) this.killEnemy(target);
                    soundSystem.play('shoot');

                } else if (stats.type === 'spread') {
                    // Shotgun: Wide arc of pellets — each pellet deals FULL damage
                    // Close-range enemies get hit by multiple pellets = naturally higher damage
                    const pelletCount = stats.multiTarget || 5;
                    const spreadAngle = 65; // Wide arc for authentic shotgun spread
                    const baseAngle = Math.atan2(
                        (target.r + (target.yOffset || 0)) - tower.r,
                        (target.c + (target.xOffset || 0)) - tower.c
                    );
                    for (let i = 0; i < pelletCount; i++) {
                        const angleOffset = (i / (pelletCount - 1) - 0.5) * spreadAngle * (Math.PI / 180);
                        const pelletAngle = baseAngle + angleOffset;
                        // Pellets travel to max range, not just to target distance
                        const pelletRange = stats.range * 1.1;
                        const pelletTx = tower.c + Math.cos(pelletAngle) * pelletRange;
                        const pelletTy = tower.r + Math.sin(pelletAngle) * pelletRange;

                        this.projectiles.push({
                            id: Math.random(),
                            x: tower.c, y: tower.r,
                            startX: tower.c, startY: tower.r,
                            tx: pelletTx, ty: pelletTy,
                            targetId: undefined,
                            color: stats.color,
                            life: 80, maxLife: 80,
                            style: stats.projectileStyle || 'shotgun',
                            damage: tower.damage, // Full damage per pellet — close range = multiple hits
                            speed: stats.projectileSpeed || 0.18,
                            splash: 0,
                            progress: 0,
                            type: 'arrow',
                            targetMode: this.getTowerTargetMode(stats),
                            element: (stats.element as ElementType) || 'physical',
                        });
                    }
                    soundSystem.play('shoot');
                    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
                } else if (stats.projectileStyle === 'boomerang' || stats.projectileStyle === 'bloomerang') {
                    // Boomerang/Bloomerang: Projectile returns after hitting, can hit multiple targets
                    this.projectiles.push({
                        id: Math.random(),
                        x: tower.c, y: tower.r,
                        startX: tower.c, startY: tower.r,
                        tx: target.c + (target.xOffset||0), 
                        ty: target.r + (target.yOffset||0),
                        targetId: target.id,
                        color: stats.color, 
                        life: 300, maxLife: 300, // Longer life for return trip and multiple hits
                        style: stats.projectileStyle, 
                        damage: tower.damage, 
                        speed: stats.projectileSpeed || 0.12,
                        splash: 0,
                        progress: 0,
                        type: 'boomerang',
                        returnToTower: true,
                        returnProgress: 0,
                        hitTargets: [], // Track hit enemies
                        firingTowerId: tower.id,
                        targetMode: this.getTowerTargetMode(stats),
                        element: (stats.element as ElementType) || 'physical',
                    });
                    soundSystem.play('shoot');
                    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
                } else if (tower.key === 'PENETRATOR') {
                    // Railgun: pierce through ALL enemies in a line, FULL damage to every target
                    const dx = (target.c + (target.xOffset || 0)) - tower.c;
                    const dy = (target.r + (target.yOffset || 0)) - tower.r;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / len, ny = dy / len;
                    const lineEnemies = this.enemies
                        .filter(e => {
                            if (!this.canTowerTargetEnemy(stats, e)) return false;
                            const ex = (e.c + (e.xOffset || 0)) - tower.c;
                            const ey = (e.r + (e.yOffset || 0)) - tower.r;
                            const proj = ex * nx + ey * ny;
                            if (proj < 0.2) return false;
                            return Math.abs(ex * ny - ey * nx) < 0.55;
                        })
                        .sort((a, b) => {
                            const pa = ((a.c + (a.xOffset || 0)) - tower.c) * nx + ((a.r + (a.yOffset || 0)) - tower.r) * ny;
                            const pb = ((b.c + (b.xOffset || 0)) - tower.c) * nx + ((b.r + (b.yOffset || 0)) - tower.r) * ny;
                            return pa - pb;
                        });
                    lineEnemies.forEach(e => {
                        if (!this.canTowerTargetEnemy(stats, e)) return;
                        this.applyTowerDamage(e, tower.damage, stats); // Full damage, no falloff
                        this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'electric', stats.color);
                        if (e.hp <= 0) this.killEnemy(e);
                    });
                    // Visual: instant bolt extending to map edge
                    const endX = tower.c + nx * 30;
                    const endY = tower.r + ny * 30;
                    this.projectiles.push({
                        id: Math.random(), x: tower.c, y: tower.r,
                        startX: tower.c, startY: tower.r,
                        tx: endX, ty: endY,
                        targetId: target.id, color: stats.color,
                        life: 12, maxLife: 12,
                        style: 'bolt', damage: 0, speed: 0, progress: 0, type: 'arrow',
                        targetMode: this.getTowerTargetMode(stats),
                        element: (stats.element as ElementType) || 'physical',
                    });
                    soundSystem.play('shoot');
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', stats.color);
                } else {
                    // Traveling Projectile
                    let projDamage = tower.damage;
                    // EXECUTIONER: 3x damage to enemies below 30% HP
                    if (tower.key === 'EXECUTIONER' && target.hp < target.maxHp * 0.3) {
                        projDamage *= 3;
                        this.addTextParticle(target.c, target.r, '💀 EXECUTE!', '#ef4444');
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'shadow_cloud', '#1e293b');
                    }
                    this.projectiles.push({
                        id: Math.random(),
                        x: tower.c, y: tower.r,
                        startX: tower.c, startY: tower.r,
                        tx: target.c + (target.xOffset||0),
                        ty: target.r + (target.yOffset||0),
                        targetId: target.id,
                        color: stats.color,
                        life: 100, maxLife: 100,
                        style: stats.projectileStyle || 'dot',
                        damage: projDamage,
                        speed: stats.projectileSpeed || 0.12,
                        splash: stats.areaRadius,
                        progress: 0,
                        type: 'arrow',
                        targetMode: this.getTowerTargetMode(stats),
                        element: (stats.element as ElementType) || 'physical',
                    });
                    soundSystem.play('shoot');
                    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
                }
                
                // Apply special abilities
                if (stats.specialAbility) {
                    if (stats.specialAbility === 'stun' && stats.stunDuration) {
                        this.applyStunToEnemy(target, stats.stunDuration);
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'electric', '#facc15');
                    } else if (stats.specialAbility === 'slow' && stats.slowFactor) {
                        effectManager.applyEffectToEnemy(target, 'slowed');
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'freeze', '#60a5fa');
                    } else if (stats.specialAbility === 'pull' && stats.pullStrength) {
                        // Pull enemy toward tower
                        effectManager.applyEffectToEnemy(target, 'pulled');
                        const pullAmount = stats.pullStrength;
                        // Calculate direction from enemy to tower
                        const dx = tower.c - target.c;
                        const dy = tower.r - target.r;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0.1) {
                            // Move enemy backward on path (reduce progress/pathIndex)
                            if (pullAmount > 0) {
                                // Pull toward tower (reduce pathIndex)
                                target.progress -= pullAmount * 0.3;
                                if (target.progress < 0) {
                                    target.pathIndex = Math.max(0, target.pathIndex - 1);
                                    target.progress = 1 + target.progress;
                                    if (target.pathIndex >= 0 && this.path[target.pathIndex]) {
                                        target.r = this.path[target.pathIndex].r;
                                        target.c = this.path[target.pathIndex].c;
                                    }
                                }
                            } else {
                                // Push away from tower (increase pathIndex) - negative pullStrength
                                target.progress += Math.abs(pullAmount) * 0.3;
                                if (target.progress >= 1) {
                                    target.pathIndex = Math.min(this.path.length - 2, target.pathIndex + 1);
                                    target.progress = target.progress - 1;
                                    if (target.pathIndex < this.path.length && this.path[target.pathIndex]) {
                                        target.r = this.path[target.pathIndex].r;
                                        target.c = this.path[target.pathIndex].c;
                                    }
                                }
                            }
                        }
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'ripple', pullAmount > 0 ? '#1e3a8a' : '#2dd4bf');
                    } else if (stats.specialAbility === 'aoe' && stats.areaRadius) {
                        // AOE damage to nearby enemies
                        for (const e of this.enemies) {
                            if (e.id === target.id) continue;
                            const dist = Math.sqrt((e.r - target.r)**2 + (e.c - target.c)**2);
                            if (dist <= stats.areaRadius) {
                                this.applyTowerDamage(e, tower.damage * 0.5, stats); // 50% splash damage
                                if (e.hp <= 0) this.killEnemy(e);
                            }
                        }
                        this.createExplosion(target.c * 60 + 30, target.r * 60 + 30, stats.color, stats.areaRadius, 'blast');
                    }
                }
                
                // Apply burn stacks from fire-aligned tower stats only (avoid poison towers reusing burnDamage)
                if (stats.element === 'fire' && stats.burnDamage && stats.burnDamage > 0) {
                    effectManager.applyEffectToEnemy(target, 'burning');
                }
                
                // Apply effects from tower aura buffs
                if (tower.statusEffects) {
                    // Frost aura - apply freeze to enemies
                    if (tower.statusEffects.some((effect: { effectId: string }) => effect.effectId === 'frost_aura')) {
                        effectManager.applyEffectToEnemy(target, 'frostbite');
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'freeze', '#60a5fa');
                    }
                    // Venom aura - apply poison to enemies
                    if (tower.statusEffects.some((effect: { effectId: string }) => effect.effectId === 'venom_aura')) {
                        effectManager.applyEffectToEnemy(target, 'poisoned');
                        this.addParticle(target.c * 60 + 30, target.r * 60 + 30, 'poison_cloud', '#10b981');
                    }
                }
            }
        } else {
            tower.targetId = null;
        }
    });
  }

  updateProjectiles() {
    this.projectiles.forEach(p => {
        // Drone autonomous attack behavior
        if (p.type === 'drone' || p.style === 'drone') {
            p.life!--;
            if ((p.life ?? 0) <= 0) return;

            // Find nearest valid enemy
            let bestEnemy: any = null;
            let bestDist = Infinity;
            this.enemies.forEach(e => {
                const ex = e.c + (e.xOffset || 0);
                const ey = e.r + (e.yOffset || 0);
                const d = Math.sqrt((ex - p.x) ** 2 + (ey - p.y) ** 2);
                if (d < bestDist && this.projectileCanHitEnemy(p, e)) {
                    bestDist = d; bestEnemy = e;
                }
            });

            if (bestEnemy) {
                const ex = bestEnemy.c + (bestEnemy.xOffset || 0);
                const ey = bestEnemy.r + (bestEnemy.yOffset || 0);
                const ddx = ex - p.x, ddy = ey - p.y;
                const dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
                p.x += (ddx / dl) * (p.speed ?? 0.055);
                p.y += (ddy / dl) * (p.speed ?? 0.055);

                if (bestDist < 0.4) {
                    applyDamageToEnemy(bestEnemy, p.damage);
                    this.addParticle(p.x * 60 + 30, p.y * 60 + 30, 'electric', p.color);
                    if (bestEnemy.hp <= 0) this.killEnemy(bestEnemy);
                    p.life! -= 40; // Partial life drain per hit; drone persists
                }
            }
            return;
        }

        // Visuals fade out
        if (p.style === 'lightning' || p.style === 'laser') {
            p.life!--;
            return;
        }
        // Instant-hit tracers (e.g. sniper visual) should never linger at spawn point.
        if ((p.speed ?? 0) <= 0) {
            p.life = (p.life ?? p.maxLife ?? 10) - 1;
            const maxLife = Math.max(1, p.maxLife ?? 10);
            const life = Math.max(0, p.life ?? 0);
            const t = 1 - life / maxLife;
            p.x = (p.startX ?? p.x) + (p.tx - (p.startX ?? p.x)) * t;
            p.y = (p.startY ?? p.y) + (p.ty - (p.startY ?? p.y)) * t;
            return;
        }

        // Handle boomerang return logic - can hit multiple targets
        if (p.returnToTower && p.returnProgress !== undefined) {
            if (p.progress < 1.0) {
                // Still going to target (forward journey)
                p.progress += p.speed;
                
                // Update target position
                if (p.targetId) {
                    const e = this.enemies.find(en => en.id === p.targetId);
                    if (e) {
                        p.tx = e.c + (e.xOffset || 0);
                        p.ty = e.r + (e.yOffset || 0);
                    }
                }
                
                // Lerp position to target
                const dx = p.tx - (p.startX!);
                const dy = p.ty - (p.startY!);
                p.x = (p.startX!) + dx * p.progress;
                p.y = (p.startY!) + dy * p.progress;
                
                // Check for enemy hits during forward journey (bloomerang hits multiple)
                if (p.style === 'bloomerang' || p.style === 'boomerang') {
                    this.enemies.forEach(enemy => {
                        if (p.hitTargets && p.hitTargets.includes(enemy.id)) return; // Already hit
                        const dist = Math.sqrt((enemy.c + (enemy.xOffset || 0) - p.x)**2 + (enemy.r + (enemy.yOffset || 0) - p.y)**2);
                        if (dist < 0.3) { // Hit radius
                            if (!this.projectileCanHitEnemy(p, enemy)) return;
                            applyDamageToEnemy(enemy, p.damage);
                            if (!p.hitTargets) p.hitTargets = [];
                            p.hitTargets.push(enemy.id);
                            if (enemy.hp <= 0) this.killEnemy(enemy);
                        }
                    });
                }
                
                // Check if reached initial target
                if (p.progress >= 1.0) {
                    if (!p.hitTargets || !p.hitTargets.includes(p.targetId || -1)) {
                        this.handleProjectileHit(p);
                    }
                    // Start return journey
                    p.returnProgress = 0;
                }
            } else if (p.returnProgress < 1.0) {
                // Returning to tower (backward journey)
                p.returnProgress += p.speed;
                
                // Find the tower that fired this projectile
                const firingTower = p.firingTowerId 
                    ? this.towers.find(t => t.id === p.firingTowerId)
                    : this.towers.find(t => {
                        const dist = Math.sqrt((t.c - p.x)**2 + (t.r - p.y)**2);
                        return dist < 0.5;
                    });
                
                if (firingTower) {
                    // Return to firing tower
                    const returnDx = firingTower.c - p.tx;
                    const returnDy = firingTower.r - p.ty;
                    p.x = p.tx + returnDx * p.returnProgress;
                    p.y = p.ty + returnDy * p.returnProgress;
                    
                    // Check for enemy hits during return journey (bloomerang hits multiple)
                    if (p.style === 'bloomerang' || p.style === 'boomerang') {
                        this.enemies.forEach(enemy => {
                            if (p.hitTargets && p.hitTargets.includes(enemy.id)) return; // Already hit
                            const dist = Math.sqrt((enemy.c + (enemy.xOffset || 0) - p.x)**2 + (enemy.r + (enemy.yOffset || 0) - p.y)**2);
                            if (dist < 0.3) { // Hit radius
                                if (!this.projectileCanHitEnemy(p, enemy)) return;
                                applyDamageToEnemy(enemy, p.damage);
                                if (!p.hitTargets) p.hitTargets = [];
                                p.hitTargets.push(enemy.id);
                                if (enemy.hp <= 0) this.killEnemy(enemy);
                            }
                        });
                    }
                    
                    if (p.returnProgress >= 1.0) {
                        // Returned - remove projectile
                        p.life = 0;
                    }
                } else {
                    // Tower not found, remove projectile
                    p.life = 0;
                }
            }
        } else {
            // Normal projectile behavior
            p.progress += p.speed;
            
            // For spread/shotgun projectiles, check for enemies in path (no homing)
            if (p.style === 'shotgun') {
                // Update position first
                const dx = p.tx - (p.startX!);
                const dy = p.ty - (p.startY!);
                p.x = (p.startX!) + dx * p.progress;
                p.y = (p.startY!) + dy * p.progress;

                // Check if projectile hits any enemy in its path
                // Wider hit radius (0.45) = more forgiving at close range
                let hitEnemy = false;
                this.enemies.forEach(enemy => {
                    if (hitEnemy) return;
                    const enemyX = enemy.c + (enemy.xOffset || 0);
                    const enemyY = enemy.r + (enemy.yOffset || 0);
                    const dist = Math.sqrt((enemyX - p.x) ** 2 + (enemyY - p.y) ** 2);
                    if (dist < 0.45 && p.progress > 0.08) {
                        if (!this.projectileCanHitEnemy(p, enemy)) return;
                        applyDamageToEnemy(enemy, p.damage);
                        if (enemy.hp <= 0) this.killEnemy(enemy);
                        this.createExplosion(p.x * 60 + 30, p.y * 60 + 30, p.color, 0.5, 'impact');
                        hitEnemy = true;
                        p.life = 0;
                    }
                });

                if (p.progress >= 1.0 && !hitEnemy) {
                    p.life = 0;
                }
            } else {
                // For other projectiles, update target position (homing behavior)
                if (p.targetId) {
                    const e = this.enemies.find(en => en.id === p.targetId);
                    if (e) {
                        // Update target position to enemy's current position
                        p.tx = e.c + (e.xOffset || 0);
                        p.ty = e.r + (e.yOffset || 0);
                    } else {
                        // Target died, projectile continues to last known position
                    }
                }
                
                // Add trail effects for various projectile styles
                if (p.progress > 0.1 && Math.random() > 0.7) {
                    const trailX = p.x * 60 + 30;
                    const trailY = p.y * 60 + 30;
                    if (p.style === 'fire' || p.style === 'plasma' || p.style === 'rocket' || p.style === 'missile') {
                        this.addParticle(trailX, trailY, 'smoke', p.color);
                    } else if (p.style === 'ice') {
                        this.addParticle(trailX, trailY, 'freeze', p.color);
                    } else if (p.style === 'poison' || p.style === 'acid') {
                        this.addParticle(trailX, trailY, 'poison_cloud', p.color);
                    } else if (p.style === 'magic' || p.style === 'holy' || p.style === 'orb') {
                        this.addParticle(trailX, trailY, 'star', p.color);
                    } else if (p.style === 'bolt') {
                        this.addParticle(trailX, trailY, 'electric', p.color);
                    }
                }

                // Lerp position
                const dx = p.tx - (p.startX!);
                const dy = p.ty - (p.startY!);
                p.x = (p.startX!) + dx * p.progress;
                p.y = (p.startY!) + dy * p.progress;

                if (p.progress >= 1.0) {
                    p.life = 0;
                    this.handleProjectileHit(p);
                }
            }
        }
    });
    this.projectiles = this.projectiles.filter(p => (p.life ?? 100) > 0);
  }

  handleProjectileHit(p: Projectile) {
      const hitX = p.x * 60 + 30;
      const hitY = p.y * 60 + 30;
      
      this.createExplosion(hitX, hitY, p.color, p.style === 'arc' || p.style === 'cannonball' || p.style === 'grenade' || p.style === 'rocket' ? 1.5 : 0.8, p.style);
      soundSystem.play('hit');
      
      // Add impact particle for visual feedback
      this.particles.push({ id: Math.random(), x: hitX, y: hitY, vx:0, vy:0, life: 5, maxLife: 5, color: p.color, scale: 1, type: 'impact' });

      if (p.splash) {
          // Splash Damage
          this.enemies.forEach(e => {
              const ex = e.c + (e.xOffset || 0);
              const ey = e.r + (e.yOffset || 0);
              const dist = Math.sqrt((ex - p.x)**2 + (ey - p.y)**2);
              if (dist <= p.splash! && this.projectileCanHitEnemy(p, e)) {
                  applyDamageToEnemy(e, p.damage);
                  if (e.hp <= 0) this.killEnemy(e);
              }
          });
      } else {
          // Single Target
          const e = this.enemies.find(en => en.id === p.targetId);
          if (e && this.projectileCanHitEnemy(p, e)) {
              applyDamageToEnemy(e, p.damage);
              if (e.hp <= 0) this.killEnemy(e);
          }
      }
  }

  executeEnemyAbilities(enemy: any) {
    if (!enemy.abilities || enemy.abilities.length === 0) return;
    
    const canUseAbility = !enemy.abilityCooldown || enemy.abilityCooldown <= 0;
    if (!canUseAbility) return;
    
    enemy.abilities.forEach((ability: string) => {
      const timeSinceLastUse = this.tickCount - (enemy.lastAbilityUse || -999);
      
      switch (ability) {
        case 'teleport':
          if (timeSinceLastUse > 300 && Math.random() > 0.95 && enemy.pathIndex < this.path.length - 2) {
            // Teleport forward 20-40% of remaining path
            const remaining = this.path.length - 1 - enemy.pathIndex;
            const teleportDistance = Math.floor(remaining * (0.2 + Math.random() * 0.2));
            enemy.pathIndex = Math.min(enemy.pathIndex + teleportDistance, this.path.length - 2);
            enemy.progress = 0;
            const newPos = this.path[enemy.pathIndex];
            enemy.r = newPos.r;
            enemy.c = newPos.c;
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 400;
            this.addTextParticle(enemy.c, enemy.r, 'TELEPORT!', "#8b5cf6");
            soundSystem.play('teleport');
          }
          break;
          
        case 'deactivate_towers':
          if (timeSinceLastUse > 300 && Math.random() > 0.96) {
            // Deactivate nearby towers for 3 seconds (180 ticks) - significant impact
            const nearbyTowers = this.towers.filter(t => {
              const dist = Math.sqrt((t.r - enemy.r)**2 + (t.c - enemy.c)**2);
              return dist <= 2; // 2x2 area effect
            });
            
            nearbyTowers.forEach(tower => {
              if (!tower.statusEffects || !tower.statusEffects.find((e: any) => e.effectId === 'stunned')) {
                effectManager.applyEffectToTower(tower, 'stunned', 180); // 3 seconds
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 500; // Long cooldown
            this.addTextParticle(enemy.c, enemy.r, '⚡', "#6366f1");
            // Visual effect for area disable
            for (const t of nearbyTowers) {
              this.addParticle(t.c * 60 + 30, t.r * 60 + 30, 'electric', '#6366f1');
            }
            soundSystem.play('stun');
          }
          break;
          
        case 'area_disable':
          // New ability: Disables towers in a fixed 2x2 tile range
          if (timeSinceLastUse > 400 && Math.random() > 0.95) {
            const affectedTowers = this.towers.filter(t => {
              return Math.abs(t.r - enemy.r) <= 1 && Math.abs(t.c - enemy.c) <= 1;
            });
            
            affectedTowers.forEach(tower => {
              effectManager.applyEffectToTower(tower, 'stunned', 240); // 4 seconds
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 600;
            this.addTextParticle(enemy.c, enemy.r, '💫', "#8b5cf6");
            this.createExplosion(enemy.c * 60 + 30, enemy.r * 60 + 30, '#8b5cf6', 1.5, 'wave');
            soundSystem.play('stun');
          }
          break;
          
        case 'heal_allies':
          if (timeSinceLastUse > 120 && Math.random() > 0.92) {
            // Heal nearby enemies
            const nearbyEnemies = this.enemies.filter(e => {
              if (e.id === enemy.id || e.hp <= 0) return false;
              const dist = Math.sqrt((e.r - enemy.r)**2 + (e.c - enemy.c)**2);
              return dist <= 4;
            });
            
            nearbyEnemies.forEach((e: any) => {
              const heal = e.maxHp * 0.15; // Heal 15% max HP
              e.hp = Math.min(e.hp + heal, e.maxHp);
              // Visual particle only (no text to avoid clutter)
              this.addParticle(e.c * 60 + 30, e.r * 60 + 30, 'heal', '#10b981');
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 150;
            // Show heart emoji instead of text
            this.addTextParticle(enemy.c, enemy.r, '💚', "#10b981");
            soundSystem.play('heal');
          }
          break;
          
        case 'regenerate':
          if (timeSinceLastUse > 60) {
            // Regenerate 1% max HP per tick when below 50% health
            if (enemy.hp < enemy.maxHp * 0.5) {
              enemy.hp = Math.min(enemy.hp + enemy.maxHp * 0.01, enemy.maxHp);
            }
            enemy.lastAbilityUse = this.tickCount;
          }
          break;
          
        case 'explode':
          if (enemy.hp <= enemy.maxHp * 0.1 && Math.random() > 0.98) {
            // Explode when near death, dealing damage to nearby towers
            this.towers.forEach(tower => {
              const dist = Math.sqrt((tower.r - enemy.r)**2 + (tower.c - enemy.c)**2);
              if (dist <= 2 && tower.hp) {
                const damage = enemy.maxHp * 0.3;
                tower.hp = Math.max(0, (tower.hp || tower.maxHp || 100) - damage);
                if (tower.hp <= 0) {
                  this.createExplosion(tower.c * 60 + 30, tower.r * 60 + 30, "#ef4444", 1.5, 'blast');
                }
              }
            });
            enemy.hp = 0; // Kill the bomber
            this.createExplosion(enemy.c * 60 + 30, enemy.r * 60 + 30, enemy.color || "#ef4444", 2.0, 'blast');
            soundSystem.play('explode');
          }
          break;
          
        case 'split':
          if (enemy.hp <= enemy.maxHp * 0.3 && timeSinceLastUse > 500 && Math.random() > 0.96) {
            // Split into 2 smaller enemies when below 30% HP
            for (let i = 0; i < 2; i++) {
              this.enemies.push({
                id: Date.now() + Math.random() + i,
                pathIndex: enemy.pathIndex,
                progress: enemy.progress,
                r: enemy.r, c: enemy.c,
                hp: enemy.maxHp * 0.4,
                maxHp: enemy.maxHp * 0.4,
                baseSpeed: enemy.baseSpeed * 1.2,
                speedMultiplier: 1.0,
                icon: enemy.icon,
                color: enemy.color,
                reward: Math.floor(enemy.reward * 0.3),
                scale: enemy.scale * 0.7,
                frozen: 0,
                xOffset: enemy.xOffset,
                yOffset: enemy.yOffset,
                money: Math.floor(enemy.reward * 0.3),
                damage: 0,
                statusEffects: [],
                name: enemy.name,
                movementType: enemy.movementType || this.getEnemyMovementType(enemy),
                immunities: Array.isArray(enemy.immunities) ? [...enemy.immunities] : [],
              });
            }
            enemy.hp = 0; // Remove original
            enemy.lastAbilityUse = this.tickCount;
            this.addTextParticle(enemy.c, enemy.r, 'SPLIT!', "#10b981");
            soundSystem.play('split');
          }
          break;
          
        case 'charge':
          if (timeSinceLastUse > 200 && Math.random() > 0.94) {
            // Charge forward quickly
            enemy.progress += 0.5; // Move forward 50% of a tile instantly
            if (enemy.progress >= 1.0) {
              enemy.pathIndex++;
              enemy.progress = 0;
              if (enemy.pathIndex < this.path.length - 1) {
                const current = this.path[enemy.pathIndex];
                enemy.r = current.r;
                enemy.c = current.c;
              }
            }
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 250;
            this.addTextParticle(enemy.c, enemy.r, 'CHARGE!', "#f59e0b");
            soundSystem.play('charge');
          }
          break;
          
        case 'slow_towers':
          if (timeSinceLastUse > 200 && Math.random() > 0.93) {
            // Slow down nearby towers for 3 seconds (180 ticks)
            const nearbyTowers = this.towers.filter(t => {
              const dist = Math.sqrt((t.r - enemy.r)**2 + (t.c - enemy.c)**2);
              return dist <= 3;
            });
            
            nearbyTowers.forEach(tower => {
              if (!tower.statusEffects || !tower.statusEffects.find((e: any) => e.effectId === 'firerate_debuff')) {
                effectManager.applyEffectToTower(tower, 'firerate_debuff', 180); // 3 seconds
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 300;
            this.addTextParticle(enemy.c, enemy.r, '🐌', "#60a5fa");
            this.addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'freeze', '#60a5fa');
            soundSystem.play('debuff');
          }
          break;
          
        case 'speed_aura':
          // Speed up nearby allies — refresh every tick, expires after 10 ticks if out of range
          {
            const nearbyAllies = this.enemies.filter(e => {
              if (e.id === enemy.id || e.hp <= 0) return false;
              const dist = Math.sqrt((e.r - enemy.r)**2 + (e.c - enemy.c)**2);
              return dist <= 3;
            });
            nearbyAllies.forEach((ally: any) => {
              ally.speedBuffExpiry = this.tickCount + 10; // Expires 10 ticks after last refresh
            });
            if (this.tickCount % 30 === 0) {
              this.addParticle(enemy.c * 60 + 30, enemy.r * 60 + 30, 'buff', '#fbbf24');
              nearbyAllies.forEach((ally: any) => {
                this.addParticle(ally.c * 60 + 30, ally.r * 60 + 30, 'spark', '#fbbf24');
              });
            }
          }
          break;
          
        case 'shield_allies':
          // Give shield to nearby allies
          if (timeSinceLastUse > 300 && Math.random() > 0.92) {
            const nearbyAllies = this.enemies.filter(e => {
              if (e.id === enemy.id || e.hp <= 0) return false;
              const dist = Math.sqrt((e.r - enemy.r)**2 + (e.c - enemy.c)**2);
              return dist <= 4;
            });
            
            nearbyAllies.slice(0, 3).forEach((ally: any) => {
              if (!ally.shieldHp) {
                ally.shieldHp = ally.maxHp * 0.3; // 30% of max HP as shield
                this.addParticle(ally.c * 60 + 30, ally.r * 60 + 30, 'shockwave', '#60a5fa');
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 400;
            this.addTextParticle(enemy.c, enemy.r, '🛡️', "#60a5fa");
            soundSystem.play('buff');
          }
          break;
          
        case 'attack_towers':
          if (timeSinceLastUse > 100 && Math.random() > 0.90) {
            // Attack nearby towers
            const nearbyTowers = this.towers.filter(t => {
              const dist = Math.sqrt((t.r - enemy.r)**2 + (t.c - enemy.c)**2);
              return dist <= 2; // Close range attack
            });
            
            nearbyTowers.forEach(tower => {
              if (tower.hp && tower.maxHp) {
                const damage = enemy.maxHp * 0.05; // 5% of enemy max HP as damage
                tower.hp = Math.max(0, tower.hp - damage);
                this.addTextParticle(tower.c, tower.r, `-${Math.floor(damage)}`, "#ef4444");
                this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'impact', '#ef4444');
                if (tower.hp <= 0) {
                  this.createExplosion(tower.c * 60 + 30, tower.r * 60 + 30, "#ef4444", 1.5, 'blast');
                  const idx = this.towers.findIndex(t => t.id === tower.id);
                  if (idx !== -1) this.towers.splice(idx, 1);
                }
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 200;
            this.addTextParticle(enemy.c, enemy.r, 'ATTACK!', "#ef4444");
            soundSystem.play('hit');
          }
          break;
      }
    });
  }

  killEnemy(e: any) {
      if(e.dead) return;
      e.dead = true;
      e.hp = 0;

      // Award XP to whatever tower triggered this kill
      if (this.currentAttackingTowerKey) {
        const xpGain = e.isBoss ? 20 : 1;
        this.sessionCardXp[this.currentAttackingTowerKey] =
          (this.sessionCardXp[this.currentAttackingTowerKey] || 0) + xpGain;
      }
      let reward = e.reward || 10;
      
      // Apply theme money bonus
      if (this.currentTheme && this.currentTheme.moneyBonus) {
        reward += this.currentTheme.moneyBonus;
      }
      
      // Apply active buff multipliers
      const buffMultipliers = this.getTowerBuffMultipliers();
      reward *= buffMultipliers.money;
      
      this.money += Math.floor(reward);
      this.totalMoneyEarned += reward;
      this.totalEnemiesKilled++;
      if(Math.random() > 0.5) this.addTextParticle(e.c, e.r, `+$${reward}`, "#fbbf24");
      this.createExplosion(e.c * 60 + 30 + (e.xOffset*40), e.r * 60 + 30 + (e.yOffset*40), e.color, 1);
  }

  // --- ACTIONS (Build/Upgrade/Sell) ---

  requestBuildTower(r: number, c: number, towerKey: string) {
    // Allow placement on empty (0) or path (1), but not on Start/Base/Obstacle
    const cell = this.map[r][c];
    if (cell === 'S' || cell === 'B' || cell === 'X') {
        // Text will be translated in the UI layer if needed
        this.addTextParticle(c, r, "Blocked!", "#ef4444");
        return;
    }
    const tStats = TOWERS[towerKey];
    const canBlockPath = Boolean((tStats as any).canDeployOnPath);
    if (cell === 1 && !canBlockPath) {
        this.addTextParticle(c, r, "Off-path only!", "#f59e0b");
        this.pendingAction = null;
        return;
    }
    const stats = TOWERS[towerKey];
    if (!isDeveloperMode() && this.money < stats.cost) {
        this.addTextParticle(c, r, "Need Funds!", "#ef4444");
        return;
    }
    // DP cost for path-deployable operators
    const dpCost = (stats as any).dpCost as number | undefined;
    if (dpCost && cell === 1 && !isDeveloperMode() && this.deployPoints < dpCost) {
        this.addTextParticle(c, r, `Need ${dpCost} DP!`, "#a78bfa");
        return;
    }
    this.pendingAction = { type: 'BUILD', r, c, towerKey };
  }

  requestUpgradeTower(towerId: number) {
    const tower = this.towers.find(t => t.id === towerId);
    if (!tower) return;
    const upgradeCost = Math.floor(TOWERS[tower.key].cost * 1.5 * tower.level);
    if (!isDeveloperMode() && this.money < upgradeCost) { this.addTextParticle(tower.c, tower.r, "Need Funds!", "#ef4444"); return; }
    this.pendingAction = { type: 'UPGRADE', towerId, cost: upgradeCost };
  }

  requestEarnMoney() { 
      if (this.isTacticalMode) return; 
      this.pendingAction = { type: 'EARN_MONEY' }; 
  }

  cancelAction() { this.pendingAction = null; }

  confirmAction() {
    if (!this.pendingAction) return;
    if (this.pendingAction.type === 'BUILD') {
        const { r, c, towerKey } = this.pendingAction;
        const stats = TOWERS[towerKey];
        
        // Check if this is a support/healer tower
        const isSupportTower = stats.damage === 0 || 
            (stats.type === 'aura' && (stats.description.includes('Heal') || stats.description.includes('heal') || 
             stats.description.includes('buff') || stats.description.includes('Buff') || 
             stats.description.includes('Medic') || stats.description.includes('Support')));
        
        // Check support tower limit
        if (isSupportTower && this.supportTowerCount >= this.maxSupportTowers) {
            this.addTextParticle(c, r, `Max ${this.maxSupportTowers} Support Towers!`, "#ef4444");
            this.pendingAction = null;
            return;
        }
        
        const cmdr = COMMANDERS[this.activeCommanderId];
        const cmdrMods = cmdr?.gameModifiers || {};

        // Apply build cost discount (CIPHER passive)
        let buildCost = stats.cost;
        if (cmdrMods.buildCostDiscount) buildCost = Math.floor(buildCost * (1 - cmdrMods.buildCostDiscount));

        if (!isDeveloperMode()) {
          this.money -= buildCost;
          // Deduct DP for path-deployed melee operators
          const dpCost = (stats as any).dpCost as number | undefined;
          if (dpCost && this.map[r]?.[c] === 1) {
              this.deployPoints = Math.max(0, this.deployPoints - dpCost);
          }
        }

        // Apply HP bonus (TITAN passive)
        let maxHp = stats.maxHp || 100;
        if (cmdrMods.allTowerHpBonus) maxHp = Math.round(maxHp * cmdrMods.allTowerHpBonus);

        // Apply sniper range bonus (GHOST passive)
        let buildRange = stats.range;
        if (cmdrMods.sniperRangeBonus && (stats as any).projectileStyle === 'sniper') {
          buildRange *= cmdrMods.sniperRangeBonus;
        }

        // Store AOE radius bonus on tower for splash use (NOVA passive)
        const aoeBonus = cmdrMods.aoeRadiusBonus;

        // Apply tower card stat bonuses
        const cardData = this.activeCardData[towerKey];
        if (cardData) {
          const l = cardData.level - 1;
          const bondBonus = cardData.bondLevel >= 10 ? 0.25 : cardData.bondLevel >= 8 ? 0.15 : cardData.bondLevel >= 6 ? 0.05 : 0;
          buildRange = buildRange * (1 + l * 0.025 + bondBonus);
          maxHp = Math.round(maxHp * (1 + l * 0.03 + bondBonus));
        }

        const cardDmgMult = cardData ? (1 + (cardData.level - 1) * 0.04) : 1;
        const cardCdDiv = cardData ? (1 + (cardData.level - 1) * 0.02) : 1;

        const newTower: Tower = {
            id: Date.now(),
            r,
            c,
            key: towerKey,
            cooldown: 0,
            level: 1,
            damage: stats.damage * cardDmgMult,
            range: buildRange,
            targetId: null,
            damageCharge: 0,
            baseDamage: stats.damage * cardDmgMult,
            baseRange: buildRange,
            baseCooldown: stats.cooldown / cardCdDiv,
            hp: maxHp,
            maxHp: maxHp,
            angle: 0,
            ...(aoeBonus ? { commanderAoeBonus: aoeBonus } : {}),
        } as Tower & { commanderAoeBonus?: number };
        (newTower as any).def = (stats as any).def ?? 0;
        this.towers.push(newTower);

        // Increment support tower count
        if (isSupportTower) {
            this.supportTowerCount++;
        }

        soundSystem.play('build');
    } else if (this.pendingAction.type === 'UPGRADE') {
        const { towerId, cost } = this.pendingAction;
        const tower = this.towers.find(t => t.id === towerId);
        if (tower) { 
            if (!isDeveloperMode()) {
              this.money -= cost;
            }
            tower.level++;
            // Update stats using upgradeStats multipliers
            const baseStats = TOWERS[tower.key];
            const upgradeStats = baseStats.upgradeStats || {};
            
            // Apply upgrade multipliers (multiply base value by multiplier^level)
            const levelMultiplier = (mult: number) => Math.pow(mult, tower.level - 1);
            
            // Damage upgrade
            if (upgradeStats.damage) {
                tower.baseDamage = baseStats.damage * levelMultiplier(upgradeStats.damage);
            } else {
                tower.baseDamage = baseStats.damage * tower.level; // Fallback
            }
            
            // Range upgrade
            if (upgradeStats.range) {
                tower.baseRange = baseStats.range * levelMultiplier(upgradeStats.range);
            } else {
                tower.baseRange = baseStats.range * (1 + (tower.level - 1) * 0.1); // Fallback
            }
            
            // Cooldown upgrade (lower is better, so we divide)
            if (upgradeStats.cooldown) {
                tower.baseCooldown = baseStats.cooldown / levelMultiplier(upgradeStats.cooldown);
            } else {
                tower.baseCooldown = baseStats.cooldown / (1 + (tower.level - 1) * 0.1); // Fallback
            }
            
            // Update other stats if they have upgrade multipliers
            // Note: These are stored in baseStats, we'll apply them when needed
            
            // Recalculate effective stats with status effects and buffs
            let effectiveDamage = effectManager.getEffectiveTowerDamage(tower);
            let effectiveRange = effectManager.getEffectiveTowerRange(tower);
            
            // Apply theme environmental effects
            if (this.currentTheme) {
                if (this.currentTheme.towerDamageMultiplier) {
                    effectiveDamage *= this.currentTheme.towerDamageMultiplier;
                }
                if (this.currentTheme.towerRangeMultiplier) {
                    effectiveRange *= this.currentTheme.towerRangeMultiplier;
                }
            }
            
            // Apply active buff multipliers
            const buffMultipliers = this.getTowerBuffMultipliers();
            effectiveDamage *= buffMultipliers.damage;
            effectiveRange *= buffMultipliers.range;
            
            tower.damage = effectiveDamage;
            tower.range = effectiveRange;
            soundSystem.play('upgrade'); 
        }
    } else if (this.pendingAction.type === 'EARN_MONEY') {
        this.money += 200; soundSystem.play('sell');
    }
    this.pendingAction = null;
  }

  setTowerTargetPriority(towerId: number, priority: import('./types').TargetPriority) {
    const tower = this.towers.find(t => t.id === towerId);
    if (tower) tower.targetPriority = priority;
  }

  sellTower(towerId: number) {
      const idx = this.towers.findIndex(t => t.id === towerId);
      if(idx !== -1) {
          const t = this.towers[idx];
          const stats = TOWERS[t.key];
          
          // Check if this is a support tower
          const isSupportTower = stats.damage === 0 || 
              (stats.type === 'aura' && (stats.description.includes('Heal') || stats.description.includes('heal') || 
               stats.description.includes('buff') || stats.description.includes('Buff') || 
               stats.description.includes('Medic') || stats.description.includes('Support')));
          
          // Calculate total investment (base cost + upgrade costs)
          let invest = stats.cost;
          for(let i = 1; i < (t.level || 1); i++) {
              invest += Math.floor(stats.cost * 1.5 * i);
          }
          // Sell for 40% of total investment (reduced from 70%)
          this.money += Math.floor(invest * 0.4);
          this.towers.splice(idx, 1);
          
          // Decrement support tower count
          if (isSupportTower) {
              this.supportTowerCount = Math.max(0, this.supportTowerCount - 1);
          }
          
          // Remove mines if this was a mine tower
          if (stats.description.includes('Mine') || stats.description.includes('mine')) {
              this.mines = this.mines.filter(m => {
                  // Find if any mine belongs to this tower (by proximity)
                  const dist = Math.sqrt((m.r - t.r)**2 + (m.c - t.c)**2);
                  return dist > 2; // Keep mines far from this tower
              });
          }
          
          soundSystem.play('sell');
      }
  }

  toggleTacticalMode() { this.isTacticalMode = !this.isTacticalMode; }

  // --- HELPERS ---

  showNotification(text: string, type: 'wave'|'boss'|'alert') {
      this.notification = text;
      this.notificationType = type;
      this.notificationTimer = 180; // 3 Seconds
  }

  addParticle(x: number, y: number, type: any, color: string, scale = 1) {
      const speed = type === 'spark' ? 4 : type === 'debris' ? 3 : type === 'shard' ? 3.5 : 1.5;
      const vx = (Math.random() - 0.5) * speed * 2;
      const vy = (Math.random() - 0.5) * speed * 2;
      const life = type === 'spark' ? 14 : type === 'smoke' ? 25 : type === 'flame' ? 18 : type === 'electric' ? 10 : 20;
      this.particles.push({ id: Math.random(), x, y, vx, vy, life, maxLife: life, color, scale, type });
  }

  addTextParticle(c: number, r: number, text: string, color: string) {
      this.particles.push({ id: Math.random(), x: c * 60 + 30, y: r * 60 + 10, vx: (Math.random() - 0.5) * 0.5, vy: -1.2, life: 50, maxLife: 50, color, text, scale: 1, type: 'text' });
  }

  createExplosion(x: number, y: number, color: string, scale = 1, style?: string) {
      this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 10, maxLife: 10, color, scale, type: 'shockwave' });
      
      // Style-specific hit effects
      if (style === 'fire' || style === 'plasma') {
          for(let i=0; i<8; i++) this.addParticle(x, y, 'flame', color);
          for(let i=0; i<3; i++) this.addParticle(x, y, 'smoke', '#666');
      } else if (style === 'ice') {
          for(let i=0; i<10; i++) this.addParticle(x, y, 'freeze', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 15, maxLife: 15, color, scale: scale*1.5, type: 'ripple' });
      } else if (style === 'poison' || style === 'acid') {
          for(let i=0; i<6; i++) this.addParticle(x, y, 'poison_cloud', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 20, maxLife: 20, color, scale: scale*1.2, type: 'splash' });
      } else if (style === 'crystal') {
          for(let i=0; i<12; i++) this.addParticle(x, y, 'shard', color);
      } else if (style === 'lightning' || style === 'bolt') {
          for(let i=0; i<8; i++) this.addParticle(x, y, 'electric', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 8, maxLife: 8, color, scale: scale*1.3, type: 'beam' });
      } else if (style === 'magic' || style === 'holy' || style === 'orb') {
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 12, maxLife: 12, color, scale: scale*1.4, type: 'magic_burst' });
          for(let i=0; i<6; i++) this.addParticle(x, y, 'star', color);
      } else if (style === 'shadow' || style === 'dark' || style === 'void') {
          for(let i=0; i<5; i++) this.addParticle(x, y, 'shadow_cloud', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 18, maxLife: 18, color, scale: scale*1.6, type: 'void_ring' });
      } else if (style === 'cannonball' || style === 'grenade' || style === 'arc') {
          for(let i=0; i<15; i++) this.addParticle(x, y, 'debris', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 8, maxLife: 8, color, scale: scale*2, type: 'blast' });
      } else if (style === 'rocket' || style === 'missile') {
          for(let i=0; i<10; i++) this.addParticle(x, y, 'flame', '#ff6600');
          for(let i=0; i<8; i++) this.addParticle(x, y, 'spark', color);
          this.particles.push({ id: Math.random(), x, y, vx:0, vy:0, life: 10, maxLife: 10, color, scale: scale*1.8, type: 'blast' });
      } else {
          // Default explosion
          for(let i=0; i<6; i++) this.addParticle(x, y, 'spark', color);
          for(let i=0; i<3; i++) this.addParticle(x, y, 'debris', color);
      }
  }

  updateParticles() {
      this.particles.forEach(p => {
          p.x += (p.vx ?? 0);
          p.y += (p.vy ?? 0);
          // Physics: decelerate sparks/debris, smoke/flame rise and slow
          if (p.type === 'spark' || p.type === 'shard' || p.type === 'debris') {
              p.vx! *= 0.88;
              p.vy! *= 0.88;
          } else if (p.type === 'smoke' || p.type === 'flame' || p.type === 'shadow_cloud' || p.type === 'poison_cloud') {
              p.vx! *= 0.92;
              p.vy! = (p.vy! ?? 0) * 0.9 - 0.08; // Rise upward, decelerate
          } else if (p.type === 'electric') {
              p.vx! *= 0.85;
              p.vy! *= 0.85;
          }
          p.life--;
      });
      // Cap particles for performance
      if (this.particles.length > 500) {
          this.particles = this.particles.slice(this.particles.length - 500);
      }
      this.particles = this.particles.filter(p => p.life > 0);
  }
  
  // Get encountered enemy names for dictionary
  getEncounteredEnemies(): string[] {
    return Array.from(this.encounteredEnemyNames);
  }
  
  // Clear encountered enemies (for new session)
  clearEncounteredEnemies() {
    this.encounteredEnemyNames.clear();
  }
}

export const game = new GameEngine();
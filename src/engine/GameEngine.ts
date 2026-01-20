// src/engine/GameEngine.ts
import { generateMap, ROWS, COLS } from './MapGenerator';
import { TOWERS, ENEMY_TYPES, THEMES } from './data';
import { soundSystem } from './SoundSystem';
import { effectManager } from './EffectManager';
import { applyDamageToEnemy } from './BossAbilities';
import type { Particle, Projectile, Tower } from './types';

type ActionType = { type: 'BUILD', r: number, c: number, towerKey: string } 
  | { type: 'UPGRADE', towerId: number, cost: number } 
  | { type: 'EARN_MONEY' }; 

interface Point { r: number; c: number; }

export class GameEngine {
  // --- VISUALS & NOTIFICATIONS ---
  notification: string | null = null;
  notificationType: 'wave' | 'boss' | 'alert' = 'wave';
  notificationTimer: number = 0;
  baseHitEffect: number = 0; // > 0 triggers red flash on screen

  // --- GAME STATE ---
  map: any[][] = [];
  path: Point[] = [];
  towers: any[] = []; // Using 'any' for flexibility, or use Tower interface
  enemies: any[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];

  money: number = 600;
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
  
  // Support Tower Limits
  maxSupportTowers: number = 5; // Maximum number of support/healer towers
  supportTowerCount: number = 0; // Current count of support towers
  
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
    this.wave = 1;
    this.money = 600;
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
    
    // Initialize theme
    const themeIndex = Math.floor((this.wave - 1) / 10) % THEMES.length;
    this.currentTheme = THEMES[themeIndex];
    
    // Generate Initial Map
    this.map = generateMap(this.wave, 1.0);
    this.recalculatePath(); 
  }

  // --- MAIN LOOP ---
  tick() {
    if (this.isTacticalMode) return; 

    // Handle Visual Timers
    if (this.notificationTimer > 0) {
        this.notificationTimer--;
        if (this.notificationTimer <= 0) this.notification = null;
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
      this.waveCountdown = 240; // 4 seconds break between waves
      
      // Check for buff selection (every 3 waves, starting from wave 3)
      if (this.wave > 1 && (this.wave - 1) % 3 === 0) {
          this.showBuffSelection = true;
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
      const abilityPool: string[] = ['shield', 'slow_towers', 'deactivate_towers', 'regenerate', 'heal_allies'];
      if (isBigBoss) {
          const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
          const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(3, additionalAbilities.length));
          bossAbilities = [...new Set([...bossAbilities, ...selected])];
      } else {
          const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
          const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(2, additionalAbilities.length));
          bossAbilities = [...new Set([...bossAbilities, ...selected])];
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
          isInvisible: bossAbilities.includes('invisible') || false,
          isFlying: bossAbilities.includes('fly') || false,
          isBurrowed: bossAbilities.includes('burrow') || false,
          bossType: bossType,
          bossShieldHp: bossAbilities.includes('shield') ? (isBigBoss ? hp * 0.5 : hp * 0.3) : undefined,
          statusEffects: []
      });
  }

  // --- MAP & PATH ---

  changeMap() {
      // 1. Refund Towers (70% value)
      let refundTotal = 0;
      this.towers.forEach(t => {
          const cost = TOWERS[t.key].cost;
          refundTotal += Math.floor(cost * (t.level || 1) * 0.7);
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

    this.enemies.push({ 
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
        isInvisible: (stats.abilities && stats.abilities.includes('invisible')) || false,
        isFlying: (stats.abilities && stats.abilities.includes('fly')) || false,
        isBurrowed: (stats.abilities && stats.abilities.includes('burrow')) || false,
        bossType: undefined,
        bossShieldHp: undefined,
        statusEffects: []
    });
  }

  updateEnemies() {
     this.enemies.forEach(enemy => {
        // Update status effects (decrease duration, apply tick damage/healing)
        effectManager.updateEnemyEffects(enemy);
        
        // Calculate effective speed based on status effects
        let currentSpeed = effectManager.getEffectiveEnemySpeed(enemy, enemy.baseSpeed);
        
        // Apply theme environmental effects to enemy speed
        if (this.currentTheme && this.currentTheme.enemySpeedMultiplier) {
          currentSpeed *= this.currentTheme.enemySpeedMultiplier;
        }
        
        // Apply active buff multipliers to enemy speed (for already spawned enemies)
        const enemyBuffs = this.getEnemyBuffMultipliers();
        currentSpeed *= enemyBuffs.speed;
        
        // Move along path
        enemy.progress += currentSpeed;
        if (enemy.progress >= 1.0) {
            enemy.pathIndex++; 
            enemy.progress = 0;
            
            // Check Base Hit
            if (enemy.pathIndex >= this.path.length - 1) {
                // Boss deals more damage based on boss type
                const damage = enemy.bossType === 'big' ? 8 : (enemy.bossType === 'mini' ? 3 : 1);
                this.lives -= damage;
                this.baseHitEffect = 15; // Trigger Red Flash
                enemy.hp = 0; 
                enemy.escaped = true; 
                soundSystem.play('hit_base'); // Assuming sound exists
            } else {
                 const current = this.path[enemy.pathIndex];
                 enemy.r = current.r; 
                 enemy.c = current.c;
            }
        }
        
        // Check for mine hits
        this.mines.forEach((mine, mineIndex) => {
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
        
        // 1. Eco Tower Logic (if we add eco type later)
        if (false) { // Eco towers not implemented yet
             if (tower.cooldown > 0) tower.cooldown--;
             else {
                 const amount = 20 * tower.level;
                 this.money += amount;
                 this.addTextParticle(tower.c, tower.r, `+$${amount}`, "#10b981");
                 tower.cooldown = 300;
             }
             return;
        }
        
        // 2. Target Finding (use effective range)
        let target = null;
        let minD = Infinity;
        for (const e of this.enemies) {
            const dist = Math.sqrt((e.r - tower.r)**2 + (e.c - tower.c)**2);
            if (dist <= tower.range) {
                 if (dist < minD) { minD = dist; target = e; }
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
        effectiveCooldown /= buffMultipliers.attackSpeed; // Faster attack = lower cooldown
        
        if (tower.cooldown > 0) tower.cooldown--;
        
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
        
        // Healer/Support towers - heal/buff nearby towers instead of attacking
        if (stats.damage === 0 || (stats.type === 'aura' && (stats.description.includes('Heal') || stats.description.includes('heal') || stats.description.includes('buff') || stats.description.includes('Buff') || stats.description.includes('Medic') || stats.description.includes('Support')))) {
            if (tower.cooldown <= 0) {
                tower.cooldown = effectiveCooldown;
                // Find nearby towers to heal/buff
                for (const nearbyTower of this.towers) {
                    if (nearbyTower.id === tower.id) continue;
                    const dist = Math.sqrt((nearbyTower.r - tower.r)**2 + (nearbyTower.c - tower.c)**2);
                    if (dist <= tower.range) {
                        // Heal towers - green + sign effect
                        if (stats.description.includes('Heal') || stats.description.includes('heal') || stats.description.includes('Medic')) {
                            const healAmount = 5;
                            nearbyTower.hp = Math.min((nearbyTower.maxHp || 100), (nearbyTower.hp || 100) + healAmount);
                            // Green + sign particle
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'heal', '#10b981');
                            this.addTextParticle(nearbyTower.c, nearbyTower.r, `+${healAmount}`, '#10b981');
                            // Visual + sign on tower
                            this.particles.push({
                                id: Math.random(),
                                x: nearbyTower.c * 60 + 30,
                                y: nearbyTower.r * 60 + 30,
                                vx: 0,
                                vy: -1,
                                life: 30,
                                maxLife: 30,
                                color: '#10b981',
                                scale: 1.5,
                                type: 'heal',
                                text: '+' // Show + sign
                            });
                        }
                        // Buff towers - only apply to towers, not enemies
                        if (stats.description.includes('Speed') || stats.description.includes('speed') || tower.key === 'SPEED_BOOSTER') {
                            effectManager.applyEffectToTower(nearbyTower, 'haste');
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#fbbf24');
                        } else if (stats.description.includes('Damage') || stats.description.includes('damage') || stats.description.includes('Amplifier') || tower.key === 'DAMAGE_AMPLIFIER') {
                            effectManager.applyEffectToTower(nearbyTower, 'power_boost');
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#ef4444');
                        } else if (stats.description.includes('Frost') || stats.description.includes('frost') || tower.key === 'FROST_ENHANCER') {
                            effectManager.applyEffectToTower(nearbyTower, 'frost_aura');
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#bfdbfe');
                        } else if (stats.description.includes('Venom') || stats.description.includes('venom') || stats.description.includes('Poison') || tower.key === 'VENOM_ENHANCER') {
                            effectManager.applyEffectToTower(nearbyTower, 'venom_aura');
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#14b8a6');
                        } else if (stats.description.includes('buff') || stats.description.includes('Buff') || stats.description.includes('Command') || stats.description.includes('Support')) {
                            // Generic buff - apply damage boost
                            effectManager.applyEffectToTower(nearbyTower, 'rage');
                            this.addParticle(nearbyTower.c * 60 + 30, nearbyTower.r * 60 + 30, 'buff', '#fbbf24');
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
                // Continuous Laser
                tower.targetId = target.id;
                const damage = tower.damage * 0.1;
                applyDamageToEnemy(target, damage);
                // Apply freeze effect for ice/beam towers
                if (stats.projectileStyle === 'ice' || stats.projectileStyle === 'lightning') {
                    effectManager.applyEffectToEnemy(target, 'frostbite');
                }
                if (target.hp <= 0) this.killEnemy(target);
            } else if (tower.cooldown <= 0) {
                // Shoot (reset cooldown to effective cooldown)
                tower.cooldown = effectiveCooldown;
                
                // Instant hit for sniper/lightning projectiles
                if (stats.projectileStyle === 'sniper' || stats.projectileStyle === 'lightning') {
                    // Instant Hit (Lightning/Sniper)
                    applyDamageToEnemy(target, tower.damage);
                    if (stats.projectileStyle === 'lightning') {
                        this.addParticle(target.c*60+30, target.r*60+30, 'electric', stats.color);
                    }
                    
                    // Visual Projectile
                    this.projectiles.push({
                        id: Math.random(), x: tower.c, y: tower.r, tx: target.c, ty: target.r,
                        startX: tower.c, startY: tower.r,
                        targetId: target.id, color: stats.color, life: 10, maxLife: 10,
                        style: stats.projectileStyle || 'dot', damage: 0, speed: 0, progress: 0,
                        type: 'arrow'
                    });

                    if(target.hp <= 0) this.killEnemy(target);
                    soundSystem.play('shoot');

                } else if (stats.type === 'spread') {
                    // Spread/Shotgun: Fire multiple projectiles in an arc
                    const pelletCount = stats.multiTarget || 5; // Default to 5 pellets if not specified
                    const spreadAngle = 40; // Wider spread angle for visibility
                    const baseAngle = Math.atan2(
                        (target.r + (target.yOffset || 0)) - tower.r,
                        (target.c + (target.xOffset || 0)) - tower.c
                    );
                    
                    // Calculate distance to target
                    const distance = Math.sqrt(
                        Math.pow((target.c + (target.xOffset || 0)) - tower.c, 2) +
                        Math.pow((target.r + (target.yOffset || 0)) - tower.r, 2)
                    );
                    
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
                        
                        // Create projectile - spread pellets don't home, they go straight
                        this.projectiles.push({
                            id: Math.random(),
                            x: tower.c, 
                            y: tower.r,
                            startX: tower.c, 
                            startY: tower.r,
                            tx: pelletTx,
                            ty: pelletTy,
                            targetId: undefined, // No homing for spread pellets - they go straight
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
                        firingTowerId: tower.id
                    });
                    soundSystem.play('shoot');
                    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
                } else {
                    // Traveling Projectile
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
                        damage: tower.damage, 
                        speed: stats.projectileSpeed || 0.12, // Reduced default speed for better visibility
                        splash: stats.areaRadius,
                        progress: 0,
                        type: 'arrow'
                    });
                    soundSystem.play('shoot');
                    // Use tower color for muzzle flash instead of white, with reduced intensity for fast-firing towers
                    const muzzleColor = stats.cooldown < 15 ? stats.color : '#fff';
                    this.addParticle(tower.c * 60 + 30, tower.r * 60 + 30, 'muzzle', muzzleColor);
                }
                
                // Apply special abilities
                if (stats.specialAbility) {
                    if (stats.specialAbility === 'stun' && stats.stunDuration) {
                        effectManager.applyEffectToEnemy(target, 'stunned');
                    } else if (stats.specialAbility === 'slow' && stats.slowFactor) {
                        effectManager.applyEffectToEnemy(target, 'frostbite');
                    } else if (stats.specialAbility === 'pull' && stats.pullStrength) {
                        // Pull effect handled in updateEnemies via status effects
                        effectManager.applyEffectToEnemy(target, 'battle_surge'); // Use existing effect or create new
                    } else if (stats.specialAbility === 'aoe' && stats.areaRadius) {
                        // AOE damage to nearby enemies
                        for (const e of this.enemies) {
                            if (e.id === target.id) continue;
                            const dist = Math.sqrt((e.r - target.r)**2 + (e.c - target.c)**2);
                            if (dist <= stats.areaRadius) {
                                applyDamageToEnemy(e, tower.damage * 0.5); // 50% splash damage
                                if (e.hp <= 0) this.killEnemy(e);
                            }
                        }
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
        // Visuals fade out
        if (p.style === 'lightning' || p.style === 'laser') {
            p.life!--;
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
                let hitEnemy = false;
                this.enemies.forEach(enemy => {
                    if (hitEnemy) return; // Already hit one enemy
                    const enemyX = enemy.c + (enemy.xOffset || 0);
                    const enemyY = enemy.r + (enemy.yOffset || 0);
                    const dist = Math.sqrt((enemyX - p.x)**2 + (enemyY - p.y)**2);
                    if (dist < 0.3 && p.progress > 0.1) { // Hit radius, must have traveled some distance
                        // Hit enemy
                        applyDamageToEnemy(enemy, p.damage);
                        if (enemy.hp <= 0) this.killEnemy(enemy);
                        // Create hit effect
                        this.createExplosion(p.x * 60 + 30, p.y * 60 + 30, p.color, 0.5, 'impact');
                        hitEnemy = true;
                        p.life = 0; // Remove projectile
                    }
                });
                
                // If reached target position without hitting, remove
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
              if (dist <= p.splash!) {
                  applyDamageToEnemy(e, p.damage);
                  if (e.hp <= 0) this.killEnemy(e);
              }
          });
      } else {
          // Single Target
          const e = this.enemies.find(en => en.id === p.targetId);
          if (e) {
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
          if (timeSinceLastUse > 250 && Math.random() > 0.97) {
            // Deactivate nearby towers for 3 seconds (180 ticks)
            const nearbyTowers = this.towers.filter(t => {
              const dist = Math.sqrt((t.r - enemy.r)**2 + (t.c - enemy.c)**2);
              return dist <= 3;
            });
            
            nearbyTowers.forEach(tower => {
              if (!tower.statusEffects || !tower.statusEffects.find((e: any) => e.effectId === 'stunned')) {
                effectManager.applyEffectToTower(tower, 'stunned', 180);
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 300;
            this.addTextParticle(enemy.c, enemy.r, 'DISABLE!', "#ef4444");
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
              this.addTextParticle(e.c, e.r, `+${Math.floor(heal)}`, "#10b981");
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 150;
            this.addTextParticle(enemy.c, enemy.r, 'HEAL!', "#10b981");
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
                statusEffects: []
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
          if (timeSinceLastUse > 150 && Math.random() > 0.94) {
            // Slow down nearby towers
            const nearbyTowers = this.towers.filter(t => {
              const dist = Math.sqrt((t.r - enemy.r)**2 + (t.c - enemy.c)**2);
              return dist <= 4;
            });
            
            nearbyTowers.forEach(tower => {
              if (!tower.statusEffects || !tower.statusEffects.find((e: any) => e.effectId === 'firerate_debuff')) {
                effectManager.applyEffectToTower(tower, 'firerate_debuff', 240); // 4 seconds
              }
            });
            
            enemy.lastAbilityUse = this.tickCount;
            enemy.abilityCooldown = 200;
            this.addTextParticle(enemy.c, enemy.r, 'SLOW!', "#3b82f6");
            soundSystem.play('debuff');
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
    const stats = TOWERS[towerKey];
    if (this.money < stats.cost) { 
        this.addTextParticle(c, r, "Need Funds!", "#ef4444"); 
        return; 
    }
    this.pendingAction = { type: 'BUILD', r, c, towerKey };
  }

  requestUpgradeTower(towerId: number) {
    const tower = this.towers.find(t => t.id === towerId);
    if (!tower) return;
    const upgradeCost = Math.floor(TOWERS[tower.key].cost * 1.5 * tower.level);
    if (this.money < upgradeCost) { this.addTextParticle(tower.c, tower.r, "Need Funds!", "#ef4444"); return; }
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
        
        this.money -= stats.cost;
        const maxHp = stats.maxHp || 100;
        const newTower: Tower = { 
            id: Date.now(), 
            r, 
            c, 
            key: towerKey, 
            cooldown: 0, 
            level: 1, 
            damage: stats.damage, 
            range: stats.range,
            targetId: null,
            damageCharge: 0,
            baseDamage: stats.damage,
            baseRange: stats.range,
            baseCooldown: stats.cooldown,
            hp: maxHp,
            maxHp: maxHp,
            angle: 0
        };
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
            this.money -= cost; 
            tower.level++;
            // Update damage and range to reflect new level
            const baseStats = TOWERS[tower.key];
            tower.baseDamage = baseStats.damage * tower.level;
            tower.baseRange = baseStats.range * (1 + (tower.level - 1) * 0.1);
            tower.baseCooldown = baseStats.cooldown / (1 + (tower.level - 1) * 0.1);
            
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
          
          let v = stats.cost; 
          this.money += Math.floor(v * 0.7);
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

  addParticle(x: number, y: number, type: any, color: string) {
      this.particles.push({ id: Math.random(), x, y, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2, life: 20, maxLife: 20, color, scale: 1, type });
  }

  addTextParticle(c: number, r: number, text: string, color: string) {
      this.particles.push({ id: Math.random(), x: c * 60 + 30, y: r * 40, vx: 0, vy: -1, life: 40, maxLife: 40, color, text, scale: 1, type: 'text' });
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
          p.life--; 
      });
      this.particles = this.particles.filter(p => p.life > 0);
  }
}

export const game = new GameEngine();
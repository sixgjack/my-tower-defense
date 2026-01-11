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
    this.waveInProgress = false;
    this.waveCountdown = 180;
    this.isGameOver = false;
    this.totalMoneyEarned = 0;
    this.totalEnemiesKilled = 0;
    
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
          const isMiniBoss = this.wave % 5 === 0 && !isBigBoss;
          if (isBigBoss) {
              this.showNotification("⚠️ BIG BOSS INCOMING ⚠️", 'boss');
              soundSystem.play('boss');
          } else if (isMiniBoss) {
              this.showNotification("⚠️ MINI BOSS INCOMING ⚠️", 'boss');
              soundSystem.play('boss');
          } else {
              this.showNotification(`WAVE ${this.wave}`, 'wave');
          }
      }

      this.enemiesRemainingToSpawn = 5 + Math.floor(this.wave * 1.5);
      this.waveInProgress = true;
  }

  endWave() {
      this.waveInProgress = false;
      this.wave++;
      this.waveCountdown = 240; // 4 seconds break between waves
      // Optional: soundSystem.play('wave_clear');
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
    
    // Boss Logic - mini-boss every 5 waves, big boss every 10 waves
    const isBigBossWave = this.wave % 10 === 0 && this.enemiesRemainingToSpawn === 0;
    const isMiniBossWave = this.wave % 5 === 0 && this.wave % 10 !== 0 && this.enemiesRemainingToSpawn === 0;
    const isBossWave = isBigBossWave || isMiniBossWave;
    
    // Boss spawning logic:
    // - Mini-bosses ONLY on waves 5, 15, 25... (5n waves, not 10n)
    // - Big bosses ONLY on waves 10, 20, 30... (10n waves)
    // - On non-boss waves, regular enemies only (no bosses)
    // - At higher waves (wave > 20), previous bosses may randomly appear with low chance (5%)
    
    let availableTypes: typeof ENEMY_TYPES;
    
    if (isBossWave) {
      // Boss waves: only spawn the appropriate boss type
      if (isBigBossWave) {
        // Big boss wave: only big boss types (wave 10, 20, 30...)
        availableTypes = ENEMY_TYPES.filter(t => t.isBoss === true);
      } else {
        // Mini-boss wave: only mini-boss types (wave 5, 15, 25...)
        // For now, use all boss types (can be refined later to distinguish mini vs big)
        availableTypes = ENEMY_TYPES.filter(t => t.isBoss === true);
      }
    } else {
      // Non-boss waves: regular enemies only
      // At wave > 20, 5% chance for a previous boss to randomly appear
      const allowRandomBoss = this.wave > 20 && Math.random() < 0.05;
      
      availableTypes = ENEMY_TYPES.filter(t => {
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
    }
    
    if (availableTypes.length === 0) availableTypes = ENEMY_TYPES.filter(t => !t.minWave || t.minWave <= this.wave);
    
    const typeIdx = Math.floor(Math.random() * availableTypes.length);
    const stats = availableTypes[typeIdx];
    const isBoss = stats.isBoss || isBossWave;
    
    // Boss HP multipliers: mini-boss = 3x, big boss = 8x
    const bossHpMultiplier = isBigBossWave ? 8 : (isMiniBossWave ? 3 : 1);
    let hp = (isBoss ? stats.hp * bossHpMultiplier : stats.hp) * diff;
    // Boss money bonus: base reward * boss multiplier * moneyBonus (if exists)
    const baseReward = (isBoss ? stats.reward * bossHpMultiplier : stats.reward);
    const moneyBonus = (isBoss && stats.moneyBonus) ? stats.moneyBonus : 1.0;
    const reward = baseReward * moneyBonus;
    
    // Apply theme environmental effects to enemy HP
    if (this.currentTheme && this.currentTheme.enemyHpMultiplier) {
      hp *= this.currentTheme.enemyHpMultiplier;
    }
    
    // Determine boss type
    const bossType = isBigBossWave ? 'big' : (isMiniBossWave ? 'mini' : undefined);
    
    // Generate boss abilities based on difficulty
    let bossAbilities: string[] = stats.abilities ? [...stats.abilities] : [];
    if (isBossWave) {
      // Big bosses get more abilities
      const abilityPool: string[] = ['shield', 'slow_towers', 'deactivate_towers', 'regenerate', 'heal_allies'];
      if (isBigBossWave) {
        // Big boss gets 2-3 additional abilities
        const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
        const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(3, additionalAbilities.length));
        bossAbilities = [...new Set([...bossAbilities, ...selected])];
      } else if (isMiniBossWave) {
        // Mini boss gets 1-2 additional abilities
        const additionalAbilities = abilityPool.filter(a => !bossAbilities.includes(a));
        const selected = additionalAbilities.sort(() => Math.random() - 0.5).slice(0, Math.min(2, additionalAbilities.length));
        bossAbilities = [...new Set([...bossAbilities, ...selected])];
      }
    }
    
    // Boss speed multiplier (bosses move slower)
    const bossSpeedMultiplier = isBigBossWave ? 0.5 : (isMiniBossWave ? 0.7 : 1.0);
    // Overall speed reduction: enemies move slower (reduced from 0.05 to 0.03)
    const baseSpeed = 0.03 * stats.speed * bossSpeedMultiplier;

    this.enemies.push({ 
        id: Date.now() + Math.random(), 
        pathIndex: 0, progress: 0.0, 
        r: this.path[0].r, c: this.path[0].c, 
        hp, maxHp: hp, 
        baseSpeed: baseSpeed, 
        speedMultiplier: 1.0,
        icon: isBossWave ? (isBigBossWave ? "👹" : "👺") : stats.icon, 
        color: stats.color, 
        reward: reward, 
        scale: isBigBossWave ? 2.0 : (isMiniBossWave ? 1.5 : 1.0), 
        frozen: 0,
        xOffset: 0,
        yOffset: 0,
        money: reward,
        damage: isBossWave ? bossHpMultiplier : 0, // Boss damage = HP multiplier (3 for mini, 8 for big)
        abilities: bossAbilities,
        abilityCooldown: stats.abilityCooldown || (isBossWave ? 200 : 0),
        lastAbilityUse: -999,
        isInvisible: bossAbilities.includes('invisible') || false,
        isFlying: bossAbilities.includes('fly') || false,
        isBurrowed: bossAbilities.includes('burrow') || false,
        bossType: bossType,
        bossShieldHp: bossAbilities.includes('shield') ? (isBigBossWave ? hp * 0.5 : hp * 0.3) : undefined,
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
        if (!tower.baseDamage) tower.baseDamage = tower.damage;
        if (!tower.baseRange) tower.baseRange = tower.range;
        if (!tower.baseCooldown) tower.baseCooldown = stats.cooldown;
        
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
        
        if (tower.cooldown > 0) tower.cooldown--;
        
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

        p.progress += p.speed;
        
        // Update target position for all projectiles (homing behavior)
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
      
      this.money += reward;
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
            // Recalculate effective stats with status effects
            tower.damage = effectManager.getEffectiveTowerDamage(tower);
            tower.range = effectManager.getEffectiveTowerRange(tower);
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
          let v = TOWERS[t.key].cost; 
          this.money += Math.floor(v * 0.7);
          this.towers.splice(idx, 1);
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
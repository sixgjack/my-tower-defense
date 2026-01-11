// src/engine/GameEngine.ts
import { generateMap, ROWS, COLS } from './MapGenerator';
import { TOWERS, ENEMY_TYPES, THEMES } from './data';
import { soundSystem } from './SoundSystem';
import type { Particle, ActionType, Projectile, Tower, Enemy } from './types'; 

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
    
    // Generate Initial Map
    this.map = generateMap(this.wave);
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
          this.showNotification(`SECTOR ${Math.ceil(this.wave/10)}: ${THEMES[themeIndex].name}`, 'alert');
      } 
      else {
          const isBoss = this.wave % 5 === 0;
          if (isBoss) {
              this.showNotification("⚠️ BOSS INCOMING ⚠️", 'boss');
              soundSystem.play('boss'); // Assuming sound exists
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
    const typeIdx = (this.wave - 1) % ENEMY_TYPES.length;
    const stats = ENEMY_TYPES[typeIdx];
    
    // Boss Logic
    const isBoss = this.wave % 5 === 0 && this.enemiesRemainingToSpawn === 0; // Boss is last
    
    const hp = (isBoss ? stats.hp * 5 : stats.hp) * diff;
    const reward = (isBoss ? stats.reward * 5 : stats.reward);

    this.enemies.push({ 
        id: Date.now() + Math.random(), 
        pathIndex: 0, progress: 0.0, 
        r: this.path[0].r, c: this.path[0].c, 
        hp, maxHp: hp, 
        baseSpeed: 0.05 * stats.speed, 
        icon: isBoss ? "👹" : stats.icon, 
        color: stats.color, 
        reward: reward, 
        scale: isBoss ? 1.5 : 1.0, 
        frozen: 0 
    });
  }

  updateEnemies() {
     this.enemies.forEach(enemy => {
        let currentSpeed = enemy.baseSpeed;
        if (enemy.frozen > 0) { enemy.frozen--; currentSpeed *= 0.5; }
        
        // Move along path
        enemy.progress += currentSpeed;
        if (enemy.progress >= 1.0) {
            enemy.pathIndex++; 
            enemy.progress = 0;
            
            // Check Base Hit
            if (enemy.pathIndex >= this.path.length - 1) {
                this.lives -= 1;
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
    
    if (this.lives <= 0) {
        this.showNotification("GAME OVER", 'boss');
        this.isTacticalMode = true; // Pause game
    }
  }

  updateTowers() {
    this.towers.forEach(tower => {
        const stats = TOWERS[tower.key];
        
        // 1. Eco Tower Logic
        if (stats.type === 'eco') {
             if (tower.cooldown > 0) tower.cooldown--;
             else {
                 const amount = 20 * tower.level;
                 this.money += amount;
                 this.addTextParticle(tower.c, tower.r, `+$${amount}`, "#10b981");
                 tower.cooldown = 300;
             }
             return;
        }
        
        // 2. Target Finding
        let target = null;
        let minD = Infinity;
        for (const e of this.enemies) {
            const dist = Math.sqrt((e.r - tower.r)**2 + (e.c - tower.c)**2);
            if (dist <= tower.range) {
                 if (dist < minD) { minD = dist; target = e; }
            }
        }

        // 3. Attack Logic
        if (tower.cooldown > 0) tower.cooldown--;
        
        if (target) {
            if (stats.type === 'beam') {
                // Continuous Laser
                tower.targetId = target.id;
                target.hp -= (tower.damage * 0.1);
                if(stats.effect === 'freeze') target.frozen = 5;
                if (target.hp <= 0) this.killEnemy(target);
            } else if (tower.cooldown <= 0) {
                // Shoot
                tower.cooldown = stats.cooldown / (1 + (tower.level * 0.1));
                
                if (stats.type === 'instant') {
                    // Instant Hit (Lightning/Sniper)
                    target.hp -= tower.damage;
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
                  e.hp -= p.damage;
                  if (e.hp <= 0) this.killEnemy(e);
              }
          });
      } else {
          // Single Target
          const e = this.enemies.find(en => en.id === p.targetId);
          if (e) {
              e.hp -= p.damage;
              if (e.hp <= 0) this.killEnemy(e);
          }
      }
  }

  killEnemy(e: any) {
      if(e.dead) return;
      e.dead = true; 
      e.hp = 0;
      const reward = e.reward || 10;
      this.money += reward;
      if(Math.random() > 0.5) this.addTextParticle(e.c, e.r, `+$${reward}`, "#fbbf24");
      this.createExplosion(e.c * 60 + 30 + (e.xOffset*40), e.r * 60 + 30 + (e.yOffset*40), e.color, 1);
  }

  // --- ACTIONS (Build/Upgrade/Sell) ---

  requestBuildTower(r: number, c: number, towerKey: string) {
    if (this.map[r][c] !== 0) {
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
        this.towers.push({ id: Date.now(), r, c, key: towerKey, cooldown: 0, level: 1, damage: stats.damage, range: stats.range });
        soundSystem.play('build');
    } else if (this.pendingAction.type === 'UPGRADE') {
        const { towerId, cost } = this.pendingAction;
        const tower = this.towers.find(t => t.id === towerId);
        if (tower) { 
            this.money -= cost; 
            tower.level++;
            // Update damage and range to reflect new level
            const baseStats = TOWERS[tower.key];
            tower.damage = baseStats.damage * tower.level;
            tower.range = baseStats.range * (1 + (tower.level - 1) * 0.1);
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
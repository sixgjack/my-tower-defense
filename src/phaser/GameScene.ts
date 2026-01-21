import Phaser from 'phaser';
import { game } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import { effectManager } from '../engine/EffectManager';

const TILE = 64; 
const SPRITE_SIZE = 128; // Resolution for generated icons

export class GameScene extends Phaser.Scene {
  // Visual Layers
  private towerGroup!: Phaser.GameObjects.Group;
  private enemyContainer!: Phaser.GameObjects.Container;
  private projectileGraphics!: Phaser.GameObjects.Graphics;
  private beamGraphics!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private auraGraphics!: Phaser.GameObjects.Graphics;
  
  // Ghost (Drag & Drop Visuals)
  private ghostContainer!: Phaser.GameObjects.Container;
  private ghostRange!: Phaser.GameObjects.Graphics;
  private ghostSprite!: Phaser.GameObjects.Sprite;
  
  // Animation time
  private animTime: number = 0;

  constructor() {
    super('GameScene');
  }

  preload() {
    // Generate icons efficiently at startup
    this.createVectorAssets();
  }

  create() {
    // 1. Background
    this.cameras.main.setBackgroundColor('#020617'); 

    // 2. Draw Grid (Immediate Mode)
    this.drawGridImmediate();

    // 3. Setup Layers (order matters for depth)
    this.auraGraphics = this.add.graphics();
    this.auraGraphics.setDepth(5);
    
    this.towerGroup = this.add.group(); 
    
    this.enemyContainer = this.add.container(0, 0);
    this.enemyContainer.setDepth(20);
    
    this.beamGraphics = this.add.graphics();
    this.beamGraphics.setDepth(25);
    
    this.projectileGraphics = this.add.graphics(); 
    this.projectileGraphics.setDepth(30);
    
    this.particleGraphics = this.add.graphics();
    this.particleGraphics.setDepth(35);
    
    // 4. Setup Ghost (Hidden by default)
    this.createGhost();

    // 5. Handle Resizing
    this.scale.on('resize', this.resizeCamera, this);
    this.resizeCamera(this.scale.gameSize);
  }

  update(_time: number, delta: number) {
    this.animTime += delta;
    
    // 1. Game Logic
    const speed = this.registry.get('speed') || 1;
    for(let i=0; i<Math.floor(speed); i++) game.tick();

    // 2. Sync Visuals
    this.drawAuras();
    this.syncTowers();
    this.syncEnemies();
    this.drawBeams();
    this.drawProjectiles();
    this.drawParticles();

    // 3. Update Ghost
    this.updateGhost();
  }

  // --- 1. GRID DRAWING ---
  drawGridImmediate() {
    const g = this.add.graphics();
    g.setDepth(0);
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const cell = game.map[r] ? game.map[r][c] : 0;

        // Fill based on cell type
        if (cell === 1) { // Path
          g.fillStyle(0x1e293b, 0.8);
          g.fillRect(x, y, TILE, TILE);
        } else if (cell === 'S') { // Start
          g.fillStyle(0xdc2626, 0.4);
          g.fillRect(x, y, TILE, TILE);
        } else if (cell === 'B') { // Base
          g.fillStyle(0x2563eb, 0.4);
          g.fillRect(x, y, TILE, TILE);
        } else if (cell === 'X') { // Obstacle
          g.fillStyle(0x475569, 0.5);
          g.fillRect(x, y, TILE, TILE);
        } else { // Empty grass
          g.fillStyle(0x0f172a, 0.3);
          g.fillRect(x, y, TILE, TILE);
        }
        
        // Grid lines
        g.lineStyle(1, 0x334155, 0.3);
        g.strokeRect(x, y, TILE, TILE);
      }
    }
    
    // Draw path arrows
    this.drawPathArrows(g);
  }
  
  drawPathArrows(g: Phaser.GameObjects.Graphics) {
    if (game.path.length < 2) return;
    
    g.lineStyle(2, 0x60a5fa, 0.4);
    
    for (let i = 0; i < game.path.length - 1; i++) {
      const curr = game.path[i];
      const next = game.path[i + 1];
      
      const x1 = curr.c * TILE + TILE / 2;
      const y1 = curr.r * TILE + TILE / 2;
      const x2 = next.c * TILE + TILE / 2;
      const y2 = next.r * TILE + TILE / 2;
      
      // Draw dashed line
      const segments = 4;
      for (let s = 0; s < segments; s += 2) {
        const t1 = s / segments;
        const t2 = (s + 1) / segments;
        g.lineBetween(
          x1 + (x2 - x1) * t1,
          y1 + (y2 - y1) * t1,
          x1 + (x2 - x1) * t2,
          y1 + (y2 - y1) * t2
        );
      }
    }
  }

  // --- 2. AURA EFFECTS FOR SUPPORT TOWERS ---
  drawAuras() {
    this.auraGraphics.clear();
    
    game.towers.forEach(t => {
      const stats = TOWERS[t.key];
      if (!stats) return;
      
      const x = t.c * TILE + TILE / 2;
      const y = t.r * TILE + TILE / 2;
      
      // Support tower auras
      const isSupportTower = stats.damage === 0 || 
        (stats.type === 'aura' && (
          stats.description.includes('Heal') || 
          stats.description.includes('buff') || 
          stats.description.includes('Amplifier') ||
          stats.description.includes('Enhancer') ||
          stats.description.includes('Extender') ||
          stats.description.includes('Slow')
        ));
      
      if (isSupportTower) {
        const range = t.range * TILE;
        const pulse = Math.sin(this.animTime / 500) * 0.2 + 0.8;
        
        // Determine color based on tower type
        let color = 0x3b82f6; // Default blue
        if (t.key === 'DAMAGE_BUFF' || stats.description.includes('Damage')) color = 0xef4444;
        else if (t.key === 'SPEED_BUFF' || stats.description.includes('Speed')) color = 0xfbbf24;
        else if (t.key === 'RANGE_BUFF' || stats.description.includes('Range')) color = 0x3b82f6;
        else if (t.key === 'HEALER' || t.key === 'BASIC_HEAL' || stats.description.includes('Heal')) color = 0x10b981;
        else if (stats.description.includes('Slow')) color = 0x60a5fa;
        else if (stats.description.includes('Weaken')) color = 0xa855f7;
        
        // Draw pulsing aura
        this.auraGraphics.lineStyle(2, color, 0.3 * pulse);
        this.auraGraphics.strokeCircle(x, y, range);
        this.auraGraphics.fillStyle(color, 0.05 * pulse);
        this.auraGraphics.fillCircle(x, y, range);
      }
      
      // Status effect aura on tower
      const auraColor = effectManager.getTowerAuraColor(t);
      if (auraColor) {
        const color = parseInt(auraColor.replace('#', '0x'));
        const pulse = Math.sin(this.animTime / 300) * 0.3 + 0.7;
        
        this.auraGraphics.lineStyle(3, color, 0.6 * pulse);
        this.auraGraphics.strokeCircle(x, y, TILE * 0.5);
      }
    });
  }

  // --- 3. GHOST LOGIC ---
  createGhost() {
    this.ghostContainer = this.add.container(0, 0);
    this.ghostRange = this.add.graphics();
    this.ghostSprite = this.add.sprite(0, 0, 'tower_BASIC_RIFLE'); 
    this.ghostSprite.setAlpha(0.6);
    this.ghostSprite.setDisplaySize(TILE * 0.8, TILE * 0.8);
    
    this.ghostContainer.add([this.ghostRange, this.ghostSprite]);
    this.ghostContainer.setVisible(false);
    this.ghostContainer.setDepth(100);
  }

  updateGhost() {
    const draggingKey = this.registry.get('draggingParams');
    const pointer = this.input.activePointer;

    if (!draggingKey || !pointer.worldX) {
      this.ghostContainer.setVisible(false);
      return;
    }

    const c = Math.floor(pointer.worldX / TILE);
    const r = Math.floor(pointer.worldY / TILE);

    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
      this.ghostContainer.setVisible(true);
      this.ghostContainer.setPosition(c * TILE + TILE/2, r * TILE + TILE/2);

      // Update Texture
      const textureKey = `tower_${draggingKey}`;
      if (this.textures.exists(textureKey) && this.ghostSprite.texture.key !== textureKey) {
        this.ghostSprite.setTexture(textureKey);
        this.ghostSprite.setDisplaySize(TILE * 0.8, TILE * 0.8);
      }

      // Draw Range
      const stats = TOWERS[draggingKey];
      if (stats) {
        this.ghostRange.clear();
        const cell = game.map[r]?.[c];
        const isBlocked = cell === 'S' || cell === 'B' || cell === 'X';
        const isEmpty = !game.towers.some(t => t.r === r && t.c === c);
        const isValid = !isBlocked && isEmpty;
        
        const color = isValid ? 0x22c55e : 0xef4444;
        this.ghostRange.fillStyle(color, 0.2);
        this.ghostRange.fillCircle(0, 0, stats.range * TILE);
        this.ghostRange.lineStyle(2, color, 0.8);
        this.ghostRange.strokeCircle(0, 0, stats.range * TILE);
        
        this.ghostSprite.setTint(isValid ? 0xffffff : 0xffaaaa);
      }
    } else {
      this.ghostContainer.setVisible(false);
    }
  }

  // --- 4. SYNC TOWERS ---
  syncTowers() {
    const activeIds = new Set(game.towers.map(t => t.id));
    
    // Remove dead towers
    this.towerGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const sprite = child as Phaser.GameObjects.Sprite;
      if (!activeIds.has(sprite.getData('id'))) {
        sprite.destroy();
      }
      return true;
    });

    // Add/update towers
    game.towers.forEach(t => {
      const existing = this.towerGroup.getChildren().find((child: Phaser.GameObjects.GameObject) => {
        return (child as Phaser.GameObjects.Sprite).getData('id') === t.id;
      }) as Phaser.GameObjects.Sprite | undefined;
      
      if (!existing) {
        // Create new tower sprite
        const textureKey = `tower_${t.key}`;
        const sprite = this.add.sprite(
          t.c * TILE + TILE/2, 
          t.r * TILE + TILE/2, 
          this.textures.exists(textureKey) ? textureKey : 'tower_BASIC_RIFLE'
        );
        sprite.setDisplaySize(TILE * 0.8, TILE * 0.8);
        sprite.setData('id', t.id);
        sprite.setDepth(10);
        this.towerGroup.add(sprite);
      } else {
        // Update existing tower rotation
        if (t.angle !== undefined) {
          existing.setRotation(Phaser.Math.DegToRad(t.angle));
        }
      }
    });
  }

  // --- 5. SYNC ENEMIES ---
  syncEnemies() {
    this.enemyContainer.removeAll(true);
    
    game.enemies.forEach(e => {
      const x = e.c * TILE + TILE/2 + (e.xOffset || 0) * TILE;
      const y = e.r * TILE + TILE/2 + (e.yOffset || 0) * TILE;
      
      // Find enemy type index
      const typeIndex = ENEMY_TYPES.findIndex(t => t.icon === e.icon) || 0;
      
      // Enemy Sprite
      const textureKey = `enemy_${typeIndex}`;
      const sprite = this.add.sprite(0, 0, this.textures.exists(textureKey) ? textureKey : 'enemy_0');
      sprite.setDisplaySize(TILE * 0.6 * (e.scale || 1), TILE * 0.6 * (e.scale || 1));
      
      // Status effect tints
      const auraColor = effectManager.getEnemyAuraColor(e);
      if (auraColor) {
        sprite.setTint(parseInt(auraColor.replace('#', '0x')));
      } else if (e.frozen && e.frozen > 0) {
        sprite.setTint(0x60a5fa);
      }

      // HP Bar background
      const hpBg = this.add.rectangle(0, -25, 44, 8, 0x1e293b);
      hpBg.setStrokeStyle(1, 0x475569);
      
      // HP Bar fill
      const hpPercent = Math.max(0, e.hp / e.maxHp);
      const hpColor = hpPercent > 0.5 ? 0x22c55e : (hpPercent > 0.25 ? 0xfbbf24 : 0xef4444);
      const hp = this.add.rectangle(-20 + (20 * hpPercent), -25, 40 * hpPercent, 6, hpColor);
      
      // Boss indicator
      if (e.bossType) {
        const crown = this.add.text(0, -40, e.bossType === 'big' ? '👑' : '⭐', {
          fontSize: '16px'
        });
        crown.setOrigin(0.5);
        this.enemyContainer.add(this.add.container(x, y, [sprite, hpBg, hp, crown]));
      } else {
        this.enemyContainer.add(this.add.container(x, y, [sprite, hpBg, hp]));
      }
    });
  }

  // --- 6. DRAW BEAM EFFECTS ---
  drawBeams() {
    this.beamGraphics.clear();
    
    // Find beam towers with active targets
    game.towers.forEach(t => {
      const stats = TOWERS[t.key];
      if (!stats || stats.type !== 'beam' || !t.targetId) return;
      
      const target = game.enemies.find(e => e.id === t.targetId);
      if (!target) return;
      
      const sx = t.c * TILE + TILE / 2;
      const sy = t.r * TILE + TILE / 2;
      const ex = (target.c + (target.xOffset || 0)) * TILE + TILE / 2;
      const ey = (target.r + (target.yOffset || 0)) * TILE + TILE / 2;
      
      const color = parseInt(stats.color.replace('#', '0x'));
      const rampIntensity = Math.min(1, (t.damageCharge || 0) / 5);
      
      // Beam style based on projectile type
      if (stats.projectileStyle === 'ice') {
        // Ice beam - cold blue with frost particles
        this.drawIceBeam(sx, sy, ex, ey, rampIntensity);
      } else if (stats.projectileStyle === 'lightning') {
        // Lightning beam - electric with branches
        this.drawLightningBeam(sx, sy, ex, ey, rampIntensity);
      } else {
        // Fire/laser beam - hot colors with glow
        this.drawFireBeam(sx, sy, ex, ey, color, rampIntensity);
      }
    });
  }
  
  drawFireBeam(sx: number, sy: number, ex: number, ey: number, color: number, intensity: number) {
    const width = 2 + intensity * 6;
    const glowWidth = width + 8;
    
    // Outer glow
    this.beamGraphics.lineStyle(glowWidth, color, 0.2 + intensity * 0.2);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // Core beam
    this.beamGraphics.lineStyle(width, color, 0.6 + intensity * 0.4);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // White hot center
    this.beamGraphics.lineStyle(width * 0.4, 0xffffff, 0.5 + intensity * 0.5);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // Impact glow at target
    const impactSize = 8 + intensity * 12;
    this.beamGraphics.fillStyle(color, 0.4);
    this.beamGraphics.fillCircle(ex, ey, impactSize);
    this.beamGraphics.fillStyle(0xffffff, 0.3);
    this.beamGraphics.fillCircle(ex, ey, impactSize * 0.5);
  }
  
  drawIceBeam(sx: number, sy: number, ex: number, ey: number, intensity: number) {
    const width = 2 + intensity * 4;
    
    // Outer frost glow
    this.beamGraphics.lineStyle(width + 6, 0x60a5fa, 0.15);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // Main beam
    this.beamGraphics.lineStyle(width, 0x93c5fd, 0.7);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // Crystal center
    this.beamGraphics.lineStyle(width * 0.3, 0xffffff, 0.8);
    this.beamGraphics.lineBetween(sx, sy, ex, ey);
    
    // Frost particles along beam
    const dist = Phaser.Math.Distance.Between(sx, sy, ex, ey);
    const particles = Math.floor(dist / 20);
    for (let i = 0; i < particles; i++) {
      const t = (i + Math.sin(this.animTime / 200 + i) * 0.2) / particles;
      const px = sx + (ex - sx) * t;
      const py = sy + (ey - sy) * t;
      const size = 2 + Math.random() * 3;
      this.beamGraphics.fillStyle(0xbfdbfe, 0.6);
      this.beamGraphics.fillCircle(px + (Math.random() - 0.5) * 10, py + (Math.random() - 0.5) * 10, size);
    }
    
    // Freeze effect at target
    this.beamGraphics.fillStyle(0x60a5fa, 0.3);
    this.beamGraphics.fillCircle(ex, ey, 12 + intensity * 8);
  }
  
  drawLightningBeam(sx: number, sy: number, ex: number, ey: number, intensity: number) {
    const segments = 6 + Math.floor(intensity * 4);
    const jitter = 15 + intensity * 10;
    
    // Generate lightning path
    const points: { x: number; y: number }[] = [{ x: sx, y: sy }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = sx + (ex - sx) * t;
      const baseY = sy + (ey - sy) * t;
      points.push({
        x: baseX + (Math.random() - 0.5) * jitter,
        y: baseY + (Math.random() - 0.5) * jitter
      });
    }
    points.push({ x: ex, y: ey });
    
    // Draw glow
    this.beamGraphics.lineStyle(8, 0xfcd34d, 0.2);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.beamGraphics.lineTo(points[i].x, points[i].y);
    }
    this.beamGraphics.strokePath();
    
    // Draw main bolt
    this.beamGraphics.lineStyle(3 + intensity * 2, 0xfacc15, 0.8);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.beamGraphics.lineTo(points[i].x, points[i].y);
    }
    this.beamGraphics.strokePath();
    
    // White core
    this.beamGraphics.lineStyle(1, 0xffffff, 0.9);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.beamGraphics.lineTo(points[i].x, points[i].y);
    }
    this.beamGraphics.strokePath();
    
    // Branch lightning
    if (Math.random() < 0.3) {
      const branchPoint = points[Math.floor(Math.random() * (points.length - 2)) + 1];
      const branchEnd = {
        x: branchPoint.x + (Math.random() - 0.5) * 40,
        y: branchPoint.y + (Math.random() - 0.5) * 40
      };
      this.beamGraphics.lineStyle(1, 0xfcd34d, 0.5);
      this.beamGraphics.lineBetween(branchPoint.x, branchPoint.y, branchEnd.x, branchEnd.y);
    }
    
    // Impact spark
    this.beamGraphics.fillStyle(0xfacc15, 0.5);
    this.beamGraphics.fillCircle(ex, ey, 10 + intensity * 6);
  }

  // --- 7. DRAW PROJECTILES ---
  drawProjectiles() {
    this.projectileGraphics.clear();
    this.projectileGraphics.setBlendMode(Phaser.BlendModes.ADD);

    game.projectiles.forEach(p => {
      const px = p.x * TILE + TILE/2;
      const py = p.y * TILE + TILE/2;
      const color = parseInt(p.color.replace('#', '0x'));
      const life = (p.life ?? 100) / (p.maxLife ?? 100);

      switch (p.style) {
        case 'lightning':
          this.drawLightningProjectile(p, color, life);
          break;
        case 'laser':
          this.drawLaserProjectile(p, color, life);
          break;
        case 'ice':
          this.drawIceProjectile(px, py, color, life);
          break;
        case 'fire':
        case 'plasma':
          this.drawFireProjectile(px, py, color, life);
          break;
        case 'arc':
        case 'grenade':
        case 'cannonball':
          this.drawArcProjectile(p, color);
          break;
        case 'shotgun':
          this.drawShotgunPellet(px, py, color);
          break;
        case 'boomerang':
        case 'bloomerang':
          this.drawBoomerang(px, py, color, p.style === 'bloomerang');
          break;
        case 'vortex':
          this.drawVortex(px, py, color);
          break;
        default:
          this.drawDefaultProjectile(px, py, color, life);
      }
    });
  }
  
  drawLightningProjectile(p: any, color: number, life: number) {
    const sx = (p.startX ?? p.x) * TILE + TILE/2;
    const sy = (p.startY ?? p.y) * TILE + TILE/2;
    const tx = p.tx * TILE + TILE/2;
    const ty = p.ty * TILE + TILE/2;
    
    // Jittery lightning
    const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 20;
    const my = (sy + ty) / 2 + (Math.random() - 0.5) * 20;
    
    this.projectileGraphics.lineStyle(4, color, life * 0.5);
    this.projectileGraphics.beginPath();
    this.projectileGraphics.moveTo(sx, sy);
    this.projectileGraphics.lineTo(mx, my);
    this.projectileGraphics.lineTo(tx, ty);
    this.projectileGraphics.strokePath();
    
    this.projectileGraphics.lineStyle(2, 0xffffff, life);
    this.projectileGraphics.beginPath();
    this.projectileGraphics.moveTo(sx, sy);
    this.projectileGraphics.lineTo(mx, my);
    this.projectileGraphics.lineTo(tx, ty);
    this.projectileGraphics.strokePath();
  }
  
  drawLaserProjectile(p: any, color: number, life: number) {
    const sx = (p.startX ?? p.x) * TILE + TILE/2;
    const sy = (p.startY ?? p.y) * TILE + TILE/2;
    const tx = p.tx * TILE + TILE/2;
    const ty = p.ty * TILE + TILE/2;
    
    this.projectileGraphics.lineStyle(4, color, life * 0.3);
    this.projectileGraphics.lineBetween(sx, sy, tx, ty);
    this.projectileGraphics.lineStyle(2, color, life * 0.7);
    this.projectileGraphics.lineBetween(sx, sy, tx, ty);
    this.projectileGraphics.lineStyle(1, 0xffffff, life);
    this.projectileGraphics.lineBetween(sx, sy, tx, ty);
  }
  
  drawIceProjectile(px: number, py: number, _color: number, _life: number) {
    // Diamond shape
    this.projectileGraphics.fillStyle(0x60a5fa, 0.9);
    this.projectileGraphics.beginPath();
    this.projectileGraphics.moveTo(px, py - 8);
    this.projectileGraphics.lineTo(px + 5, py);
    this.projectileGraphics.lineTo(px, py + 8);
    this.projectileGraphics.lineTo(px - 5, py);
    this.projectileGraphics.closePath();
    this.projectileGraphics.fillPath();
    
    // Inner glow
    this.projectileGraphics.fillStyle(0xbfdbfe, 0.8);
    this.projectileGraphics.fillCircle(px, py, 3);
  }
  
  drawFireProjectile(px: number, py: number, color: number, _life: number) {
    // Flame effect
    const pulse = Math.sin(this.animTime / 50) * 2;
    this.projectileGraphics.fillStyle(color, 0.4);
    this.projectileGraphics.fillCircle(px, py, 10 + pulse);
    this.projectileGraphics.fillStyle(0xfbbf24, 0.6);
    this.projectileGraphics.fillCircle(px, py, 6 + pulse * 0.5);
    this.projectileGraphics.fillStyle(0xffffff, 0.8);
    this.projectileGraphics.fillCircle(px, py, 3);
  }
  
  drawArcProjectile(p: any, color: number) {
    const sx = (p.startX ?? p.x) * TILE + TILE/2;
    const sy = (p.startY ?? p.y) * TILE + TILE/2;
    const tx = p.tx * TILE + TILE/2;
    const ty = p.ty * TILE + TILE/2;
    
    // Calculate arc position
    const progress = p.progress ?? 0;
    const arcHeight = 80 * 4 * progress * (1 - progress);
    const px = sx + (tx - sx) * progress;
    const py = sy + (ty - sy) * progress - arcHeight;
    
    // Shadow
    this.projectileGraphics.fillStyle(0x000000, 0.3);
    this.projectileGraphics.fillEllipse(px, sy + (ty - sy) * progress, 8 * (1 - progress), 4 * (1 - progress));
    
    // Projectile
    this.projectileGraphics.fillStyle(color, 1);
    this.projectileGraphics.fillCircle(px, py, 8);
    this.projectileGraphics.lineStyle(2, 0xffffff, 0.5);
    this.projectileGraphics.strokeCircle(px, py, 8);
  }
  
  drawShotgunPellet(px: number, py: number, color: number) {
    this.projectileGraphics.fillStyle(color, 1);
    this.projectileGraphics.fillCircle(px, py, 4);
    this.projectileGraphics.fillStyle(0xffffff, 0.5);
    this.projectileGraphics.fillCircle(px - 1, py - 1, 1.5);
  }
  
  drawBoomerang(px: number, py: number, color: number, isBloom: boolean) {
    const rotation = this.animTime / 50;
    
    this.projectileGraphics.save();
    this.projectileGraphics.translateCanvas(px, py);
    this.projectileGraphics.rotateCanvas(rotation);
    
    if (isBloom) {
      // Flower petals
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2 / 5);
        this.projectileGraphics.fillStyle(color, 0.8);
        this.projectileGraphics.fillEllipse(Math.cos(angle) * 6, Math.sin(angle) * 6, 4, 8);
      }
      this.projectileGraphics.fillStyle(0xffffff, 0.9);
      this.projectileGraphics.fillCircle(0, 0, 4);
    } else {
      // Curved boomerang
      this.projectileGraphics.lineStyle(4, color, 0.9);
      this.projectileGraphics.beginPath();
      this.projectileGraphics.arc(0, 0, 10, 0, Math.PI, false);
      this.projectileGraphics.strokePath();
    }
    
    this.projectileGraphics.restore();
  }
  
  drawVortex(px: number, py: number, color: number) {
    const rotation = this.animTime / 100;
    
    // Swirling rings
    for (let i = 0; i < 3; i++) {
      const r = 5 + i * 4;
      const alpha = 0.6 - i * 0.15;
      this.projectileGraphics.lineStyle(2, color, alpha);
      this.projectileGraphics.beginPath();
      this.projectileGraphics.arc(px, py, r, rotation + i, rotation + i + Math.PI * 1.5, false);
      this.projectileGraphics.strokePath();
    }
    
    // Center
    this.projectileGraphics.fillStyle(color, 0.8);
    this.projectileGraphics.fillCircle(px, py, 4);
  }
  
  drawDefaultProjectile(px: number, py: number, color: number, life: number) {
    // Simple bullet
    this.projectileGraphics.fillStyle(color, life);
    this.projectileGraphics.fillCircle(px, py, 6);
    this.projectileGraphics.fillStyle(0xffffff, life * 0.5);
    this.projectileGraphics.fillCircle(px - 1, py - 1, 2);
  }

  // --- 8. DRAW PARTICLES ---
  drawParticles() {
    this.particleGraphics.clear();
    
    game.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      const color = parseInt(p.color.replace('#', '0x'));
      
      switch (p.type) {
        case 'spark':
          this.particleGraphics.fillStyle(color, alpha);
          this.particleGraphics.fillCircle(p.x, p.y, 3 * p.scale);
          break;
        case 'smoke':
          this.particleGraphics.fillStyle(color, alpha * 0.4);
          this.particleGraphics.fillCircle(p.x, p.y, 6 * p.scale);
          break;
        case 'flame':
          this.particleGraphics.fillStyle(color, alpha);
          this.particleGraphics.fillCircle(p.x, p.y, 5 * p.scale);
          this.particleGraphics.fillStyle(0xffffff, alpha * 0.5);
          this.particleGraphics.fillCircle(p.x, p.y, 2 * p.scale);
          break;
        case 'freeze':
          this.particleGraphics.fillStyle(0x60a5fa, alpha);
          this.particleGraphics.fillCircle(p.x, p.y, 3 * p.scale);
          break;
        case 'electric':
          this.particleGraphics.fillStyle(0xfacc15, alpha);
          this.particleGraphics.fillRect(p.x - 2, p.y - 2, 4 * p.scale, 4 * p.scale);
          break;
        case 'shockwave':
          const size = 40 * p.scale * (1 - p.life / p.maxLife);
          this.particleGraphics.lineStyle(2, color, alpha);
          this.particleGraphics.strokeCircle(p.x, p.y, size);
          break;
        case 'heal':
          // Green + sign
          this.particleGraphics.fillStyle(0x10b981, alpha);
          this.particleGraphics.fillRect(p.x - 6, p.y - 2, 12, 4);
          this.particleGraphics.fillRect(p.x - 2, p.y - 6, 4, 12);
          break;
        case 'text':
          // Text particles handled elsewhere
          break;
        default:
          this.particleGraphics.fillStyle(color, alpha);
          this.particleGraphics.fillCircle(p.x, p.y, 4 * p.scale);
      }
    });
  }

  // --- 9. CAMERA ---
  resizeCamera(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width || 800;
    const height = gameSize.height || 600;
    const boardWidth = COLS * TILE;
    const boardHeight = ROWS * TILE;
    const zoom = Math.min((width - 50) / boardWidth, (height - 50) / boardHeight);
    this.cameras.main.setZoom(Math.max(0.1, zoom));
    this.cameras.main.centerOn(boardWidth/2, boardHeight/2);
  }

  // --- 10. ASSET GENERATION ---
  createVectorAssets() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const C = SPRITE_SIZE / 2; 

    const save = (key: string) => { 
      g.generateTexture(key, SPRITE_SIZE, SPRITE_SIZE); 
      g.clear(); 
    };

    // Generate tower textures for all towers
    Object.entries(TOWERS).forEach(([key, tower]) => {
      const color = parseInt(tower.color.replace('#', '0x'));
      
      // Base shape based on tower type
      if (tower.type === 'beam') {
        // Beam towers - elongated
        g.fillStyle(color);
        g.fillRect(30, 40, 68, 48);
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(80, 45, 20, 38);
      } else if (tower.type === 'area') {
        // Area towers - circular
        g.fillStyle(color);
        g.fillCircle(C, C, 45);
        g.lineStyle(4, 0xffffff, 0.5);
        g.strokeCircle(C, C, 35);
      } else if (tower.type === 'aura') {
        // Aura/support towers - star-like
        g.fillStyle(color);
        g.fillCircle(C, C, 40);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(C, C, 25);
      } else if (tower.type === 'spread') {
        // Spread towers - wide
        g.fillStyle(color);
        g.fillRect(25, 45, 78, 38);
        g.fillStyle(0x000000, 0.3);
        g.fillRect(30, 50, 68, 28);
      } else {
        // Default projectile towers - square with detail
        g.fillStyle(color);
        g.fillRect(30, 30, 68, 68);
        g.fillStyle(0x000000, 0.2);
        g.fillRect(40, 40, 48, 48);
      }
      
      save(`tower_${key}`);
    });

    // Generate enemy textures
    ENEMY_TYPES.forEach((type, index) => {
      const color = parseInt(type.color.replace('#', '0x'));
      
      if (type.isBoss) {
        // Boss enemies - larger with crown
        g.fillStyle(color);
        g.fillCircle(C, C, 50);
        g.fillStyle(0xfbbf24);
        g.fillTriangle(C - 20, 30, C, 10, C + 20, 30);
      } else {
        // Regular enemies
        g.fillStyle(color);
        g.fillCircle(C, C, 40);
      }
      
      // Eyes
      g.fillStyle(0xffffff);
      g.fillCircle(C - 15, C - 10, 10);
      g.fillCircle(C + 15, C - 10, 10);
      g.fillStyle(0x000000);
      g.fillCircle(C - 15, C - 10, 4);
      g.fillCircle(C + 15, C - 10, 4);
      
      save(`enemy_${index}`);
    });
  }
}

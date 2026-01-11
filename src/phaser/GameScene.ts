import Phaser from 'phaser';
import { game } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';

const TILE = 64; 
const SPRITE_SIZE = 128; // Resolution for generated icons

export class GameScene extends Phaser.Scene {
  // Visual Layers
  private towerGroup!: Phaser.GameObjects.Group;
  private enemyContainer!: Phaser.GameObjects.Container;
  private projectileGraphics!: Phaser.GameObjects.Graphics;
  
  // Ghost (Drag & Drop Visuals)
  private ghostContainer!: Phaser.GameObjects.Container;
  private ghostRange!: Phaser.GameObjects.Graphics;
  private ghostSprite!: Phaser.GameObjects.Sprite;

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

    // 2. Draw Grid (Immediate Mode - Proven to work)
    this.drawGridImmediate();

    // 3. Setup Layers
    this.towerGroup = this.add.group(); 
    this.enemyContainer = this.add.container(0, 0);
    this.projectileGraphics = this.add.graphics(); 
    
    // 4. Setup Ghost (Hidden by default)
    this.createGhost();

    // 5. Handle Resizing
    this.scale.on('resize', this.resizeCamera, this);
    this.resizeCamera(this.scale.gameSize);
  }

  update(time: number, delta: number) {
    // 1. Game Logic
    const speed = this.registry.get('speed') || 1;
    for(let i=0; i<Math.floor(speed); i++) game.tick();

    // 2. Sync Visuals
    this.syncTowers();
    this.syncEnemies();
    this.drawProjectiles();

    // 3. Update Ghost
    this.updateGhost();
  }

  // --- 1. PROVEN GRID DRAWING ---
  drawGridImmediate() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x334155, 0.3);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const cell = game.map[r] ? game.map[r][c] : 0;

        if (cell === 1) { // Path
             g.fillStyle(0x1e293b); g.fillRect(x, y, TILE, TILE);
        } else if (cell === 'S') { // Start
             g.fillStyle(0xdc2626, 0.3); g.fillRect(x, y, TILE, TILE);
        } else if (cell === 'B') { // Base
             g.fillStyle(0x2563eb, 0.3); g.fillRect(x, y, TILE, TILE);
        }
        g.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  // --- 2. GHOST LOGIC ---
  createGhost() {
    this.ghostContainer = this.add.container(0, 0);
    this.ghostRange = this.make.graphics({x:0, y:0, add: false});
    this.ghostSprite = this.add.sprite(0, 0, 'tower_python'); 
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
        if (this.ghostSprite.texture.key !== `tower_${draggingKey}`) {
            this.ghostSprite.setTexture(`tower_${draggingKey}`);
            this.ghostSprite.setDisplaySize(TILE * 0.8, TILE * 0.8);
        }

        // Draw Range
        const stats = TOWERS[draggingKey];
        if (stats) {
            this.ghostRange.clear();
            const isGrass = game.map[r][c] === 0;
            const isEmpty = !game.towers.some(t => t.r === r && t.c === c);
            const isValid = isGrass && isEmpty;
            
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

  // --- 3. SYNC TOWERS & ENEMIES ---
  syncTowers() {
    const activeIds = new Set(game.towers.map(t => t.id));
    
    // Remove dead
    this.towerGroup.children.each((child: any) => {
        if (!activeIds.has(child.getData('id'))) child.destroy();
    });

    // Add new
    game.towers.forEach(t => {
        const exists = this.towerGroup.getChildren().find((child: any) => child.getData('id') === t.id);
        if (!exists) {
            const sprite = this.add.sprite(t.c * TILE + TILE/2, t.r * TILE + TILE/2, `tower_${t.key}`);
            sprite.setDisplaySize(TILE * 0.8, TILE * 0.8);
            sprite.setData('id', t.id);
            this.towerGroup.add(sprite);
        }
    });
  }

  syncEnemies() {
    this.enemyContainer.removeAll(true);
    
    game.enemies.forEach(e => {
        const x = e.c * TILE + TILE/2 + (e.xOffset||0) * TILE;
        const y = e.r * TILE + TILE/2 + (e.yOffset||0) * TILE;
        
        // Enemy Sprite
        const sprite = this.add.sprite(0, 0, `enemy_${e.typeIndex}`);
        sprite.setDisplaySize(TILE * 0.6, TILE * 0.6);
        
        // Freeze effect
        if (e.frozen > 0) sprite.setTint(0x00ffff);

        // HP Bar
        const hpBg = this.add.rectangle(0, -20, 40, 6, 0x000000);
        const hp = this.add.rectangle(-20 + (20 * (e.hp/e.maxHp)), -20, 40 * (e.hp/e.maxHp), 6, 0xef4444);
        
        const container = this.add.container(x, y, [sprite, hpBg, hp]);
        this.enemyContainer.add(container);
    });
  }

  drawProjectiles() {
    this.projectileGraphics.clear();
    this.projectileGraphics.setBlendMode(Phaser.BlendModes.ADD);

    game.projectiles.forEach(p => {
        const sx = p.x * TILE + TILE/2;
        const sy = p.y * TILE + TILE/2;
        const tx = p.tx * TILE + TILE/2;
        const ty = p.ty * TILE + TILE/2;
        const color = parseInt(p.color.replace('#', '0x'));

        if (p.style === 'laser') {
            this.projectileGraphics.lineStyle(3, color, p.life/p.maxLife);
            this.projectileGraphics.lineBetween(sx, sy, tx, ty);
        } else {
             // Bullet lerp
             const x = sx + (tx-sx)*(1-p.life/p.maxLife);
             const y = sy + (ty-sy)*(1-p.life/p.maxLife);
             this.projectileGraphics.fillStyle(color, 1);
             this.projectileGraphics.fillCircle(x, y, 6);
        }
    });
  }

  resizeCamera(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width || 800;
    const height = gameSize.height || 600;
    const boardWidth = COLS * TILE;
    const boardHeight = ROWS * TILE;
    const zoom = Math.min((width - 50) / boardWidth, (height - 50) / boardHeight);
    this.cameras.main.setZoom(Math.max(0.1, zoom));
    this.cameras.main.centerOn(boardWidth/2, boardHeight/2);
  }

  // --- 4. SAFE ASSET GENERATION (No Bezier Crashes) ---
  createVectorAssets() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const C = SPRITE_SIZE / 2; 

    const save = (key: string) => { 
        g.generateTexture(key, SPRITE_SIZE, SPRITE_SIZE); 
        g.clear(); 
    };

    // 1. Python (Green Square + Eye)
    g.fillStyle(0x22c55e); g.fillRect(20, 20, 88, 88);
    g.fillStyle(0x000000); g.fillRect(70, 30, 20, 20); // Eye
    save('tower_python');

    // 2. Loop (Blue Donut)
    g.lineStyle(16, 0x3b82f6); g.strokeCircle(C, C, 40);
    save('tower_loop');

    // 3. Sniper (Red Crosshair)
    g.lineStyle(6, 0xef4444); g.strokeCircle(C, C, 45);
    g.lineBetween(C, 10, C, 118); g.lineBetween(10, C, 118, C);
    save('tower_sniper');

    // 4. Ice (Cyan Snowflake)
    g.lineStyle(8, 0x06b6d4);
    g.lineBetween(20, 20, 108, 108); g.lineBetween(108, 20, 20, 108);
    save('tower_ice');

    // 5. Firewall (Orange Solid)
    g.fillStyle(0xf97316); g.fillRect(30, 30, 68, 68);
    g.lineStyle(4, 0xffffff); g.strokeRect(30, 30, 68, 68);
    save('tower_firewall');

    // 6. Bomb (Black Ball)
    g.fillStyle(0x1e293b); g.fillCircle(C, C+10, 40);
    g.fillStyle(0xff0000); g.fillRect(C-5, 10, 10, 30); // Fuse
    save('tower_bomb');

    // 7. C++ (Gear)
    g.fillStyle(0x64748b); g.fillCircle(C, C, 50);
    g.fillStyle(0x020617); g.fillCircle(C, C, 20);
    save('tower_cpp');

    // 8. Data (Purple Stack)
    g.fillStyle(0x8b5cf6);
    g.fillRect(30, 20, 68, 20); g.fillRect(30, 50, 68, 20); g.fillRect(30, 80, 68, 20);
    save('tower_data');

    // Enemies
    ENEMY_TYPES.forEach((type, index) => {
        g.fillStyle(parseInt(type.color.replace('#', '0x')));
        g.fillCircle(C, C, 40);
        g.fillStyle(0xffffff); g.fillCircle(C-15, C-10, 10); g.fillCircle(C+15, C-10, 10);
        g.fillStyle(0x000000); g.fillCircle(C-15, C-10, 4); g.fillCircle(C+15, C-10, 4);
        save(`enemy_${index}`);
    });
  }
}
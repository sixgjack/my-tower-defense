// src/components/PixiGameBoard.tsx
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { game } from '../engine/GameEngine';
import { TOWERS } from '../engine/data';
import { TOWER_VISUAL_GROUP, hexToPixiColor } from '../config/spriteManifest';

const TILE = 60;

const C_DEFAULT = {
  ground: 0x0a1525, groundLine: 0x101e38,
  path: 0x241a0a, pathDot: 0x3a2a10,
  spawn: 0x003311, base: 0x1a0005,
  wall: 0x374151, wallInner: 0x4b5563,
};

// Per-theme tile colour overrides
const THEME_TILE_COLORS: Record<string, Partial<typeof C_DEFAULT>> = {
  'Frosty Tundra':    { ground: 0x060d1a, groundLine: 0x0d1e38, path: 0x0d2040, pathDot: 0x1a3860, wall: 0x2a3d55, wallInner: 0x3d5572 },
  'Ancient Desert':   { ground: 0x1a0e05, groundLine: 0x2e1a08, path: 0x3d2010, pathDot: 0x5a3015, wall: 0x6b4a2a, wallInner: 0x8a6040 },
  'Mystic Forest':    { ground: 0x061308, groundLine: 0x0d2210, path: 0x0d2d0a, pathDot: 0x1a4a15, wall: 0x2a4a22, wallInner: 0x3a6030 },
  'Crystal Cavern':   { ground: 0x0f0b1a, groundLine: 0x1a1330, path: 0x281460, pathDot: 0x3d1e9e, wall: 0x3d2a6b, wallInner: 0x5a3d9e },
  'Stormy Wasteland': { ground: 0x101010, groundLine: 0x1a1a1a, path: 0x2a2a2a, pathDot: 0x4a4a4a, wall: 0x3d3d3d, wallInner: 0x555555 },
  'Jungle Temple':    { ground: 0x070e07, groundLine: 0x0e1e0e, path: 0x183a0a, pathDot: 0x2a5c14, wall: 0x2a4018, wallInner: 0x3d5c24 },
  'Underwater Depths':{ ground: 0x030e1a, groundLine: 0x062030, path: 0x073040, pathDot: 0x0d5066, wall: 0x1a3d5a, wallInner: 0x2a5a80 },
  'Molten Core':      { ground: 0x1a0500, groundLine: 0x2e0d00, path: 0x3d0f00, pathDot: 0x6b1a00, wall: 0x6b2a10, wallInner: 0x9e3d18 },
  'Cloud City':       { ground: 0x050e1a, groundLine: 0x0d1e30, path: 0x0f2a40, pathDot: 0x1a4566, wall: 0x2a4a6b, wallInner: 0x3d6699 },
  'Shadow Realm':     { ground: 0x080808, groundLine: 0x111111, path: 0x1a1a2e, pathDot: 0x2e2e4a, wall: 0x222230, wallInner: 0x333348 },
  'Rusty Factory':    { ground: 0x1a1000, groundLine: 0x2e1e00, path: 0x3d2800, pathDot: 0x6b4500, wall: 0x5a3d18, wallInner: 0x8a5c28 },
  'Mystic Garden':    { ground: 0x050f08, groundLine: 0x0d2012, path: 0x0f2a15, pathDot: 0x1a4a22, wall: 0x1e4028, wallInner: 0x2e5c3a },
  'Quantum Void':     { ground: 0x030509, groundLine: 0x080e18, path: 0x0d1340, pathDot: 0x1a2060, wall: 0x1a1a40, wallInner: 0x2a2a60 },
  'Cursed Graveyard': { ground: 0x0d0d0d, groundLine: 0x181818, path: 0x232323, pathDot: 0x3d3d3d, wall: 0x2a2a2a, wallInner: 0x404040 },
  'Solar Flare':      { ground: 0x1a1200, groundLine: 0x2e2000, path: 0x3d2c00, pathDot: 0x6b5000, wall: 0x6b5020, wallInner: 0x9e7830 },
  'Abandoned Mine':   { ground: 0x0d0b08, groundLine: 0x1c1810, path: 0x2a2015, pathDot: 0x3d3020, wall: 0x4a3820, wallInner: 0x665030 },
  'Heavenly Clouds':  { ground: 0x0a1522, groundLine: 0x142540, path: 0x1a3050, pathDot: 0x2a5080, wall: 0x2a4060, wallInner: 0x3d6088 },
};

function getC() {
  const name = (game as any).currentTheme?.name ?? '';
  const override = THEME_TILE_COLORS[name] ?? {};
  return { ...C_DEFAULT, ...override };
}

// Tower key → visual archetype
const ARCHETYPE: Record<string, string> = {
  BASIC_SNIPER: 'sniper', PENETRATOR: 'sniper', ORBITAL: 'sniper',
  BASIC_RIFLE: 'rifle', GATLING: 'rifle', EXECUTIONER: 'rifle',
  BASIC_SHOTGUN: 'shotgun', BOOMERANG: 'shotgun',
  BASIC_CANNON: 'cannon', ARTILLERY: 'cannon', EXPLOSIVE: 'cannon', PUSHER: 'cannon',
  MINE_LAYER: 'minelayer', VORTEX: 'minelayer',
  BASIC_FREEZE: 'cryo', SLOW_FIELD: 'cryo',
  BASIC_BURN: 'fire', INFERNO: 'fire', POISON_TOWER: 'fire',
  BASIC_STUN: 'tesla', CHAIN_LIGHTNING: 'tesla', STUN_TOWER: 'tesla', WEAKEN: 'tesla',
  LASER_BEAM: 'arcane', SUMMONER: 'arcane',
  BASIC_HEAL: 'support', DAMAGE_BUFF: 'support', SPEED_BUFF: 'support',
  RANGE_BUFF: 'support', HEALER: 'support', BANKER: 'economy',
};

export interface PixiBoardHandle { redrawTiles: () => void; }
interface Props { rows: number; cols: number; tick: number; selectedTowerId: number | null; }

function nameHash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function lerpAngle(cur: number, tgt: number, t: number): number {
  let d = tgt - cur;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * t;
}

// ── Mini pixel operator ───────────────────────────────────────────────────────
function buildOperator(acc: number, style: 'stand' | 'prone' | 'sit', yPos: number): Container {
  const op = new Container();
  op.label = 'operator';
  op.y = yPos;
  (op as any).__baseY = yPos;
  const g = new Graphics();
  if (style === 'prone') {
    g.rect(-4, -4, 10, 7).fill({ color: acc, alpha: 0.85 });
    g.circle(8, -2, 3.5).fill({ color: 0xf5c29e });
    g.rect(5, -5.5, 5, 3.5).fill({ color: acc });
  } else {
    g.circle(0, -11, 3.5).fill({ color: 0xf5c29e });
    g.rect(-3.5, -14, 7, 4).fill({ color: acc });
    g.rect(-3.5, -7, 7, 8).fill({ color: acc, alpha: 0.85 });
    if (style === 'stand') {
      g.rect(-3.5, 1, 3, 5).fill({ color: 0x334155 });
      g.rect(0.5,  1, 3, 5).fill({ color: 0x334155 });
    } else {
      g.rect(-3.5, 1, 7, 3).fill({ color: 0x334155 });
    }
  }
  op.addChild(g);
  return op;
}

// ── Level visual enhancements applied to base Graphics ───────────────────────
function applyLevel(base: Graphics, acc: number, level: number) {
  if (level >= 2) {
    base.rect(-28, 2, 5, 12).fill({ color: acc, alpha: 0.30 });
    base.rect( 23, 2, 5, 12).fill({ color: acc, alpha: 0.30 });
    base.rect(-28, 2, 5,  2).fill({ color: acc, alpha: 0.65 });
    base.rect( 23, 2, 5,  2).fill({ color: acc, alpha: 0.65 });
  }
  if (level >= 3) {
    base.rect(-14, 20, 28, 3).fill({ color: acc, alpha: 0.45 });
    base.circle(-12, 21, 2.5).fill({ color: acc, alpha: 0.7 });
    base.circle( 12, 21, 2.5).fill({ color: acc, alpha: 0.7 });
  }
  if (level >= 4) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      base.circle(Math.cos(a) * 26, Math.sin(a) * 26, 3.5).fill({ color: acc, alpha: 0.65 });
      base.circle(Math.cos(a) * 26, Math.sin(a) * 26, 1.5).fill({ color: 0xffffff, alpha: 0.55 });
    }
  }
}

function makeFlash(acc: number, dist = 26): Graphics {
  const f = new Graphics();
  f.circle(dist, 0, 8).fill({ color: acc, alpha: 0.50 });
  f.circle(dist, 0, 14).fill({ color: 0xffffff, alpha: 0.12 });
  f.label   = 'flash';
  f.visible = false;
  return f;
}

// ── 1. SNIPER — tall sandbag wall + long precision barrel ────────────────────
function buildSniperTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-10, -30, 20, 54).fill({ color: 0x2d1b0e });
  b.rect( -8, -28, 16, 50).fill({ color: 0x3d2510 });
  for (let y = -28; y < 22; y += 8) b.rect(-10, y, 20, 2).fill({ color: 0x261405, alpha: 0.7 });
  b.rect(-14, -34, 12, 10).fill({ color: 0x261405 });
  b.rect(  2, -34, 12, 10).fill({ color: 0x261405 });
  b.rect(-13, -26, 26,  6).fill({ color: acc, alpha: 0.14 });
  if (key === 'PENETRATOR') {
    b.circle(0, -18, 6).stroke({ color: acc, width: 1, alpha: 0.6 });
    b.moveTo(-8,-18).lineTo(8,-18).stroke({ color: acc, width: 0.8, alpha: 0.5 });
    b.moveTo(0,-26).lineTo(0,-10).stroke({ color: acc, width: 0.8, alpha: 0.5 });
  }
  if (key === 'ORBITAL') {
    b.circle(-6, 12, 10).stroke({ color: acc, width: 1.5, alpha: 0.5 });
    b.circle(-6, 12, 6).fill({ color: acc, alpha: 0.25 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -22;
  const tg = new Graphics();
  tg.rect(-8, -5, 16, 10).fill({ color: 0x1a1a1a });
  tg.rect(-6, -5, 16,  4).fill({ color: 0x2a2a2a });
  if (key === 'ORBITAL') {
    tg.circle(0, 0, 8).fill({ color: 0x1a1a1a });
    tg.circle(0, 0, 8).stroke({ color: acc, width: 2 });
    tg.rect(6, -2, 18, 4).fill({ color: acc });
    tg.circle(24, 0, 5).fill({ color: acc, alpha: 0.8 });
    tg.circle(24, 0, 2).fill({ color: 0xffffff, alpha: 0.6 });
  } else {
    const blen = key === 'PENETRATOR' ? 32 : 26;
    tg.rect(6, -2.5, blen, 5).fill({ color: 0x3a3a3a });
    tg.rect(12, -6, 10, 4).fill({ color: 0x222222 });
    tg.rect(13, -5,  8, 2).fill({ color: acc, alpha: 0.6 });
    if (key === 'PENETRATOR') {
      tg.rect(8, -6.5, blen - 2, 2).fill({ color: acc, alpha: 0.7 });
      tg.rect(8,  4.5, blen - 2, 2).fill({ color: acc, alpha: 0.7 });
    }
    tg.rect(6 + blen, -3.5, 5, 7).fill({ color: acc });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, key === 'ORBITAL' ? 28 : 34));
  ctr.addChild(turret);
  ctr.addChild(buildOperator(acc, 'prone', -26));
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 2. RIFLE — concrete bunker, medium auto barrel ───────────────────────────
function buildRifleTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-18, -16, 36, 40).fill({ color: 0x1a2030 });
  b.rect(-16, -14, 32, 36).fill({ color: 0x212a3c });
  b.rect(-18, -2, 36, 4).fill({ color: 0x2a3550, alpha: 0.8 });
  b.rect(-18, 12, 36, 3).fill({ color: 0x2a3550, alpha: 0.6 });
  b.rect(-14, -16, 28, 8).fill({ color: 0x0a1220 });
  b.rect(-12, -15, 24, 6).fill({ color: acc, alpha: 0.12 });
  for (const [bx, by] of [[-16,-14],[14,-14],[-16,22],[14,22]] as const)
    b.circle(bx, by, 3).fill({ color: 0x333d4f });
  if (key === 'EXECUTIONER') {
    b.circle(-3, 6, 6).fill({ color: 0x1a0000 });
    b.circle(-3, 6, 4).fill({ color: 0xffffff, alpha: 0.08 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -10;
  const tg = new Graphics();
  tg.rect(-7, -6, 14, 12).fill({ color: 0x141820 });
  tg.rect(-5, -6, 14,  4).fill({ color: 0x1e2430 });
  if (key === 'GATLING') {
    for (let i = 0; i < 3; i++) tg.rect(6, -5 + i * 4, 22, 3).fill({ color: 0x404040 });
    tg.circle(28, -3, 4).fill({ color: acc });
    tg.circle(28,  1, 4).fill({ color: acc });
    tg.circle(28,  5, 4).fill({ color: acc, alpha: 0.6 });
  } else if (key === 'EXECUTIONER') {
    tg.rect(6, -5, 20, 4).fill({ color: 0x363636 });
    tg.rect(6,  1, 20, 4).fill({ color: 0x363636 });
    tg.circle(26, -3, 4).fill({ color: acc });
    tg.circle(26,  3, 4).fill({ color: acc });
  } else {
    tg.rect(6, -2.5, 18, 5).fill({ color: 0x404040 });
    tg.rect(23, -4, 5, 8).fill({ color: acc });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 28));
  ctr.addChild(turret);
  ctr.addChild(buildOperator(acc, 'stand', 18));
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 3. SHOTGUN — wide squat emplacement ──────────────────────────────────────
function buildShotgunTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-24, -8, 48, 32).fill({ color: 0x1e2535 });
  b.rect(-22, -6, 44, 28).fill({ color: 0x253040 });
  b.rect(-20, -8, 16, 10).fill({ color: 0x0c1525 });
  b.rect(  4, -8, 16, 10).fill({ color: 0x0c1525 });
  b.rect(-24, 20, 48, 4).fill({ color: 0x161e2c });
  for (let i = 0; i < 6; i++) b.circle(-20 + i * 8, 22, 2).fill({ color: 0x354050 });
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -2;
  const tg = new Graphics();
  tg.circle(0, 0, 9).fill({ color: 0x0e141e });
  tg.circle(0, 0, 9).stroke({ color: acc, width: 1.5 });
  if (key === 'BOOMERANG') {
    tg.circle(16, 0, 9).fill({ color: acc, alpha: 0.65 });
    tg.circle(16, 0, 5).fill({ color: acc });
    tg.circle(16, 0, 2).fill({ color: 0xffffff, alpha: 0.7 });
    tg.moveTo(5, -5).lineTo(14, -7).stroke({ color: acc, width: 2, alpha: 0.5 });
    tg.moveTo(5,  5).lineTo(14,  7).stroke({ color: acc, width: 2, alpha: 0.5 });
  } else {
    tg.rect( 7, -6, 16, 5).fill({ color: 0x3a4050 });
    tg.rect( 7,  1, 16, 5).fill({ color: 0x3a4050 });
    tg.rect(22, -7,  4,14).fill({ color: acc });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 26));
  ctr.addChild(turret);
  ctr.addChild(buildOperator(acc, 'sit', 16));
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 4. CANNON — armored siege vehicle ────────────────────────────────────────
function buildCannonTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-26, -8, 52, 18).fill({ color: 0x181818 });
  b.rect(-24, -6, 48, 14).fill({ color: 0x222222 });
  b.rect(-26, 10, 52, 14).fill({ color: 0x0f0f0f });
  for (let i = 0; i < 7; i++) b.rect(-25 + i * 7.5, 11, 1.5, 12).fill({ color: 0x1c1c1c });
  for (const wx of [-18, -6, 6, 18]) {
    b.circle(wx, 17, 7).fill({ color: 0x141414 });
    b.circle(wx, 17, 4).fill({ color: acc, alpha: 0.6 });
    b.circle(wx, 17, 1.5).fill({ color: 0xffffff, alpha: 0.4 });
  }
  b.rect(-18, -16, 36, 10).fill({ color: 0x1e1e1e });
  if (key === 'PUSHER') {
    b.circle(0, -5, 10).stroke({ color: acc, width: 2, alpha: 0.5 });
    b.circle(0, -5, 6).fill({ color: acc, alpha: 0.2 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -12;
  const tg = new Graphics();
  tg.circle(0, 0, 11).fill({ color: 0x1a1a1a });
  tg.circle(0, 0, 11).stroke({ color: 0x303030, width: 2 });
  if (key === 'ARTILLERY') {
    tg.rect(8, -3.5, 32, 7).fill({ color: 0x2a2a2a });
    tg.rect(8, -3.5, 32, 3).fill({ color: 0x3a3a3a });
    tg.rect(38, -5, 7, 10).fill({ color: acc });
  } else if (key === 'EXPLOSIVE') {
    tg.rect(8, -5, 20, 10).fill({ color: 0x2a2a2a });
    tg.circle(22, 0, 7).fill({ color: acc });
    tg.circle(16, 0, 4).fill({ color: 0x111111 });
  } else if (key === 'PUSHER') {
    tg.poly([8,-4, 26,-11, 26,11, 8,4]).fill({ color: acc, alpha: 0.5 });
    tg.poly([8,-4, 26,-11, 26,11, 8,4]).stroke({ color: acc, width: 1.5 });
  } else {
    tg.rect(8, -4, 22, 8).fill({ color: 0x2e2e2e });
    tg.circle(28, 0, 5).fill({ color: acc });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, key === 'ARTILLERY' ? 40 : 30));
  ctr.addChild(turret);
  const op = buildOperator(acc, 'sit', -14);
  op.x = -6;
  ctr.addChild(op);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 5. MINELAYER — flat mechanical crawler (auto) ─────────────────────────────
function buildMinelayerTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-28, 0, 56, 12).fill({ color: 0x0f0f0f });
  b.rect(-26, 2, 52,  8).fill({ color: 0x1c1c1c });
  b.rect(-28, 4, 4, 6).fill({ color: 0x141414 });
  b.rect( 24, 4, 4, 6).fill({ color: 0x141414 });
  for (const wx of [-18, 0, 18]) {
    b.circle(wx, 12, 5).fill({ color: 0x121212 });
    b.circle(wx, 12, 2.5).fill({ color: acc, alpha: 0.5 });
  }
  (ctr as any).__isMineLayer = key === 'MINE_LAYER';
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const arm = new Container();
  arm.label = 'turret';
  const ag = new Graphics();
  if (key === 'VORTEX') {
    ag.rect(-4, -8, 8, 8).fill({ color: 0x1e1e1e });
    ag.ellipse(0, -14, 14, 6).fill({ color: acc, alpha: 0.4 });
    ag.ellipse(0, -14, 14, 6).stroke({ color: acc, width: 2 });
    ag.ellipse(0, -14,  8, 3).fill({ color: acc, alpha: 0.6 });
    ag.circle(0, -14, 3).fill({ color: 0xffffff, alpha: 0.5 });
  } else {
    ag.rect(-2, -18, 4, 18).fill({ color: 0x2a2a2a });
    ag.rect(-6, -20, 12, 4).fill({ color: acc, alpha: 0.7 });
    ag.circle(0, -22, 4).fill({ color: acc });
    ag.circle(0, -22, 2).fill({ color: 0xffffff, alpha: 0.5 });
  }
  arm.addChild(ag);
  arm.addChild(makeFlash(acc, 0));
  ctr.addChild(arm);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 6. CRYO — ice crystal formation ──────────────────────────────────────────
function buildCryoTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.poly([-20,24, 20,24, 14,0, -14,0]).fill({ color: 0x0a1a2e });
  b.poly([-12,0, 12,0, 8,-14, -8,-14]).fill({ color: 0x122840 });
  b.poly([0,-34, 8,-10, -8,-10]).fill({ color: acc, alpha: 0.7 });
  b.poly([0,-34, 0,-22, -8,-10]).fill({ color: 0xffffff, alpha: 0.18 });
  b.poly([-18,-8, -10,-8, -8,4]).fill({ color: acc, alpha: 0.42 });
  b.poly([ 18,-8,  10,-8,  8,4]).fill({ color: acc, alpha: 0.42 });
  for (let i = 0; i < 3; i++)
    b.moveTo(-10+i*10, 20).lineTo(-10+i*10+4, 10).stroke({ color: acc, width: 1, alpha: 0.35 });
  if (key === 'SLOW_FIELD') {
    b.poly([-26,12, -18,12, -20,-2]).fill({ color: acc, alpha: 0.28 });
    b.poly([ 26,12,  18,12,  20,-2]).fill({ color: acc, alpha: 0.28 });
    b.circle(0, 8, 22).stroke({ color: acc, width: 1, alpha: 0.3 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -28;
  const tg = new Graphics();
  tg.ellipse(0, 0, 8, 4).fill({ color: acc, alpha: 0.6 });
  tg.ellipse(0, 0, 8, 4).stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
  tg.rect(6, -2, 18, 4).fill({ color: acc, alpha: 0.85 });
  tg.poly([22,-4, 28,0, 22,4]).fill({ color: acc });
  tg.poly([22,-4, 28,0, 22,0]).fill({ color: 0xffffff, alpha: 0.3 });
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 28));
  ctr.addChild(turret);
  const op = buildOperator(acc, 'stand', 14);
  op.x = 10;
  ctr.addChild(op);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 7. FIRE — industrial tank / flamethrower ──────────────────────────────────
function buildFireTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.rect(-16, -20, 32, 44).fill({ color: 0x1a0800 });
  b.rect(-14, -18, 28, 40).fill({ color: 0x241000 });
  for (const yf of [-14, -2, 10]) {
    b.rect(-16, yf, 32, 4).fill({ color: 0x1a0c00 });
    for (const xf of [-14, 0, 14]) b.circle(xf, yf+2, 2).fill({ color: 0x3a2000 });
  }
  b.rect(-4, -28, 8, 12).fill({ color: 0x1e1400 });
  b.rect(-3, -30, 6,  4).fill({ color: acc, alpha: 0.4 });
  if (key === 'POISON_TOWER') {
    b.circle(0, -6, 13).fill({ color: 0x0a1a08, alpha: 0.5 });
    b.circle(0, -6, 9).fill({ color: acc, alpha: 0.12 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -10;
  const tg = new Graphics();
  tg.circle(0, 0, 8).fill({ color: 0x100600 });
  tg.circle(0, 0, 8).stroke({ color: acc, width: 2, alpha: 0.7 });
  if (key === 'INFERNO') {
    tg.poly([7,-6, 24,-11, 26,0, 24,11, 7,6]).fill({ color: acc, alpha: 0.7 });
    tg.poly([7,-6, 24,-11, 24,0, 7,-3]).fill({ color: 0xffffff, alpha: 0.12 });
  } else if (key === 'POISON_TOWER') {
    tg.rect(6, -3, 18, 6).fill({ color: acc, alpha: 0.65 });
    for (let d = 0; d < 3; d++) tg.circle(12+d*4, 6, 2).fill({ color: acc, alpha: 0.8 });
  } else {
    tg.rect(6, -3.5, 18, 7).fill({ color: acc, alpha: 0.75 });
    tg.poly([6,-3.5, 24,-6, 24,6, 6,3.5]).fill({ color: 0xffffff, alpha: 0.10 });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 24));
  ctr.addChild(turret);
  const op = buildOperator(acc, 'stand', 18);
  op.x = -10;
  ctr.addChild(op);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 8. TESLA — electric coil pylon ───────────────────────────────────────────
function buildTeslaTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.poly([-16,24, 16,24, 10,0, -10,0]).fill({ color: 0x0a1020 });
  b.poly([ -8, 0,  8, 0,  5,-14, -5,-14]).fill({ color: 0x0e1828 });
  for (let i = 0; i < 5; i++) {
    const yc = -14 - i * 6;
    b.rect(-5, yc, 10, 4).fill({ color: 0x141e2e });
    b.rect(-3, yc+1, 6, 2).fill({ color: acc, alpha: 0.25 + i * 0.12 });
  }
  b.circle(0, -14, 6).fill({ color: 0x0a1020 });
  b.circle(0, -14, 6).stroke({ color: acc, width: 1 });
  b.circle(0, -26, 5).fill({ color: 0x0a1020 });
  b.circle(0, -26, 5).stroke({ color: acc, width: 1, alpha: 0.8 });
  if (key === 'WEAKEN') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.circle(Math.cos(a)*20, Math.sin(a)*20+12, 3).fill({ color: acc, alpha: 0.5 });
    }
    b.circle(0, 12, 20).stroke({ color: acc, width: 1, alpha: 0.35 });
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -32;
  const tg = new Graphics();
  tg.circle(0, 0, 6).fill({ color: acc, alpha: 0.85 });
  tg.circle(0, 0, 3).fill({ color: 0xffffff, alpha: 0.7 });
  if (key === 'CHAIN_LIGHTNING') {
    for (let p = 0; p < 3; p++) {
      const a = (p / 3) * Math.PI * 2 - Math.PI / 2;
      tg.moveTo(0,0).lineTo(Math.cos(a)*20, Math.sin(a)*20).stroke({ color: acc, width: 2.5, alpha: 0.85 });
      tg.circle(Math.cos(a)*20, Math.sin(a)*20, 3.5).fill({ color: acc });
    }
  } else {
    tg.moveTo(-14,-16).lineTo(0,0).lineTo(14,-16).stroke({ color: acc, width: 2, alpha: 0.9 });
    tg.circle(-14,-16, 3.5).fill({ color: acc });
    tg.circle( 14,-16, 3.5).fill({ color: acc });
    tg.moveTo(0,0).lineTo(0,18).stroke({ color: acc, width: 2, alpha: 0.7 });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 18));
  ctr.addChild(turret);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 9. ARCANE — crystal cluster with floating turret + orbiting particles ─────
function buildArcaneTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();
  b.poly([-18,24, 18,24, 12,2, -12,2]).fill({ color: 0x12083a });
  b.poly([-10, 2, 10, 2,  6,-14, -6,-14]).fill({ color: 0x1c0e50 });
  b.poly([0,-40, 9,-14, -9,-14]).fill({ color: acc, alpha: 0.7 });
  b.poly([0,-40, 0,-28, -9,-14]).fill({ color: 0xffffff, alpha: 0.18 });
  b.poly([-22,18, -14,18, -16,2]).fill({ color: acc, alpha: 0.32 });
  b.poly([ 22,18,  14,18,  16,2]).fill({ color: acc, alpha: 0.32 });
  if (key === 'SUMMONER') {
    b.circle(0,12,16).stroke({ color: acc, width: 2, alpha: 0.6 });
    b.circle(0,12,12).stroke({ color: acc, width: 1, alpha: 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.circle(Math.cos(a)*12, 12+Math.sin(a)*12, 2).fill({ color: acc, alpha: 0.6 });
    }
  }
  for (let i = 0; i < 3; i++) {
    const orb = new Graphics();
    orb.star(0,0,4,5.5,2.5).fill({ color: acc });
    orb.circle(0,0,2).fill({ color: 0xffffff, alpha: 0.65 });
    orb.label = `orbit${i}`;
    ctr.addChild(orb);
  }
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  turret.y = -34;
  const tg = new Graphics();
  tg.ellipse(0,0,10,5).fill({ color: 0x18084a });
  tg.ellipse(0,0,10,5).stroke({ color: acc, width: 1.5, alpha: 0.85 });
  if (key === 'LASER_BEAM') {
    tg.rect(8,-3,20,6).fill({ color: acc, alpha: 0.9 });
    tg.rect(8,-3,20,2.5).fill({ color: 0xffffff, alpha: 0.20 });
    tg.circle(28, 0, 4.5).fill({ color: acc });
    tg.circle(28, 0, 2).fill({ color: 0xffffff, alpha: 0.8 });
  } else {
    tg.rect(8,-2.5,14,5).fill({ color: acc, alpha: 0.7 });
    tg.circle(22,0,6).fill({ color: acc });
    tg.circle(22,0,3).fill({ color: 0xffffff, alpha: 0.7 });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 28));
  ctr.addChild(turret);
  const op = buildOperator(acc, 'stand', 14);
  op.x = 10;
  ctr.addChild(op);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── 10. SUPPORT — heal/buff/economy shrine ─────────────────────────────────────
function buildSupportTower(acc: number, key: string, level: number): Container {
  const ctr = new Container();
  const b = new Graphics();

  if (key === 'BANKER') {
    b.rect(-16, -12, 32, 36).fill({ color: 0x1a1200 });
    b.rect(-14, -10, 28, 32).fill({ color: 0x241800 });
    b.rect( -8, -12, 16,  4).fill({ color: 0x0a0800 });
    // dollar sign
    b.rect(-2, -2, 4, 12).fill({ color: acc, alpha: 0.8 });
    b.rect(-7, 0, 14, 3).fill({ color: acc, alpha: 0.8 });
    b.rect(-7, 7, 14, 3).fill({ color: acc, alpha: 0.8 });
    // coin piles
    for (let i = 0; i < 3; i++) b.circle(-10+i*10, 20, 4).fill({ color: acc, alpha: 0.6 });
  } else {
    b.circle(0, 8, 24).fill({ color: 0x0a1a08 });
    b.circle(0, 8, 24).stroke({ color: acc, width: 1.5, alpha: 0.4 });
    b.circle(0, 8, 18).fill({ color: 0x0e200a });
    for (const [px,py] of [[0,-16],[16,0],[0,16],[-16,0]] as const) {
      b.circle(px, py+8, 4).fill({ color: 0x14280e });
      b.circle(px, py+8, 4).stroke({ color: acc, width: 1, alpha: 0.5 });
      b.circle(px, py+8, 1.5).fill({ color: acc, alpha: 0.6 });
    }
    if (key === 'BASIC_HEAL' || key === 'HEALER') {
      b.rect(-12,-4, 24, 8).fill({ color: acc, alpha: 0.65 });
      b.rect( -4,-12, 8,24).fill({ color: acc, alpha: 0.65 });
      b.rect(-10,-2, 20, 4).fill({ color: 0xffffff, alpha: 0.15 });
    }
  }

  const rings = new Graphics();
  rings.label = 'rings';
  ctr.addChild(rings);
  applyLevel(b, acc, level);
  ctr.addChild(b);

  const turret = new Container();
  turret.label = 'turret';
  const tg = new Graphics();

  if (key === 'SPEED_BUFF') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      tg.poly([Math.cos(a)*4,Math.sin(a)*4, Math.cos(a+0.3)*18,Math.sin(a+0.3)*18, Math.cos(a-0.3)*10,Math.sin(a-0.3)*10])
        .fill({ color: acc, alpha: 0.75 });
    }
    tg.circle(0,0,4).fill({ color: acc });
  } else if (key === 'RANGE_BUFF') {
    tg.circle(0,0,6).fill({ color: 0x081008 });
    tg.ellipse(14,0,10,14).fill({ color: acc, alpha: 0.25 });
    tg.ellipse(14,0,10,14).stroke({ color: acc, width: 1.5 });
    tg.rect(4,-2,12,4).fill({ color: acc });
  } else {
    tg.circle(0,0,8).fill({ color: 0x081008 });
    tg.circle(0,0,8).stroke({ color: acc, width: 2 });
    tg.circle(0,0,5).fill({ color: acc, alpha: 0.85 });
    tg.circle(0,0,2.5).fill({ color: 0xffffff, alpha: 0.70 });
    tg.rect(8,-2,16,4).fill({ color: acc, alpha: 0.8 });
    tg.circle(24,0,4).fill({ color: acc });
    tg.circle(24,0,2).fill({ color: 0xffffff, alpha: 0.7 });
  }
  turret.addChild(tg);
  turret.addChild(makeFlash(acc, 24));
  ctr.addChild(turret);
  const op = buildOperator(acc, 'stand', key === 'BANKER' ? 18 : 20);
  op.x = -12;
  ctr.addChild(op);
  (ctr as any).__towerLevel = level;
  return ctr;
}

// ── Tower container factory ───────────────────────────────────────────────────
function buildTowerContainer(tower: { id: number; key: string; r: number; c: number; level: number; damage: number }): Container {
  const stats = TOWERS[tower.key as keyof typeof TOWERS];
  const acc   = hexToPixiColor(stats?.color ?? '#4a90d9');
  const arch  = ARCHETYPE[tower.key] ?? TOWER_VISUAL_GROUP[tower.key] ?? 'rifle';
  let ctr: Container;
  switch (arch) {
    case 'sniper':    ctr = buildSniperTower(acc, tower.key, tower.level);    break;
    case 'rifle':     ctr = buildRifleTower(acc, tower.key, tower.level);     break;
    case 'shotgun':   ctr = buildShotgunTower(acc, tower.key, tower.level);   break;
    case 'cannon':    ctr = buildCannonTower(acc, tower.key, tower.level);    break;
    case 'minelayer': ctr = buildMinelayerTower(acc, tower.key, tower.level); break;
    case 'cryo':      ctr = buildCryoTower(acc, tower.key, tower.level);      break;
    case 'fire':      ctr = buildFireTower(acc, tower.key, tower.level);      break;
    case 'tesla':     ctr = buildTeslaTower(acc, tower.key, tower.level);     break;
    case 'arcane':    ctr = buildArcaneTower(acc, tower.key, tower.level);    break;
    default:          ctr = buildSupportTower(acc, tower.key, tower.level);   break;
  }
  // ── HP bar (background + foreground) ────────────────────────────────────
  const hpBarBg = new Graphics();
  hpBarBg.label = 'hpBarBg';
  hpBarBg.rect(-22, TILE * 0.34, 44, 4).fill({ color: 0x1e293b });
  hpBarBg.rect(-22, TILE * 0.34, 44, 4).stroke({ color: 0x0f172a, width: 0.5 });
  ctr.addChild(hpBarBg);
  const hpBarFg = new Graphics();
  hpBarFg.label = 'hpBarFg';
  ctr.addChild(hpBarFg);

  ctr.x = tower.c * TILE + TILE / 2;
  ctr.y = tower.r * TILE + TILE / 2;
  if (tower.level > 1) {
    const badge = new Text({ text: `${tower.level}`, style: new TextStyle({
      fontSize: 9, fill: '#ffffff', fontWeight: 'bold', stroke: { color: '#000000', width: 2 },
    }) });
    badge.label = 'levelBadge';
    badge.anchor.set(0.5);
    badge.x =  TILE * 0.35;
    badge.y = -TILE * 0.38;
    ctr.addChild(badge);
  }
  return ctr;
}

// ── Enemy body shapes ─────────────────────────────────────────────────────────
function drawEnemyBody(gfx: Graphics, color: number, bossType: string | undefined, isFlying: boolean, shapeVariant: number) {
  const isBig  = bossType === 'big';
  const isMini = bossType === 'mini';
  const scale  = isBig ? 1.05 : isMini ? 0.85 : 0.72;
  const r      = (TILE / 2) * scale * 0.76;
  const dark   = Math.max(0, color - 0x303030);
  if (isFlying) {
    gfx.poly([0,-r, r*0.75,r*0.35, r*0.30,0, 0,r*0.45, -r*0.30,0, -r*0.75,r*0.35]).fill({ color });
    gfx.poly([0,-r*0.55, r*0.42,r*0.12, 0,r*0.26, -r*0.42,r*0.12]).fill({ color: 0xffffff, alpha: 0.28 });
    gfx.circle(0, r*0.12, r*0.22).fill({ color });
    gfx.circle(0, r*0.12, r*0.13).fill({ color: 0xffffff, alpha: 0.5 });
  } else if (isBig) {
    gfx.star(0,0,8,r,r*0.40).fill({ color });
    gfx.star(0,0,8,r*0.68,r*0.30).fill({ color: dark, alpha: 0.55 });
    gfx.circle(0,0,r*0.38).fill({ color });
    gfx.circle(0,0,r*0.22).fill({ color: 0xffffff, alpha: 0.22 });
    gfx.star(0,0,4,r*0.16,r*0.08).fill({ color: 0xffffff, alpha: 0.60 });
  } else if (isMini) {
    gfx.star(0,0,4,r,r*0.38).fill({ color });
    gfx.star(0,0,4,r*0.60,r*0.24).fill({ color: dark, alpha: 0.45 });
    gfx.circle(0,0,r*0.30).fill({ color });
    gfx.circle(0,0,r*0.17).fill({ color: 0xffffff, alpha: 0.40 });
  } else {
    switch (shapeVariant % 5) {
      case 0:
        gfx.circle(0,0,r).fill({ color });
        gfx.circle(0,0,r*0.67).fill({ color: dark, alpha: 0.5 });
        gfx.circle(0,0,r*0.33).fill({ color });
        for (const [dx,dy] of [[0,-r*0.6],[0,r*0.6],[r*0.6,0],[-r*0.6,0]] as const)
          gfx.circle(dx,dy,r*0.09).fill({ color: 0xffffff, alpha: 0.50 });
        break;
      case 1:
        gfx.star(0,0,6,r,r*0.86).fill({ color });
        gfx.star(0,0,6,r*0.60,r*0.52).fill({ color: dark, alpha: 0.50 });
        gfx.circle(0,0,r*0.27).fill({ color: 0xffffff, alpha: 0.30 });
        break;
      case 2:
        gfx.star(0,0,4,r,r*0.27).fill({ color });
        gfx.star(0,0,4,r*0.57,r*0.19).fill({ color: dark, alpha: 0.42 });
        gfx.circle(0,0,r*0.23).fill({ color: 0xffffff, alpha: 0.30 });
        break;
      case 3:
        gfx.roundRect(-r*0.72,-r*0.72,r*1.44,r*1.44,r*0.22).fill({ color });
        gfx.roundRect(-r*0.47,-r*0.47,r*0.94,r*0.94,r*0.15).fill({ color: dark, alpha: 0.42 });
        gfx.circle(0,0,r*0.24).fill({ color: 0xffffff, alpha: 0.30 });
        break;
      case 4:
        gfx.poly([0,-r, r*0.87,r*0.5, -r*0.87,r*0.5]).fill({ color });
        gfx.poly([0,-r*0.55, r*0.50,r*0.30, -r*0.50,r*0.30]).fill({ color: dark, alpha: 0.40 });
        gfx.circle(0,r*0.1,r*0.22).fill({ color: 0xffffff, alpha: 0.30 });
        break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const PixiGameBoard = forwardRef<PixiBoardHandle, Props>(
  function PixiGameBoard({ rows, cols, tick, selectedTowerId }, ref) {
    const mountRef = useRef<HTMLDivElement>(null);
    const appRef   = useRef<Application | null>(null);
    const readyRef = useRef(false);

    const tileLyr  = useRef<Graphics  | null>(null);
    const pathLyr  = useRef<Graphics  | null>(null);
    const flameLyr = useRef<Graphics  | null>(null);
    const towerLyr = useRef<Container | null>(null);
    const enemyLyr = useRef<Container | null>(null);
    const projLyr  = useRef<Graphics  | null>(null);
    const uiLyr    = useRef<Graphics  | null>(null);

    const towerReg    = useRef<Map<number, Container>>(new Map());
    const enemyReg    = useRef<Map<number, Container>>(new Map());
    const mapVerRef   = useRef(-1); // last drawn mapVersion

    useImperativeHandle(ref, () => ({ redrawTiles: () => { if (tileLyr.current) drawTiles(tileLyr.current); } }));

    useEffect(() => {
      if (!mountRef.current) return;
      let alive = true;
      const app = new Application();
      (async () => {
        await app.init({
          width: cols * TILE, height: rows * TILE,
          backgroundColor: C_DEFAULT.ground, antialias: false,
          resolution: Math.min(window.devicePixelRatio ?? 1, 2), autoDensity: true,
        });
        if (!alive || !mountRef.current) { try { app.destroy(true); } catch { /* */ } return; }
        mountRef.current.appendChild(app.canvas);
        appRef.current = app;
        const tileGfx=new Graphics(), pathGfx=new Graphics(), flameGfx=new Graphics();
        const towerCnt=new Container(), enemyCnt=new Container();
        const projGfx=new Graphics(), uiGfx=new Graphics();
        app.stage.addChild(tileGfx,pathGfx,flameGfx,towerCnt,enemyCnt,projGfx,uiGfx);
        tileLyr.current=tileGfx; pathLyr.current=pathGfx; flameLyr.current=flameGfx;
        towerLyr.current=towerCnt; enemyLyr.current=enemyCnt; projLyr.current=projGfx; uiLyr.current=uiGfx;
        drawTiles(tileGfx);
        readyRef.current = true;
      })();
      return () => {
        alive = false; readyRef.current = false;
        towerReg.current.clear(); enemyReg.current.clear();
        if (appRef.current) { try { appRef.current.destroy(true); } catch { /* */ } appRef.current = null; }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!readyRef.current) return;

      // Redraw tiles + clear registries whenever the map regenerates
      if (game.mapVersion !== mapVerRef.current) {
        mapVerRef.current = game.mapVersion;
        if (tileLyr.current)  drawTiles(tileLyr.current);
        if (pathLyr.current)  pathLyr.current.clear();
        if (flameLyr.current) flameLyr.current.clear();
        // Destroy and clear all tower / enemy containers
        if (towerLyr.current) {
          for (const ctr of towerReg.current.values()) {
            towerLyr.current.removeChild(ctr); ctr.destroy({ children: true });
          }
          towerReg.current.clear();
        }
        if (enemyLyr.current) {
          for (const ctr of enemyReg.current.values()) {
            enemyLyr.current.removeChild(ctr); ctr.destroy({ children: true });
          }
          enemyReg.current.clear();
        }
      }

      syncTowers();
      syncEnemies();
      drawProjectiles();
      drawFlameAura();
      drawUI(selectedTowerId);
      if (game.path.length > 1) drawPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, selectedTowerId]);

    function drawTiles(gfx: Graphics) {
      gfx.clear();
      if (!game.map?.length) return;
      const tc = getC(); // theme-aware colours
      game.map.forEach((row, r) => {
        row.forEach((cell: unknown, c) => {
          const x = c*TILE, y = r*TILE;
          if (cell === 'S') {
            gfx.rect(x,y,TILE,TILE).fill({ color: tc.spawn });
            gfx.rect(x+TILE*0.15,y+2,TILE*0.7,3).fill({ color: 0x22c55e });
            gfx.rect(x+TILE*0.15,y+TILE-5,TILE*0.7,3).fill({ color: 0x22c55e });
            gfx.rect(x+2,y+TILE*0.15,3,TILE*0.7).fill({ color: 0x22c55e });
            gfx.rect(x+TILE-5,y+TILE*0.15,3,TILE*0.7).fill({ color: 0x22c55e });
            gfx.rect(x+TILE*0.27,y+TILE*0.26,TILE*0.25,TILE*0.2).fill({ color: 0xffffff, alpha: 0.9 });
            gfx.rect(x+TILE*0.52,y+TILE*0.21,TILE*0.2,TILE*0.35).fill({ color: 0xffffff, alpha: 0.9 });
          } else if (cell === 'B') {
            gfx.rect(x,y,TILE,TILE).fill({ color: tc.base });
            gfx.circle(x+TILE/2,y+TILE/2,TILE*0.40).stroke({ color: 0xef4444, width: 2, alpha: 0.5 });
            gfx.circle(x+TILE/2,y+TILE/2,TILE*0.25).stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.6 });
            gfx.circle(x+TILE/2,y+TILE/2,TILE*0.10).fill({ color: 0xef4444, alpha: 0.9 });
            gfx.rect(x+TILE/2-1.5,y+3,3,TILE-6).fill({ color: 0xef4444, alpha: 0.75 });
            gfx.rect(x+3,y+TILE/2-1.5,TILE-6,3).fill({ color: 0xef4444, alpha: 0.75 });
          } else if (cell === 'X') {
            gfx.rect(x,y,TILE,TILE).fill({ color: tc.wall });
            gfx.rect(x+2,y+2,TILE-4,TILE-4).fill({ color: tc.wallInner });
            gfx.rect(x,y+TILE/2,TILE,2).fill({ color: 0x1f2937, alpha: 0.7 });
            gfx.rect(x+TILE/2,y,2,TILE/2).fill({ color: 0x1f2937, alpha: 0.7 });
            gfx.rect(x+2,y+2,TILE-4,3).fill({ color: 0xffffff, alpha: 0.07 });
          } else if (cell !== 0) {
            gfx.rect(x,y,TILE,TILE).fill({ color: tc.path });
            for (let i=0;i<3;i++) {
              const dx=((r*7+c*13+i*17)%(TILE-8))+4, dy=((r*11+c*5+i*23)%(TILE-8))+4;
              gfx.rect(x+dx,y+dy,2,2).fill({ color: tc.pathDot, alpha: 0.6 });
            }
          } else {
            gfx.rect(x,y,TILE,TILE).fill({ color: tc.ground });
            gfx.rect(x,y,TILE,1).fill({ color: tc.groundLine, alpha: 0.5 });
            gfx.rect(x,y,1,TILE).fill({ color: tc.groundLine, alpha: 0.4 });
            if ((r+c)%3===0) gfx.rect(x+4,y+4,8,6).fill({ color: 0x0d1a2e, alpha: 0.5 });
          }
        });
      });
    }

    function drawPath() {
      const gfx = pathLyr.current!;
      gfx.clear();
      const path = game.path;
      if (path.length < 2) return;
      const offset = (tick*3)%12;
      for (let i=0;i<path.length-1;i++) {
        const x1=path[i].c*TILE+TILE/2, y1=path[i].r*TILE+TILE/2;
        const x2=path[i+1].c*TILE+TILE/2, y2=path[i+1].r*TILE+TILE/2;
        const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
        const nx=dx/len, ny=dy/len;
        let d=offset;
        while (d<len-8) { gfx.circle(x1+nx*d,y1+ny*d,2).fill({ color: 0x60a5fa, alpha: 0.45 }); d+=12; }
        const ax=x2-nx*8, ay=y2-ny*8, px2=-ny, py2=nx;
        gfx.moveTo(x2,y2).lineTo(ax+px2*5,ay+py2*5).lineTo(ax-px2*5,ay-py2*5).fill({ color: 0x60a5fa, alpha: 0.50 });
      }
    }

    function drawFlameAura() {
      const gfx = flameLyr.current!;
      gfx.clear();
      const cells = game.collectFlameThrowerAuraCells?.() ?? [];
      cells.forEach(({ r, c }: { r: number; c: number }) => {
        const flicker = 0.12 + Math.sin((tick+r*5+c*11)*0.1)*0.05;
        gfx.rect(c*TILE,r*TILE,TILE,TILE).fill({ color: 0xef4444, alpha: 0.18+flicker });
        gfx.rect(c*TILE,r*TILE,TILE,TILE).stroke({ color: 0xfb923c, width: 1, alpha: 0.4 });
      });
    }

    // ── Tower sync ────────────────────────────────────────────────────────────
    function syncTowers() {
      const layer = towerLyr.current!;
      const live  = new Set(game.towers.map((t: { id: number }) => t.id));

      for (const [id, ctr] of towerReg.current) {
        if (!live.has(id)) {
          layer.removeChild(ctr); ctr.destroy({ children: true }); towerReg.current.delete(id);
        }
      }

      for (const tower of game.towers) {
        // Rebuild on level-up
        if (towerReg.current.has(tower.id)) {
          const existing = towerReg.current.get(tower.id)!;
          if ((existing as any).__towerLevel !== tower.level) {
            layer.removeChild(existing); existing.destroy({ children: true }); towerReg.current.delete(tower.id);
          }
        }
        if (!towerReg.current.has(tower.id)) {
          const nc = buildTowerContainer(tower);
          layer.addChild(nc); towerReg.current.set(tower.id, nc);
        }

        const ctr    = towerReg.current.get(tower.id)!;
        const stats  = TOWERS[tower.key as keyof typeof TOWERS];
        const acc    = hexToPixiColor(stats?.color ?? '#4a90d9');
        const firing = tower.targetId != null;
        const target = firing ? game.enemies.find((e: { id: number }) => e.id === tower.targetId) : null;
        const rangePx = tower.range * TILE;

        const badge = ctr.getChildByLabel?.('levelBadge') as Text | null;
        if (badge && badge.text !== `${tower.level}`) badge.text = `${tower.level}`;

        // ── Turret aim (only tracks enemies within range) ───────────────────
        const turret = ctr.getChildByLabel?.('turret') as Container | null;
        if (turret) {
          let trackEnemy = target;
          if (!trackEnemy) {
            let bestD = 1e9;
            for (const e of game.enemies) {
              const ex = (e.c + (e.xOffset ?? 0)) * TILE + TILE / 2;
              const ey = (e.r + (e.yOffset ?? 0)) * TILE + TILE / 2;
              const d  = (ex - ctr.x) ** 2 + (ey - ctr.y) ** 2;
              if (d <= rangePx * rangePx && d < bestD) { bestD = d; trackEnemy = e; }
            }
          }
          if (trackEnemy) {
            const tx = (trackEnemy.c + (trackEnemy.xOffset ?? 0)) * TILE + TILE / 2;
            const ty = (trackEnemy.r + (trackEnemy.yOffset ?? 0)) * TILE + TILE / 2;
            const desired = Math.atan2(ty - (ctr.y + turret.y), tx - ctr.x);
            turret.rotation = lerpAngle(turret.rotation, desired, target ? 0.28 : 0.06);
          } else {
            const arch = ARCHETYPE[tower.key] ?? '';
            if (arch === 'minelayer')       turret.rotation  = Math.sin(tick * 0.05) * 0.5;
            else if (arch === 'tesla')      turret.rotation += 0.014;
            else if (arch === 'support' || arch === 'economy') turret.rotation += 0.010;
            else                            turret.rotation  = Math.sin(tick * 0.032) * 0.22;
          }
          const flash = turret.getChildByLabel?.('flash') as Graphics | null;
          if (flash) flash.visible = firing && (tick % 4) < 2;
        }

        // ── HP bar (always visible) ────────────────────────────────────────
        const hpBarFg = ctr.getChildByLabel?.('hpBarFg') as Graphics | null;
        if (hpBarFg) {
          const pct = (tower.hp != null && tower.maxHp) ? Math.max(0, tower.hp / tower.maxHp) : 1;
          hpBarFg.clear();
          const barColor = pct > 0.6 ? 0x22c55e : pct > 0.3 ? 0xf59e0b : 0xef4444;
          hpBarFg.rect(-22, TILE * 0.34, 44 * pct, 4).fill({ color: barColor, alpha: 0.88 });
        }

        // ── Operator bob & face-toward-target ──────────────────────────────
        const op = ctr.getChildByLabel?.('operator') as Container | null;
        if (op) {
          const baseY = (op as any).__baseY ?? op.y;
          op.y = baseY + Math.sin(tick * 0.22 + tower.id * 0.5) * 1.5;
          if (target) {
            const tx = (target.c + (target.xOffset ?? 0)) * TILE + TILE / 2;
            op.scale.x = tx < ctr.x ? -1 : 1;
          }
        }

        // ── Blocking indicator ──────────────────────────────────────────────────
        const isBlocking = (stats as any)?.blockCount > 0 &&
            game.enemies.some((e: any) => e.blockedByTowerId === tower.id);
        if (isBlocking) {
            const pulse = 0.4 + Math.sin(tick * 0.18) * 0.25;
            const hpBg = ctr.getChildByLabel?.('hpBarBg') as Graphics | null;
            if (hpBg) {
                hpBg.clear();
                hpBg.rect(-22, TILE * 0.34, 44, 4).fill({ color: 0x1e293b });
                hpBg.rect(-22, TILE * 0.34, 44, 4).stroke({ color: 0xef4444, width: 1.5, alpha: pulse });
            }
        }

        // ── Archetype-specific animations ──────────────────────────────────
        const arch = ARCHETYPE[tower.key] ?? '';
        if (arch === 'arcane') {
          const spd = firing ? 0.09 : 0.046;
          const rad = firing ? 14 : 20;
          for (let i = 0; i < 3; i++) {
            const orb = ctr.getChildByLabel?.(`orbit${i}`) as Graphics | null;
            if (orb) {
              const a = tick * spd + (i * Math.PI * 2 / 3);
              orb.x = Math.cos(a) * rad;
              orb.y = Math.sin(a) * rad + 8;
              orb.scale.set(firing ? 1.2 + Math.sin(tick*0.25+i)*0.15 : 0.85);
            }
          }
        } else if (arch === 'support' || arch === 'economy') {
          const rings = ctr.getChildByLabel?.('rings') as Graphics | null;
          if (rings) {
            rings.clear();
            const rs = firing ? 2.2 : 1.0;
            for (let i = 0; i < 3; i++) {
              const r2 = 10 + ((tick * rs + i * 9) % 24);
              const a2 = (1 - r2 / 34) * (firing ? 0.85 : 0.40);
              if (a2 > 0.02) rings.circle(0, 8, r2).stroke({ color: acc, width: 1.5, alpha: a2 });
            }
          }
          if (tower.key === 'SPEED_BUFF' && turret) turret.rotation = tick * 0.10;
        }
      }
    }

    // ── Enemy sync ────────────────────────────────────────────────────────────
    function syncEnemies() {
      const layer = enemyLyr.current!;
      const live  = new Set(game.enemies.map((e: { id: number }) => e.id));
      for (const [id, ctr] of enemyReg.current) {
        if (!live.has(id)) { layer.removeChild(ctr); ctr.destroy({ children: true }); enemyReg.current.delete(id); }
      }
      for (const enemy of game.enemies) {
        const ex = (enemy.c + (enemy.xOffset ?? 0)) * TILE + TILE / 2;
        const ey = (enemy.r + (enemy.yOffset ?? 0)) * TILE + TILE / 2;
        if (!enemyReg.current.has(enemy.id)) {
          layer.addChild(buildEnemyContainer(enemy));
          enemyReg.current.set(enemy.id, layer.children[layer.children.length-1] as Container);
        }
        const ctr = enemyReg.current.get(enemy.id)!;
        ctr.x = ex;
        const isBlocked = Boolean((enemy as any).blockedByTowerId);
        ctr.y = ey + (isBlocked ? Math.sin(tick * 0.5 + enemy.id) * 0.5 : Math.sin(tick * 0.20 + enemy.id * 0.73) * 1.8);
        ctr.scale.set(isBlocked ? 1.0 + Math.sin(tick * 0.15) * 0.04 : 1.0); // Slight pulse when blocked
        for (let i = 0; i < 2; i++) {
          const leg = ctr.getChildByLabel?.(`leg${i}`) as Container | null;
          if (leg) leg.rotation = Math.sin(tick*0.28 + (i===0?0:Math.PI) + enemy.id*0.5) * 0.48;
        }
        const hpBar = ctr.getChildByLabel?.('hpBar') as Graphics | null;
        if (hpBar) {
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          const bw  = TILE * 0.78;
          hpBar.clear();
          hpBar.rect(-bw/2, -TILE*0.52, bw, 4).fill({ color: 0x0f172a });
          const col = pct > 0.65 ? 0x22c55e : pct > 0.30 ? 0xf59e0b : 0xef4444;
          if (pct > 0) hpBar.rect(-bw/2, -TILE*0.52, bw*pct, 4).fill({ color: col });
        }
        const freeze = ctr.getChildByLabel?.('freeze') as Graphics | null;
        if (freeze) freeze.visible = (enemy.frozen ?? 0) > 0;
      }
    }

    function buildEnemyContainer(enemy: {
      id: number; name?: string; color?: string; isBoss?: boolean;
      bossType?: string; isFlying?: boolean; maxHp: number; movementType?: string; frozen?: number;
    }): Container {
      const isBoss   = Boolean(enemy.isBoss || enemy.bossType);
      const isFlying = Boolean(enemy.isFlying || enemy.movementType === 'air');
      const isBig    = enemy.bossType === 'big';
      const isMini   = enemy.bossType === 'mini';
      const scale    = isBig ? 1.05 : isMini ? 0.85 : 0.72;
      const r        = (TILE / 2) * scale * 0.76;
      const col      = hexToPixiColor(enemy.color ?? '#ef4444');
      const ctr      = new Container();
      const shadow   = new Graphics();
      shadow.ellipse(0,r*0.88,r*0.72,r*0.22).fill({ color: 0x000000, alpha: 0.25 });
      ctr.addChild(shadow);
      if (!isFlying && !isBoss) {
        for (let i = 0; i < 2; i++) {
          const leg = new Container();
          const lg  = new Graphics();
          lg.rect(-2,0,4,r*0.5).fill({ color: col, alpha: 0.82 });
          leg.addChild(lg);
          leg.x = i===0 ? -r*0.42 : r*0.42;
          leg.y = r*0.34;
          leg.label = `leg${i}`;
          ctr.addChild(leg);
        }
      }
      const body = new Graphics();
      body.label = 'body';
      drawEnemyBody(body, col, enemy.bossType, isFlying, nameHash(enemy.name ?? `e${enemy.id}`) % 5);
      ctr.addChild(body);
      const freeze = new Graphics();
      freeze.circle(0,0,r*1.12).fill({ color: 0x7ecfff, alpha: 0.32 });
      freeze.label = 'freeze'; freeze.visible = false;
      ctr.addChild(freeze);
      const hpBar = new Graphics();
      hpBar.label = 'hpBar';
      ctr.addChild(hpBar);
      if (enemy.bossType) {
        const bt = new Text({ text: enemy.bossType==='big'?'!! BOSS !!':'• MINI', style: new TextStyle({
          fontSize: 8, fill: '#fbbf24', fontWeight: 'bold', stroke: { color: '#000000', width: 2 },
        }) });
        bt.anchor.set(0.5); bt.y = r+8;
        ctr.addChild(bt);
      }
      return ctr;
    }

    // ── Projectiles (enhanced) ─────────────────────────────────────────────────
    function drawProjectiles() {
      const gfx = projLyr.current!;
      gfx.clear();

      for (const mine of game.mines ?? []) {
        const mx = mine.c*TILE+TILE/2, my = mine.r*TILE+TILE/2;
        gfx.circle(mx,my,TILE/4).fill({ color: 0xf59e0b });
        gfx.circle(mx,my,TILE/4).stroke({ color: 0xdc2626, width: 2 });
        const sz=8;
        for (const [dx,dy] of [[0,-sz],[0,sz],[sz,0],[-sz,0],[sz*0.7,-sz*0.7],[-sz*0.7,-sz*0.7],[sz*0.7,sz*0.7],[-sz*0.7,sz*0.7]] as const)
          gfx.circle(mx+dx,my+dy,2).fill({ color: 0xdc2626 });
      }

      for (const p of game.projectiles) {
        const px = p.x*TILE+TILE/2, py = p.y*TILE+TILE/2;
        const col = hexToPixiColor(p.color ?? '#fbbf24');
        const tx = p.tx*TILE+TILE/2, ty = p.ty*TILE+TILE/2;

        switch (p.style) {
          case 'arrow': case 'dart': case 'needle': case 'arrow_classic': case 'sniper': {
            const ang = Math.atan2(ty-py, tx-px);
            const len=12, hw=2.5;
            const ex2=px+Math.cos(ang)*len, ey2=py+Math.sin(ang)*len;
            const bx=px-Math.cos(ang)*3,  by=py-Math.sin(ang)*3;
            // Trail
            for (let t2=1;t2<=3;t2++)
              gfx.circle(px-Math.cos(ang)*t2*3, py-Math.sin(ang)*t2*3, 1.5-t2*0.3).fill({ color: col, alpha: 0.35-t2*0.08 });
            gfx.moveTo(ex2,ey2).lineTo(bx+Math.cos(ang+Math.PI/2)*hw,by+Math.sin(ang+Math.PI/2)*hw)
               .lineTo(bx-Math.cos(ang+Math.PI/2)*hw,by-Math.sin(ang+Math.PI/2)*hw).fill({ color: col });
            gfx.moveTo(px,py).lineTo(bx,by).stroke({ color: col, width: 1.5, alpha: 0.65 });
            break;
          }
          case 'laser': {
            // Thick laser beam with glow
            gfx.moveTo(px,py).lineTo(tx,ty).stroke({ color: col, width: 8, alpha: 0.12 });
            gfx.moveTo(px,py).lineTo(tx,ty).stroke({ color: col, width: 3, alpha: 0.90 });
            gfx.moveTo(px,py).lineTo(tx,ty).stroke({ color: 0xffffff, width: 1, alpha: 0.55 });
            gfx.circle(tx,ty,6).fill({ color: col, alpha: 0.5 });
            break;
          }
          case 'lightning': case 'bolt': {
            const segs=6;
            const pts: [number,number][] = [[px,py]];
            for (let s=1;s<segs;s++) {
              const t2=s/segs;
              pts.push([px+(tx-px)*t2+(Math.random()-0.5)*7, py+(ty-py)*t2+(Math.random()-0.5)*7]);
            }
            pts.push([tx,ty]);
            // Glow pass
            for (let s=0;s<pts.length-1;s++)
              gfx.moveTo(pts[s][0],pts[s][1]).lineTo(pts[s+1][0],pts[s+1][1]).stroke({ color: col, width: 4, alpha: 0.18 });
            // Main bolt
            for (let s=0;s<pts.length-1;s++)
              gfx.moveTo(pts[s][0],pts[s][1]).lineTo(pts[s+1][0],pts[s+1][1]).stroke({ color: col, width: 1.5, alpha: 0.9 });
            gfx.circle(tx,ty,5).fill({ color: col, alpha: 0.6 });
            break;
          }
          case 'cannonball': case 'grenade': case 'rocket': {
            // Shadow
            gfx.ellipse(px+2,py+2,6,4).fill({ color: 0x000000, alpha: 0.2 });
            gfx.circle(px,py,6).fill({ color: col });
            gfx.circle(px,py,6).stroke({ color: 0xffffff, width: 1, alpha: 0.25 });
            gfx.circle(px-1.5,py-1.5,2).fill({ color: 0xffffff, alpha: 0.35 }); // shine
            // Trail
            const ang2 = Math.atan2(ty-py, tx-px);
            for (let t2=1;t2<=4;t2++)
              gfx.circle(px-Math.cos(ang2)*t2*4, py-Math.sin(ang2)*t2*4, 5-t2*0.8).fill({ color: col, alpha: 0.20-t2*0.03 });
            break;
          }
          case 'fire': {
            gfx.circle(px,py,7).fill({ color: col });
            gfx.circle(px,py,11).fill({ color: 0xfef08a, alpha: 0.22 });
            gfx.circle(px,py,3).fill({ color: 0xffffff, alpha: 0.4 });
            break;
          }
          case 'plasma': case 'energy': case 'orb': case 'bullet': {
            gfx.circle(px,py,13).fill({ color: col, alpha: 0.10 });
            gfx.circle(px,py, 8).fill({ color: col, alpha: 0.28 });
            gfx.circle(px,py, 5).fill({ color: col });
            gfx.circle(px,py, 2).fill({ color: 0xffffff, alpha: 0.65 });
            break;
          }
          case 'ice': case 'crystal': {
            // Spinning ice crystal
            const a3 = (tick * 0.15) % (Math.PI * 2);
            for (let i=0;i<4;i++) {
              const ia = a3 + (i/4)*Math.PI*2;
              gfx.moveTo(px,py).lineTo(px+Math.cos(ia)*7, py+Math.sin(ia)*7).stroke({ color: col, width: 2, alpha: 0.85 });
            }
            gfx.circle(px,py,3).fill({ color: col });
            gfx.circle(px,py,3).stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
            break;
          }
          case 'poison': case 'acid': {
            gfx.circle(px,py, 5).fill({ color: col });
            gfx.circle(px,py,10).fill({ color: col, alpha: 0.18 });
            gfx.circle(px,py,15).fill({ color: col, alpha: 0.06 });
            break;
          }
          case 'magic': case 'holy': case 'void': {
            const sr = 5 + Math.sin(tick*0.3)*1.5;
            gfx.star(px,py,5,sr,sr*0.4).fill({ color: col });
            gfx.star(px,py,5,sr*1.6,sr*0.5).fill({ color: col, alpha: 0.22 });
            gfx.circle(px,py,2).fill({ color: 0xffffff, alpha: 0.6 });
            break;
          }
          case 'shuriken': case 'disc': case 'saw': case 'shotgun': {
            const a4=(tick*0.3)%(Math.PI*2);
            for (let i=0;i<4;i++) {
              const ea=a4+(Math.PI/2)*i;
              gfx.rect(px+Math.cos(ea)*5-1.5,py+Math.sin(ea)*5-1.5,3,3).fill({ color: col });
            }
            gfx.circle(px,py,3).fill({ color: col });
            break;
          }
          case 'drone': {
            gfx.rect(px-5,py-5,10,10).fill({ color: col });
            gfx.moveTo(px-8,py).lineTo(px+8,py).stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
            gfx.moveTo(px,py-8).lineTo(px,py+8).stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
            break;
          }
          default:
            gfx.circle(px,py,4).fill({ color: col });
            gfx.circle(px,py,7).fill({ color: col, alpha: 0.2 });
        }
      }

      // Beam towers
      for (const t of game.towers) {
        const stats = TOWERS[t.key as keyof typeof TOWERS];
        if (stats?.type !== 'beam' || !t.targetId) continue;
        const target = game.enemies.find((e: { id: number }) => e.id === t.targetId);
        if (!target) continue;
        const sx=t.c*TILE+TILE/2, sy=t.r*TILE+TILE/2;
        const ex=((t as any).beamEndX ?? target.c+(target.xOffset??0))*TILE+TILE/2;
        const ey=((t as any).beamEndY ?? target.r+(target.yOffset??0))*TILE+TILE/2;
        const ramp=Math.min(1,((t as any).damageCharge ?? 0)/5);
        const bw=3+ramp*6, bcol=hexToPixiColor(stats.color ?? '#22d3ee');
        gfx.moveTo(sx,sy).lineTo(ex,ey).stroke({ color: bcol, width: bw+10, alpha: 0.08 });
        gfx.moveTo(sx,sy).lineTo(ex,ey).stroke({ color: bcol, width: bw+4,  alpha: 0.18 });
        gfx.moveTo(sx,sy).lineTo(ex,ey).stroke({ color: bcol, width: bw,    alpha: 0.85 });
        gfx.moveTo(sx,sy).lineTo(ex,ey).stroke({ color: 0xffffff, width: bw*0.3, alpha: 0.55 });
        gfx.circle(ex,ey,8+ramp*12).fill({ color: bcol, alpha: 0.30 });
      }
    }

    // ── UI layer ──────────────────────────────────────────────────────────────
    function drawUI(selId: number | null) {
      const gfx = uiLyr.current!;
      gfx.clear();
      if (selId !== null) {
        const tower = game.towers.find((t: { id: number }) => t.id === selId);
        if (tower) {
          const cx = tower.c*TILE+TILE/2, cy = tower.r*TILE+TILE/2;
          const rng = tower.range * TILE;
          // Rectangular range for MINE_LAYER
          if (tower.key === 'MINE_LAYER') {
            const w = rng * 2.5, h = rng * 0.6;
            gfx.rect(cx - w/2, cy - h/2, w, h).stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.55 });
            gfx.rect(cx - w/2, cy - h/2, w, h).fill({ color: 0xfbbf24, alpha: 0.05 });
          } else {
            gfx.circle(cx,cy,rng).stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.55 });
            gfx.circle(cx,cy,rng).fill({ color: 0xfbbf24, alpha: 0.07 });
          }
          gfx.rect(tower.c*TILE+2, tower.r*TILE+2, TILE-4, TILE-4).stroke({ color: 0xfbbf24, width: 2, alpha: 0.80 });
        }
      }
    }

    return (
      <div ref={mountRef} className="absolute inset-0" style={{ imageRendering: 'pixelated' }} />
    );
  },
);

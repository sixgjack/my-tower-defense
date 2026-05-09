// src/config/spriteManifest.ts
// Maps game entity keys → public sprite asset paths

export type TowerVisualGroup = 'archer' | 'catapult' | 'mage' | 'guardian';

// Map each tower key to a visual sprite group
export const TOWER_VISUAL_GROUP: Record<string, TowerVisualGroup> = {
  // Archer group — ranged single-target
  BASIC_RIFLE:   'archer',
  BASIC_SNIPER:  'archer',
  BASIC_SHOTGUN: 'archer',
  PENETRATOR:    'archer',
  GATLING:       'archer',
  BOOMERANG:     'archer',
  EXECUTIONER:   'archer',
  ORBITAL:       'archer',
  // Catapult group — area/siege
  BASIC_CANNON:  'catapult',
  ARTILLERY:     'catapult',
  EXPLOSIVE:     'catapult',
  MINE_LAYER:    'catapult',
  PUSHER:        'catapult',
  VORTEX:        'catapult',
  // Mage group — elemental/magic
  BASIC_FREEZE:      'mage',
  BASIC_BURN:        'mage',
  BASIC_STUN:        'mage',
  CHAIN_LIGHTNING:   'mage',
  INFERNO:           'mage',
  POISON_TOWER:      'mage',
  LASER_BEAM:        'mage',
  SLOW_FIELD:        'mage',
  STUN_TOWER:        'mage',
  WEAKEN:            'mage',
  SUMMONER:          'mage',
  // Guardian group — support/aura
  BASIC_HEAL:   'guardian',
  DAMAGE_BUFF:  'guardian',
  SPEED_BUFF:   'guardian',
  RANGE_BUFF:   'guardian',
  HEALER:       'guardian',
  BANKER:       'guardian',
};

// 7 idle animation frames per tower group
export function getTowerIdleFrames(group: TowerVisualGroup): string[] {
  return Array.from({ length: 7 }, (_, i) => `/sprites/towers/${group}/idle/${i + 1}.png`);
}

// Unit sprite on top of tower platform
export function getTowerUnitSprite(group: TowerVisualGroup): string {
  return `/sprites/towers/${group}/unit.png`;
}

// ------------------------------------------------------------------
// Enemy sprite assignment
// Strategy:
//   - Boss enemies (bossType set or isBoss)   → big pack sprites e12–e14
//   - Flying enemies                           → e3
//   - Based on enemy name hash → one of e1–e18
// ------------------------------------------------------------------
// Deterministic hash so the same enemy always gets the same sprite
function nameHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getEnemySpriteUrl(
  name: string,
  isBoss: boolean,
  isFlying: boolean,
): string {
  if (isFlying) return '/sprites/enemies/e3.png';
  if (isBoss) {
    const idx = (nameHash(name) % 3) + 12; // e12, e13, e14
    return `/sprites/enemies/e${idx}.png`;
  }
  // Normal enemies — spread across e1-e11 and e15-e18
  const pool = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17, 18];
  const idx = pool[nameHash(name) % pool.length];
  return `/sprites/enemies/e${idx}.png`;
}

// Hex color string → 0xRRGGBB number for Pixi tint
export function hexToPixiColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

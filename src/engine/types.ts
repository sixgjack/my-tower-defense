// src/engine/types.ts

// --- GEOMETRY & MAP ---
export interface Coordinate {
    r: number;
    c: number;
}

export interface PathNode extends Coordinate {
    id: number;
    next: number[]; 
}

// --- VISUALS ---
export type ParticleType = 'text' | 'shockwave' | 'projectile' | 'spark' | 'smoke' | 'muzzle' | 'line' | 'flame' | 'debris' | 'star' | 'impact' | 'heal' | 'freeze' | 'poison_cloud' | 'electric' | 'magic_burst' | 'shadow_cloud' | 'void_ring' | 'holy_light' | 'trail' | 'blast' | 'splash' | 'shard' | 'beam' | 'ripple';

// --- STATUS EFFECTS ---
export interface ActiveStatusEffect {
    effectId: string;
    stacks: number;
    remainingDuration: number; // -1 for permanent, >0 for ticks
    appliedAt: number; // Tick when applied
}

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    life: number;
    maxLife: number;
    scale: number;
    color: string;
    text?: string;
    type: ParticleType;
    tx?: number; 
    ty?: number; 
}

// --- ENEMIES ---
export interface Enemy {
    id: number;
    r: number;
    c: number;
    hp: number;
    maxHp: number;
    speed: number;          
    speedMultiplier: number;
    pathIndex: number;      
    frozen: number;         // Legacy - kept for backward compatibility
    xOffset: number;
    yOffset: number;
    scale: number;
    icon: string;
    color?: string;         
    money: number;          
    damage: number;
    statusEffects?: ActiveStatusEffect[]; // Status effects currently applied
    shieldHp?: number; // Shield health (from Resistance effect)
}

// --- TOWERS ---
export type TowerType = 
  | 'projectile' | 'area' | 'line' | 'beam' | 'spread' 
  | 'aura' | 'pull' | 'farm' | 'summon';

export interface TowerStats {
    name: string;
    cost: number;
    damage: number;
    range: number;      
    cooldown: number;   
    type: TowerType;
    color: string;
    icon: string;
    description: string;
    slowFactor?: number;   
    stunDuration?: number; 
    burnDamage?: number;   
    pullStrength?: number; 
    beamRamp?: number;     
    projectileSpeed?: number;
    areaRadius?: number;   
    multiTarget?: number;  
    projectileStyle?: 'dot' | 'missile' | 'arc' | 'fire' | 'lightning' | 'arrow' | 'bullet' | 'energy' | 'plasma' | 'crystal' | 'poison' | 'ice' | 'acid' | 'laser' | 'sniper' | 'shotgun' | 'grenade' | 'cannonball' | 'rocket' | 'dart' | 'kunai' | 'shuriken' | 'boomerang' | 'spear' | 'blade' | 'saw' | 'disc' | 'star' | 'bolt' | 'magic' | 'shadow' | 'void' | 'holy' | 'dark' | 'vortex' | 'arrow_classic' | 'needle' | 'spike' | 'orb';
}

export interface Tower {
    id: number;
    key: string; 
    r: number;
    c: number;
    level: number;
    damage: number;
    range: number;
    cooldown: number;
    frame?: number; // Added to fix animation/ramp logic
    targetId: number | null;
    damageCharge: number;
    statusEffects?: ActiveStatusEffect[]; // Status effects currently applied
    baseDamage?: number; // Store base damage for effect calculations
    baseRange?: number; // Store base range for effect calculations
    baseCooldown?: number; // Store base cooldown for effect calculations
}

// --- PROJECTILES ---
export interface Projectile {
    id: number;
    x: number;
    y: number;
    tx: number; 
    ty: number; 
    startX?: number;
    startY?: number;
    speed: number;
    damage: number;
    color: string;
    progress: number; 
    type: 'arrow' | 'cannon' | 'laser' | 'magic' | 'hook';
    style: 'dot' | 'missile' | 'arc' | 'fire' | 'lightning' | 'arrow' | 'bullet' | 'energy' | 'plasma' | 'crystal' | 'poison' | 'ice' | 'acid' | 'laser' | 'sniper' | 'shotgun' | 'grenade' | 'cannonball' | 'rocket' | 'dart' | 'kunai' | 'shuriken' | 'boomerang' | 'spear' | 'blade' | 'saw' | 'disc' | 'star' | 'bolt' | 'magic' | 'shadow' | 'void' | 'holy' | 'dark' | 'vortex' | 'arrow_classic' | 'needle' | 'spike' | 'orb';
    targetId?: number;
    life?: number;
    maxLife?: number;
    splash?: number;
    special?: {
        pull?: number;
        slow?: number;
        stun?: number;
        area?: number;
    };
}

// DUMMY EXPORT TO KEEP FILE ALIVE IN JS MODE
export const TYPES_LOADED = true;
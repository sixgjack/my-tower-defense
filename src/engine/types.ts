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
export type EnemyAbility = 'teleport' | 'deactivate_towers' | 'heal_allies' | 'shield' | 'spawn_minions' | 'berserk' | 'camouflage' | 'regenerate' | 'explode' | 'charge' | 'retreat' | 'stun_attack' | 'poison_aura' | 'freeze_aura' | 'damage_reflect' | 'split' | 'fly' | 'burrow' | 'summon' | 'invisible' | 'slow_towers' | 'boss_shield' | 'attack_towers';

export type BossType = 'mini' | 'big';

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
    abilities?: EnemyAbility[]; // Special abilities
    abilityCooldown?: number; // Ability cooldown timer
    lastAbilityUse?: number; // Tick when ability was last used
    isInvisible?: boolean; // For camouflage ability
    isFlying?: boolean; // For fly ability
    isBurrowed?: boolean; // For burrow ability
    bossType?: BossType; // 'mini' or 'big' for bosses
    bossShieldHp?: number; // Shield HP for boss shield ability
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
    maxHp?: number;         // Tower health (default: 100)
    slowFactor?: number;   
    stunDuration?: number; 
    burnDamage?: number;   
    pullStrength?: number; 
    beamRamp?: number;     
    projectileSpeed?: number;
    areaRadius?: number;   
    multiTarget?: number;
    specialAbility?: 'stun' | 'slow' | 'pull' | 'block' | 'aoe' | 'drag'; // Special abilities
    projectileStyle?: 'dot' | 'missile' | 'arc' | 'fire' | 'lightning' | 'arrow' | 'bullet' | 'energy' | 'plasma' | 'crystal' | 'poison' | 'ice' | 'acid' | 'laser' | 'sniper' | 'shotgun' | 'grenade' | 'cannonball' | 'rocket' | 'dart' | 'kunai' | 'shuriken' | 'boomerang' | 'bloomerang' | 'spear' | 'blade' | 'saw' | 'disc' | 'star' | 'bolt' | 'magic' | 'shadow' | 'void' | 'holy' | 'dark' | 'vortex' | 'arrow_classic' | 'needle' | 'spike' | 'orb';
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
    hp?: number; // Current health
    maxHp?: number; // Maximum health
    angle?: number; // Rotation angle in degrees (0 = right, 90 = down)
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
    type: 'arrow' | 'cannon' | 'laser' | 'magic' | 'hook' | 'boomerang';
    style: 'dot' | 'missile' | 'arc' | 'fire' | 'lightning' | 'arrow' | 'bullet' | 'energy' | 'plasma' | 'crystal' | 'poison' | 'ice' | 'acid' | 'laser' | 'sniper' | 'shotgun' | 'grenade' | 'cannonball' | 'rocket' | 'dart' | 'kunai' | 'shuriken' | 'boomerang' | 'bloomerang' | 'spear' | 'blade' | 'saw' | 'disc' | 'star' | 'bolt' | 'magic' | 'shadow' | 'void' | 'holy' | 'dark' | 'vortex' | 'arrow_classic' | 'needle' | 'spike' | 'orb';
    targetId?: number;
    life?: number;
    maxLife?: number;
    splash?: number;
    returnToTower?: boolean; // For boomerang/bloomerang return logic
    returnProgress?: number; // Progress of return journey (0 to 1)
    pullStrength?: number; // For pull attacks
    hitTargets?: number[]; // For bloomerang - track which enemies have been hit
    firingTowerId?: number; // Track which tower fired this projectile
    special?: {
        pull?: number;
        slow?: number;
        stun?: number;
        area?: number;
    };
}

// DUMMY EXPORT TO KEEP FILE ALIVE IN JS MODE
export const TYPES_LOADED = true;
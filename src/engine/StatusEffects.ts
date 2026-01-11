// Status Effects System
// Based on Tower Defense Simulator and Arknights design patterns

export type EffectType = 'buff' | 'debuff' | 'damage' | 'heal' | 'disable' | 'modifier';

export interface StatusEffect {
    id: string;
    name: string;
    type: EffectType;
    duration: number; // -1 for permanent, >0 for ticks
    stackCount: number; // Maximum stacks (1 = cannot stack)
    priority: number; // Higher priority effects applied/removed first
    visualAura?: string; // Color for aura effect
    soundEffect?: string; // Sound to play when applied
    
    // Stat modifiers (percentage-based, can be negative)
    modifiers?: {
        speed?: number; // Percentage change to speed
        damage?: number; // Percentage change to damage
        defense?: number; // Percentage change to defense
        maxHp?: number; // Percentage change to max HP
        attackCooldown?: number; // Percentage change to attack cooldown
        attackRange?: number; // Percentage change to attack range
        range?: number; // Percentage change to tower range (towers only)
        cooldown?: number; // Percentage change to tower cooldown (towers only)
        cost?: number; // Percentage change to cost (towers only)
    };
    
    // Damage over time / healing over time
    tickDamage?: number; // Damage per tick
    tickHeal?: number; // Healing per tick
    
    // Special properties
    canStackWith?: string[]; // Effect IDs that can stack with this
    cannotStackWith?: string[]; // Effect IDs that cannot stack with this
    immunities?: string[]; // Damage types this effect provides immunity to
    partialImmunities?: Record<string, number>; // Partial immunities (type -> damage multiplier)
    
    // Callbacks
    onApply?: (target: any) => void;
    onTick?: (target: any) => void;
    onRemove?: (target: any) => void;
}

// Status Effect Registry
export const ENEMY_STATUS_EFFECTS: Record<string, StatusEffect> = {
    // Frostbite - Slow + DOT (extends our current frozen)
    'frostbite': {
        id: 'frostbite',
        name: 'Frostbite',
        type: 'debuff',
        duration: 300, // 5 seconds at 60fps
        stackCount: 1,
        priority: 5,
        visualAura: '#bfdbfe', // Light blue
        soundEffect: 'freeze',
        modifiers: {
            speed: -0.25, // -25% speed
        },
        tickDamage: 2, // 2 damage per tick (120 damage over 5 seconds at 60fps)
    },
    
    // Weakness - Stat reductions
    'weakness': {
        id: 'weakness',
        name: 'Weakness',
        type: 'debuff',
        duration: -1, // Permanent or temporary (set when applied)
        stackCount: 1,
        priority: 3,
        visualAura: '#94a3b8', // Gray
        soundEffect: 'weakness',
        modifiers: {
            speed: -0.15,
            damage: -0.05,
            defense: -0.05,
            attackCooldown: 0.15,
            attackRange: -0.05,
        },
    },
    
    // Resistance - Defense boost
    'resistance': {
        id: 'resistance',
        name: 'Resistance',
        type: 'buff',
        duration: -1,
        stackCount: 1,
        priority: 7,
        visualAura: '#3b82f6', // Blue
        soundEffect: 'buff',
        modifiers: {
            defense: 0.5, // +50% defense
            maxHp: 0.6, // +60% max HP
            speed: -0.5, // -50% speed (defensive stance)
        },
        cannotStackWith: ['prolific_growth'],
    },
    
    // Battle Surge - Temporary speed/damage boost
    'battle_surge': {
        id: 'battle_surge',
        name: 'Battle Surge',
        type: 'buff',
        duration: 180, // 3 seconds
        stackCount: 1,
        priority: 8,
        visualAura: '#fbbf24', // Yellow
        soundEffect: 'surge',
        modifiers: {
            speed: 0.25, // +25% speed (125% total)
            damage: 0.5, // +50% damage (150% total)
            defense: 0.05, // +5% defense
        },
    },
    
    // Prolific Growth - Regeneration + buffs
    'prolific_growth': {
        id: 'prolific_growth',
        name: 'Prolific Growth',
        type: 'buff',
        duration: -1,
        stackCount: 1,
        priority: 6,
        visualAura: '#10b981', // Green
        soundEffect: 'growth',
        modifiers: {
            speed: 0.05, // +5% speed
            defense: 0.05, // +5% defense (bosses)
        },
        tickHeal: 0.033, // ~2 HP/second (1 HP per 30 ticks)
        cannotStackWith: ['resistance'],
    },
};

export const TOWER_STATUS_EFFECTS: Record<string, StatusEffect> = {
    // Firerate Boost
    'firerate_boost': {
        id: 'firerate_boost',
        name: 'Firerate Boost',
        type: 'buff',
        duration: -1, // Permanent until removed
        stackCount: 10, // Can stack up to 10 times
        priority: 4,
        visualAura: '#10b981', // Green
        soundEffect: 'buff',
        modifiers: {
            cooldown: -0.1, // -10% cooldown per stack (faster attack)
        },
    },
    
    // Firerate Debuff
    'firerate_debuff': {
        id: 'firerate_debuff',
        name: 'Firerate Debuff',
        type: 'debuff',
        duration: -1,
        stackCount: 10,
        priority: 4,
        visualAura: '#ef4444', // Red
        soundEffect: 'debuff',
        modifiers: {
            cooldown: 0.1, // +10% cooldown per stack (slower attack)
        },
    },
    
    // Range Boost
    'range_boost': {
        id: 'range_boost',
        name: 'Range Boost',
        type: 'buff',
        duration: -1,
        stackCount: 5,
        priority: 5,
        visualAura: '#3b82f6', // Blue
        soundEffect: 'buff',
        modifiers: {
            range: 0.2, // +20% range per stack
        },
    },
    
    // Stunned
    'stunned': {
        id: 'stunned',
        name: 'Stunned',
        type: 'disable',
        duration: 180, // 3 seconds
        stackCount: 1,
        priority: 10, // Highest priority - disables everything
        visualAura: '#6366f1', // Indigo
        soundEffect: 'stun',
        modifiers: {
            cooldown: 999, // Effectively disables (1000% cooldown = never attacks)
        },
    },
    
    // Rage - Damage boost
    'rage': {
        id: 'rage',
        name: 'Rage',
        type: 'buff',
        duration: -1,
        stackCount: 5,
        priority: 6,
        visualAura: '#dc2626', // Dark red
        soundEffect: 'rage',
        modifiers: {
            damage: 0.2, // +20% damage per stack
        },
    },
    
    // Discount
    'discount': {
        id: 'discount',
        name: 'Discount',
        type: 'buff',
        duration: -1,
        stackCount: 5,
        priority: 2,
        visualAura: '#f59e0b', // Amber
        soundEffect: 'buff',
        modifiers: {
            cost: -0.1, // -10% cost per stack
        },
    },
};

// Active status effect instance (applied to an entity)
export interface ActiveStatusEffect {
    effectId: string;
    stacks: number;
    remainingDuration: number; // -1 for permanent
    appliedAt: number; // Tick when applied
}

// Helper to get all status effects
export function getAllStatusEffects(): Record<string, StatusEffect> {
    return { ...ENEMY_STATUS_EFFECTS, ...TOWER_STATUS_EFFECTS };
}

// Helper to get effect by ID
export function getStatusEffect(effectId: string): StatusEffect | undefined {
    const all = getAllStatusEffects();
    return all[effectId];
}

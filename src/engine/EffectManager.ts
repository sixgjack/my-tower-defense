// src/engine/EffectManager.ts
// Status Effects Manager - Handles applying, updating, and removing status effects

import { ENEMY_STATUS_EFFECTS, TOWER_STATUS_EFFECTS, type ActiveStatusEffect } from './StatusEffects';
import { soundSystem } from './SoundSystem';
import type { Enemy, Tower } from './types';

export class EffectManager {
    private static instance: EffectManager;
    
    static getInstance(): EffectManager {
        if (!EffectManager.instance) {
            EffectManager.instance = new EffectManager();
        }
        return EffectManager.instance;
    }

    /**
     * Apply a status effect to an enemy
     */
    applyEffectToEnemy(enemy: Enemy, effectId: string, duration?: number): boolean {
        const effect = ENEMY_STATUS_EFFECTS[effectId];
        if (!effect) {
            console.warn(`Unknown enemy effect: ${effectId}`);
            return false;
        }

        // Initialize statusEffects array if needed
        if (!enemy.statusEffects) {
            enemy.statusEffects = [];
        }

        // Check if effect already exists
        const existingIndex = enemy.statusEffects.findIndex(e => e.effectId === effectId);
        const existing = existingIndex >= 0 ? enemy.statusEffects[existingIndex] : null;

        // Check stacking rules
        if (existing) {
            // Check if we can stack
            if (existing.stacks >= effect.stackCount) {
                // Already at max stacks, refresh duration instead
                if (duration !== undefined && duration > 0) {
                    existing.remainingDuration = duration;
                }
                return false;
            }
            
            // Check cannotStackWith rules
            if (effect.cannotStackWith?.includes(effectId)) {
                // This shouldn't happen, but just refresh duration
                if (duration !== undefined && duration > 0) {
                    existing.remainingDuration = duration;
                }
                return false;
            }

            // Stack the effect
            existing.stacks++;
            if (duration !== undefined && duration > 0) {
                existing.remainingDuration = duration;
            }
            
            // Call onApply callback if it exists
            if (effect.onApply) {
                effect.onApply(enemy);
            }

            return true;
        }

        // Check cannotStackWith conflicts
        if (effect.cannotStackWith) {
            for (const conflictId of effect.cannotStackWith) {
                const conflictIndex = enemy.statusEffects.findIndex(e => e.effectId === conflictId);
                if (conflictIndex >= 0) {
                    // Remove conflicting effect
                    this.removeEffectFromEnemy(enemy, conflictId);
                }
            }
        }

        // Apply new effect
        const activeEffect: ActiveStatusEffect = {
            effectId,
            stacks: 1,
            remainingDuration: duration !== undefined ? duration : effect.duration,
            appliedAt: Date.now(), // Could use tick count if available
        };

        enemy.statusEffects.push(activeEffect);

        // Call onApply callback
        if (effect.onApply) {
            effect.onApply(enemy);
        }

        // Play sound effect
        if (effect.soundEffect) {
            soundSystem.play(effect.soundEffect as any);
        }

        // Initialize base stats if needed (for modifiers)
        if (effect.modifiers?.maxHp && !enemy.maxHp) {
            enemy.maxHp = enemy.hp;
        }

        return true;
    }

    /**
     * Apply a status effect to a tower
     */
    applyEffectToTower(tower: Tower, effectId: string, duration?: number): boolean {
        const effect = TOWER_STATUS_EFFECTS[effectId];
        if (!effect) {
            console.warn(`Unknown tower effect: ${effectId}`);
            return false;
        }

        // Initialize statusEffects array if needed
        if (!tower.statusEffects) {
            tower.statusEffects = [];
        }

        // Check if effect already exists
        const existingIndex = tower.statusEffects.findIndex(e => e.effectId === effectId);
        const existing = existingIndex >= 0 ? tower.statusEffects[existingIndex] : null;

        // Check stacking rules
        if (existing) {
            if (existing.stacks >= effect.stackCount) {
                // Already at max stacks, refresh duration
                if (duration !== undefined && duration > 0) {
                    existing.remainingDuration = duration;
                }
                return false;
            }

            // Stack the effect
            existing.stacks++;
            if (duration !== undefined && duration > 0) {
                existing.remainingDuration = duration;
            }

            if (effect.onApply) {
                effect.onApply(tower);
            }

            return true;
        }

        // Check cannotStackWith conflicts
        if (effect.cannotStackWith) {
            for (const conflictId of effect.cannotStackWith) {
                const conflictIndex = tower.statusEffects.findIndex(e => e.effectId === conflictId);
                if (conflictIndex >= 0) {
                    this.removeEffectFromTower(tower, conflictId);
                }
            }
        }

        // Apply new effect
        const activeEffect: ActiveStatusEffect = {
            effectId,
            stacks: 1,
            remainingDuration: duration !== undefined ? duration : effect.duration,
            appliedAt: Date.now(),
        };

        tower.statusEffects.push(activeEffect);

        // Call onApply callback
        if (effect.onApply) {
            effect.onApply(tower);
        }

        // Play sound effect
        if (effect.soundEffect) {
            soundSystem.play(effect.soundEffect as any);
        }

        // Initialize base stats if needed
        if (!tower.baseDamage) tower.baseDamage = tower.damage;
        if (!tower.baseRange) tower.baseRange = tower.range;
        if (!tower.baseCooldown) tower.baseCooldown = tower.cooldown;

        return true;
    }

    /**
     * Remove a status effect from an enemy
     */
    removeEffectFromEnemy(enemy: Enemy, effectId: string): boolean {
        if (!enemy.statusEffects) return false;

        const index = enemy.statusEffects.findIndex(e => e.effectId === effectId);
        if (index < 0) return false;

        const effect = ENEMY_STATUS_EFFECTS[effectId];
        
        // Call onRemove callback
        if (effect?.onRemove) {
            effect.onRemove(enemy);
        }

        enemy.statusEffects.splice(index, 1);
        return true;
    }

    /**
     * Remove a status effect from a tower
     */
    removeEffectFromTower(tower: Tower, effectId: string): boolean {
        if (!tower.statusEffects) return false;

        const index = tower.statusEffects.findIndex(e => e.effectId === effectId);
        if (index < 0) return false;

        const effect = TOWER_STATUS_EFFECTS[effectId];
        
        // Call onRemove callback
        if (effect?.onRemove) {
            effect.onRemove(tower);
        }

        tower.statusEffects.splice(index, 1);
        return true;
    }

    /**
     * Update status effects for an enemy (called each tick)
     */
    updateEnemyEffects(enemy: Enemy): void {
        if (!enemy.statusEffects || enemy.statusEffects.length === 0) return;

        // Process effects in priority order (highest first)
        const sortedEffects = [...enemy.statusEffects].sort((a, b) => {
            const effectA = ENEMY_STATUS_EFFECTS[a.effectId];
            const effectB = ENEMY_STATUS_EFFECTS[b.effectId];
            return (effectB?.priority || 0) - (effectA?.priority || 0);
        });

        for (const activeEffect of sortedEffects) {
            const effect = ENEMY_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect) continue;

            // Decrease duration (skip if permanent)
            if (activeEffect.remainingDuration > 0) {
                activeEffect.remainingDuration--;
                if (activeEffect.remainingDuration <= 0) {
                    // Effect expired
                    this.removeEffectFromEnemy(enemy, activeEffect.effectId);
                    continue;
                }
            }

            // Apply tick damage/healing
            if (effect.tickDamage && effect.tickDamage > 0) {
                const damage = effect.tickDamage * activeEffect.stacks;
                enemy.hp -= damage;
            }

            if (effect.tickHeal && effect.tickHeal > 0) {
                const heal = effect.tickHeal * activeEffect.stacks;
                const maxHp = enemy.maxHp || enemy.hp;
                enemy.hp = Math.min(enemy.hp + heal, maxHp);
            }

            // Call onTick callback
            if (effect.onTick) {
                effect.onTick(enemy);
            }
        }

        // Remove expired effects (cleanup)
        enemy.statusEffects = enemy.statusEffects.filter(e => {
            const effect = ENEMY_STATUS_EFFECTS[e.effectId];
            return effect && (e.remainingDuration < 0 || e.remainingDuration > 0);
        });
    }

    /**
     * Update status effects for a tower (called each tick)
     */
    updateTowerEffects(tower: Tower): void {
        if (!tower.statusEffects || tower.statusEffects.length === 0) return;

        const sortedEffects = [...tower.statusEffects].sort((a, b) => {
            const effectA = TOWER_STATUS_EFFECTS[a.effectId];
            const effectB = TOWER_STATUS_EFFECTS[b.effectId];
            return (effectB?.priority || 0) - (effectA?.priority || 0);
        });

        for (const activeEffect of sortedEffects) {
            const effect = TOWER_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect) continue;

            // Decrease duration
            if (activeEffect.remainingDuration > 0) {
                activeEffect.remainingDuration--;
                if (activeEffect.remainingDuration <= 0) {
                    this.removeEffectFromTower(tower, activeEffect.effectId);
                    continue;
                }
            }

            // Call onTick callback
            if (effect.onTick) {
                effect.onTick(tower);
            }
        }

        // Remove expired effects
        tower.statusEffects = tower.statusEffects.filter(e => {
            const effect = TOWER_STATUS_EFFECTS[e.effectId];
            return effect && (e.remainingDuration < 0 || e.remainingDuration > 0);
        });
    }

    /**
     * Calculate effective speed for an enemy based on status effects
     */
    getEffectiveEnemySpeed(enemy: Enemy, baseSpeed: number): number {
        if (!enemy.statusEffects || enemy.statusEffects.length === 0) {
            return baseSpeed;
        }

        let speedMultiplier = 1.0;

        for (const activeEffect of enemy.statusEffects) {
            const effect = ENEMY_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect?.modifiers?.speed) continue;

            // Apply modifier for each stack
            const modifier = effect.modifiers.speed * activeEffect.stacks;
            speedMultiplier += modifier;
        }

        return baseSpeed * Math.max(0, speedMultiplier); // Prevent negative speed
    }

    /**
     * Calculate effective damage for a tower based on status effects
     */
    getEffectiveTowerDamage(tower: Tower): number {
        if (!tower.baseDamage) return tower.damage;
        if (!tower.statusEffects || tower.statusEffects.length === 0) {
            return tower.baseDamage;
        }

        let damageMultiplier = 1.0;

        for (const activeEffect of tower.statusEffects) {
            const effect = TOWER_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect?.modifiers?.damage) continue;

            const modifier = effect.modifiers.damage * activeEffect.stacks;
            damageMultiplier += modifier;
        }

        return tower.baseDamage * Math.max(0.1, damageMultiplier); // Minimum 10% damage
    }

    /**
     * Calculate effective range for a tower based on status effects
     */
    getEffectiveTowerRange(tower: Tower): number {
        if (!tower.baseRange) return tower.range;
        if (!tower.statusEffects || tower.statusEffects.length === 0) {
            return tower.baseRange;
        }

        let rangeMultiplier = 1.0;

        for (const activeEffect of tower.statusEffects) {
            const effect = TOWER_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect?.modifiers?.range) continue;

            const modifier = effect.modifiers.range * activeEffect.stacks;
            rangeMultiplier += modifier;
        }

        return tower.baseRange * Math.max(0.1, rangeMultiplier);
    }

    /**
     * Calculate effective cooldown for a tower based on status effects
     */
    getEffectiveTowerCooldown(tower: Tower, baseCooldown: number): number {
        if (!tower.statusEffects || tower.statusEffects.length === 0) {
            return baseCooldown;
        }

        let cooldownMultiplier = 1.0;

        for (const activeEffect of tower.statusEffects) {
            const effect = TOWER_STATUS_EFFECTS[activeEffect.effectId];
            if (!effect?.modifiers?.cooldown) continue;

            const modifier = effect.modifiers.cooldown * activeEffect.stacks;
            cooldownMultiplier += modifier;
        }

        return baseCooldown * Math.max(0.01, cooldownMultiplier); // Minimum 1% cooldown
    }

    /**
     * Get the dominant aura color for an enemy (for visual rendering)
     */
    getEnemyAuraColor(enemy: Enemy): string | null {
        if (!enemy.statusEffects || enemy.statusEffects.length === 0) return null;

        // Get the highest priority effect's aura color
        const sortedEffects = [...enemy.statusEffects].sort((a, b) => {
            const effectA = ENEMY_STATUS_EFFECTS[a.effectId];
            const effectB = ENEMY_STATUS_EFFECTS[b.effectId];
            return (effectB?.priority || 0) - (effectA?.priority || 0);
        });

        const topEffect = ENEMY_STATUS_EFFECTS[sortedEffects[0].effectId];
        return topEffect?.visualAura || null;
    }

    /**
     * Get the dominant aura color for a tower (for visual rendering)
     */
    getTowerAuraColor(tower: Tower): string | null {
        if (!tower.statusEffects || tower.statusEffects.length === 0) return null;

        const sortedEffects = [...tower.statusEffects].sort((a, b) => {
            const effectA = TOWER_STATUS_EFFECTS[a.effectId];
            const effectB = TOWER_STATUS_EFFECTS[b.effectId];
            return (effectB?.priority || 0) - (effectA?.priority || 0);
        });

        const topEffect = TOWER_STATUS_EFFECTS[sortedEffects[0].effectId];
        return topEffect?.visualAura || null;
    }
}

// Export singleton instance
export const effectManager = EffectManager.getInstance();

# Tower Defense Status Effects & Mechanics Design Reference

This document consolidates design patterns from Tower Defense Simulator (TDS) and Arknights (PRTS) to inform our status effects system.

## Source References
- **Tower Defense Simulator Wiki**: https://tds.fandom.com/wiki/User_blog:ThirteenM/Statuses_and_Abilities
- **Arknights PRTS Wiki**: https://prts.wiki/

---

## Enemy Status Effects

### Core Design Principles
1. **Stackability Rules**: Some effects can stack, others cannot (e.g., Resistance cannot stack with Prolific Growth)
2. **Duration Types**: Permanent, temporary (timed), or conditional
3. **Visual Indicators**: Each effect should have clear visual feedback (auras, particles, animations)
4. **Scaling by Enemy Type**: Effects scale differently for Normal/Boss/Large Boss/Major Boss
5. **Interaction Rules**: Effects can interact (e.g., Battle Surge + Anger modifies stun duration)

### Enemy Status Effects from TDS

#### **Prolific Growth**
- **Visual**: Tumors/growths on enemy body
- **Effects**:
  - Regeneration (0-8 HP/second based on size)
  - Shield Regen (1-5 HP/second for bosses)
  - Defense boost (5-20%)
  - Speed boost (+5%)
  - Attack cooldown reduction (-10%)
  - Size increase
- **Stacking**: Cannot stack with Resistance

#### **Resistance**
- **Visual**: Blue Aura
- **Effects**:
  - Defense (25-75%)
  - Defense Regeneration (10%/30 seconds)
  - Defensive Stance (-50% speed, +60% max HP)
  - Shield Health (10-5000 based on size)
  - Shield Regen (2 HP/second for large bosses)
- **Stacking**: Cannot stack with Prolific Growth
- **Notes**: Defense regen disabled at half health for major bosses

#### **Battle Surge**
- **Visual**: Yellow Aura
- **Duration**: 2-5 seconds (temporary)
- **Effects**:
  - Speed +125%
  - Unit Damage +150%
  - Stun Duration +3 seconds
  - Ability Cooldown -1 second
  - 1 second invincibility at start
  - Defense +5%
  - Adds "Punch" ability to normal enemies (1s stun on towers)
- **Application**: Can spread to nearby enemies when boss uses ability
- **Notes**: Major Bosses cannot be affected

#### **Crystalized**
- **Effects**:
  - Immunities: Fire, Energy, Poison, Collision damage
  - Partial Immunity: Ranger, Accelerator Beam (50% damage)
  - Speed -95%
  - Max HP -15%
  - Defense +120%
- **Stacking**: Cannot stack with other effects
- **Notes**: Only Explosion Towers and Ranger can damage fully

#### **Frostbite**
- **Duration**: 5-18 seconds (temporary, damage over time)
- **Effects**:
  - Slowdown (5-25% based on size)
  - Damage per tick (2-130 based on size)
  - Total damage (10-2,340 based on size)
  - Incapacitation (1-3 seconds stun)
- **Notes**: Effect disappears after duration

#### **Weakness**
- **Type**: Permanent or temporary
- **Effects**:
  - Speed -15%
  - Attack Range -5%
  - Stun Duration -25%
  - Attack Cooldown +15%
  - Defense -5%
  - Removes Fire and Poison immunities

#### **Anger**
- **Effects**:
  - Unit Damage +100%
  - Attack Cooldown -100% (instant)
  - Stun Duration -50%
  - Attack Range +20%
  - Regeneration +2 HP/second
  - Speed +5%
- **Interaction**: When stacked with Battle Surge, stun bonus reduced by 50%
- **Notes**: Some enemies immune (Fallen Guardian, Unstable Ice, etc.)

#### **Void**
- **Effects**:
  - Unit Damage +25%
  - Regeneration (100 HP/minute)
  - Health Boost +5%
  - Teleport: After effect ends, enemy teleports 10 units further on path

#### **Withered**
- **Duration**: 1 to Infinity (decay effect)
- **Effects**:
  - Damage: 10 HP/second
  - Used for distraction enemies

#### **Defeated**
- **Trigger**: When major boss of wave is defeated
- **Effects**:
  - Defense: Starts at 15%, increases +0.2%/second to max 55%
  - Shield HP: 300 base + 10 per 100 HP remaining
  - Speed: +25% base, +5% for every 20% HP lost

---

## Tower Status Effects

### Core Design Principles
1. **Percentage-based**: Most effects use percentage multipliers
2. **Duration-based**: Some effects are temporary (timed)
3. **Immune Towers**: Some tower types are immune to certain effects
4. **Stackability**: Multiple buffs can stack (additively or multiplicatively)

### Tower Status Effects from TDS

#### **Firerate Boost**
- **Type**: Percentage boost
- **Effect**: Increases attack speed
- **Stacking**: Yes

#### **Range Boost**
- **Type**: Percentage boost
- **Effect**: Increases detection/attack range
- **Stacking**: Yes

#### **Discount**
- **Type**: Percentage reduction
- **Effect**: Decreases upgrade/build costs
- **Stacking**: Yes

#### **Firerate Debuff**
- **Type**: Percentage reduction
- **Effect**: Decreases attack speed
- **Stacking**: Yes (can be stacked with negative effects)

#### **Stunned**
- **Type**: Duration-based
- **Effect**: Completely disables tower from attacking
- **Duration**: Set duration (seconds)
- **Stacking**: No (binary state)

#### **Rage**
- **Type**: Percentage boost
- **Effect**: Increases damage dealt to enemies
- **Stacking**: Yes
- **Immune Towers**: Turret, Farm, Ace Pilot, Pursuit, Gladiator, DJ Booth, Military Base, Elf Camp, Warden

---

## Arknights Design Patterns (PRTS)

### Operator (Tower) Attributes
- **Attack Speed**: Base attack interval (similar to cooldown)
- **DP Cost**: Deployment cost (similar to tower cost)
- **Block Count**: How many enemies can be blocked
- **Redeploy Time**: Cooldown before redeployment
- **Respawn Time**: Similar to tower rebuild time

### Enemy Attributes
- **Weight**: Affects push/pull mechanics
- **Movement Speed**: Base movement speed
- **Attack Range**: Some enemies can attack towers
- **Resistances**: Physical/Arts (magic) resistance percentages
- **Tags**: Categories (Elite, Boss, Aerial, etc.)

### Status Effects (Buffs/Debuffs)
- **Stun**: Disables actions
- **Freeze**: Movement and attack disabled, takes extra damage
- **Slow**: Reduces movement speed
- **Bind**: Prevents movement but allows attacks
- **Sleep**: Complete disable, takes extra damage on hit
- **Levitate**: Aerial state, affects which operators can target
- **Invisible**: Cannot be targeted until revealed
- **Camouflage**: Reduced priority for targeting

### Damage Types
- **Physical**: Standard damage, reduced by DEF
- **Arts**: Magic damage, reduced by RES
- **True Damage**: Ignores all defenses
- **Elemental Damage**: Fire, Ice, Lightning, etc.

### Recovery Mechanics
- **HP Regen**: Passive healing over time
- **SP Regen**: Skill point regeneration (similar to ability cooldown)
- **Shield**: Temporary HP buffer

---

## Design Recommendations for Our Game

### Status Effect System Architecture

#### 1. Effect Types
```typescript
type EffectType = 
  | 'buff'      // Positive effect
  | 'debuff'    // Negative effect
  | 'damage'    // Damage over time
  | 'heal'      // Healing over time
  | 'disable'   // Completely disables actions
  | 'modifier'  // Modifies stats (speed, damage, etc.)
```

#### 2. Effect Properties
- **id**: Unique identifier
- **name**: Display name
- **type**: EffectType
- **duration**: Number of ticks (-1 for permanent)
- **stackCount**: Maximum stacks (1 = cannot stack)
- **priority**: Stacking priority
- **visualAura**: Color/particle effect
- **onApply**: Function to apply effect
- **onTick**: Function called each tick
- **onRemove**: Function when effect expires
- **canStackWith**: Array of effect IDs that can stack together

#### 3. Stat Modifiers
Effects should modify these core stats:
- **Enemies**: HP, MaxHP, Speed, Defense, Damage, AttackCooldown, AttackRange
- **Towers**: Damage, Range, Cooldown, Cost, (future: MultiTarget, AreaRadius)

#### 4. Visual Feedback Requirements
- **Aura Colors**: Each effect needs distinct color
- **Particle Effects**: Visual indicators (sparks, ice, fire, etc.)
- **UI Indicators**: Status bar or icons above entities
- **Animation States**: Affected animations (slowed, frozen, etc.)

#### 5. Implementation Priority

**Phase 1: Core Effects (Enemy)**
1. Frostbite (slow + DOT) - Already have frozen, extend it
2. Weakness (stat reduction)
3. Resistance (defense boost)
4. Battle Surge (temporary speed/damage boost)

**Phase 2: Core Effects (Tower)**
1. Firerate Boost/Debuff
2. Range Boost
3. Stunned
4. Rage (damage boost)

**Phase 3: Advanced Effects**
1. Stacking rules
2. Effect interactions
3. Visual auras
4. Complex effects (Crystalized, Void, etc.)

---

## Key Design Takeaways

1. **Scalability**: Effects should scale with enemy/tower level and type
2. **Balance**: Positive and negative effects should be equally impactful
3. **Clarity**: Visual feedback is critical for player understanding
4. **Stacking Rules**: Clear rules prevent overpowered combinations
5. **Duration Types**: Mix of permanent, temporary, and conditional effects
6. **Interaction Depth**: Effects should interact in interesting ways
7. **Performance**: Efficient tick-based updates (60fps = 60 ticks/second)

---

## Next Steps

1. Design TypeScript interfaces for the effect system
2. Implement effect manager/registry
3. Create visual rendering system for effects
4. Integrate with existing enemy/tower systems
5. Test and balance effect values
6. Add effect application from towers/projectiles
7. Implement effect stacking and interaction rules

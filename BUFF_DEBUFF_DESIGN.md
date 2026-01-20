# Buff/Debuff System Design

## Rarity Levels (稀有度)

- **Common (普通)**: White/Gray - Weakest effects
- **Rare (稀有)**: Blue - Moderate effects  
- **Epic (史詩)**: Purple - Strong effects
- **Legendary (傳說)**: Orange/Gold - Most powerful effects

## Duration Types

1. **Wave-based**: Lasts for X waves (stackable)
2. **Combat-based**: Lasts entire combat (non-stackable, small values ~5%)

---

## BUFFS (增益) - 20 Types

### 1. Damage Boost (傷害提升)
- **Common**: +10% damage for 3 waves
- **Rare**: +20% damage for 3 waves
- **Epic**: +30% damage for 5 waves
- **Legendary**: +50% damage for 5 waves

### 2. Attack Speed Boost (攻速提升)
- **Common**: +10% attack speed for 3 waves
- **Rare**: +20% attack speed for 3 waves
- **Epic**: +30% attack speed for 5 waves
- **Legendary**: +50% attack speed for 5 waves

### 3. Range Boost (射程提升)
- **Common**: +10% range for 3 waves
- **Rare**: +20% range for 3 waves
- **Epic**: +30% range for 5 waves
- **Legendary**: +50% range for 5 waves

### 4. Critical Strike (暴擊)
- **Common**: 10% crit chance, +50% crit damage for 3 waves
- **Rare**: 15% crit chance, +75% crit damage for 3 waves
- **Epic**: 20% crit chance, +100% crit damage for 5 waves
- **Legendary**: 30% crit chance, +150% crit damage for 5 waves

### 5. Multi-Shot (多重射擊)
- **Common**: 15% chance to shoot 2 projectiles for 3 waves
- **Rare**: 25% chance to shoot 2 projectiles for 3 waves
- **Epic**: 35% chance to shoot 3 projectiles for 5 waves
- **Legendary**: 50% chance to shoot 3 projectiles for 5 waves

### 6. Piercing Shots (穿透射擊)
- **Common**: Projectiles pierce 1 extra enemy for 3 waves
- **Rare**: Projectiles pierce 2 extra enemies for 3 waves
- **Epic**: Projectiles pierce 3 extra enemies for 5 waves
- **Legendary**: Projectiles pierce 5 extra enemies for 5 waves

### 7. Money Boost (金錢增益)
- **Common**: +10% money earned for 3 waves
- **Rare**: +20% money earned for 3 waves
- **Epic**: +30% money earned for 5 waves
- **Legendary**: +50% money earned for 5 waves

### 8. Tower Discount (折扣)
- **Common**: -10% tower cost for 3 waves
- **Rare**: -20% tower cost for 3 waves
- **Epic**: -30% tower cost for 5 waves
- **Legendary**: -40% tower cost for 5 waves

### 9. Lifesaver (救命稻草)
- **Common**: +1 life
- **Rare**: +2 lives
- **Epic**: +3 lives
- **Legendary**: +5 lives

### 10. Shield Generator (護盾生成)
- **Common**: Towers gain 10% max HP shield for 3 waves
- **Rare**: Towers gain 20% max HP shield for 3 waves
- **Epic**: Towers gain 30% max HP shield for 5 waves
- **Legendary**: Towers gain 50% max HP shield for 5 waves

### 11. Status Immunity (狀態免疫)
- **Common**: Towers immune to 1 debuff type for 3 waves
- **Rare**: Towers immune to 2 debuff types for 3 waves
- **Epic**: Towers immune to all debuffs for 5 waves
- **Legendary**: Towers immune to all debuffs for entire combat

### 12. Rapid Fire (急速射擊)
- **Common**: First shot fires instantly for 3 waves
- **Rare**: First 2 shots fire instantly for 3 waves
- **Epic**: First 3 shots fire instantly for 5 waves
- **Legendary**: First 5 shots fire instantly for 5 waves

### 13. Damage Over Time (持續傷害)
- **Common**: Towers deal +5% damage as DOT for 3 waves
- **Rare**: Towers deal +10% damage as DOT for 3 waves
- **Epic**: Towers deal +15% damage as DOT for 5 waves
- **Legendary**: Towers deal +25% damage as DOT for 5 waves

### 14. Armor Penetration (護甲穿透)
- **Common**: Ignore 10% enemy armor for 3 waves
- **Rare**: Ignore 20% enemy armor for 3 waves
- **Epic**: Ignore 30% enemy armor for 5 waves
- **Legendary**: Ignore 50% enemy armor for 5 waves

### 15. Chain Lightning (連鎖閃電)
- **Common**: 20% chance to chain to 1 nearby enemy for 3 waves
- **Rare**: 30% chance to chain to 2 nearby enemies for 3 waves
- **Epic**: 40% chance to chain to 3 nearby enemies for 5 waves
- **Legendary**: 50% chance to chain to 5 nearby enemies for 5 waves

### 16. Regeneration (再生)
- **Common**: Towers heal 1% HP per second for 3 waves
- **Rare**: Towers heal 2% HP per second for 3 waves
- **Epic**: Towers heal 3% HP per second for 5 waves
- **Legendary**: Towers heal 5% HP per second for 5 waves

### 17. Mana Surge (魔力湧動)
- **Common**: -10% cooldown for 3 waves
- **Rare**: -20% cooldown for 3 waves
- **Epic**: -30% cooldown for 5 waves
- **Legendary**: -40% cooldown for 5 waves

### 18. Lucky Strike (幸運一擊)
- **Common**: 5% chance to deal 200% damage for 3 waves
- **Rare**: 8% chance to deal 250% damage for 3 waves
- **Epic**: 12% chance to deal 300% damage for 5 waves
- **Legendary**: 20% chance to deal 400% damage for 5 waves

### 19. Bonus XP (經驗增益)
- **Common**: +5% credits earned for entire combat
- **Rare**: +8% credits earned for entire combat
- **Epic**: +12% credits earned for entire combat
- **Legendary**: +20% credits earned for entire combat

### 20. Fortification (強化)
- **Common**: +5% tower max HP for entire combat
- **Rare**: +8% tower max HP for entire combat
- **Epic**: +12% tower max HP for entire combat
- **Legendary**: +20% tower max HP for entire combat

---

## DEBUFFS (減益) - 20 Types

### 1. Damage Reduction (傷害減少)
- **Common**: -10% damage for 3 waves
- **Rare**: -20% damage for 3 waves
- **Epic**: -30% damage for 5 waves
- **Legendary**: -50% damage for 5 waves

### 2. Attack Speed Slow (攻速減慢)
- **Common**: -10% attack speed for 3 waves
- **Rare**: -20% attack speed for 3 waves
- **Epic**: -30% attack speed for 5 waves
- **Legendary**: -50% attack speed for 5 waves

### 3. Range Reduction (射程減少)
- **Common**: -10% range for 3 waves
- **Rare**: -20% range for 3 waves
- **Epic**: -30% range for 5 waves
- **Legendary**: -40% range for 5 waves

### 4. Enemy Speed Boost (敵人加速)
- **Common**: Enemies move +10% faster for 3 waves
- **Rare**: Enemies move +20% faster for 3 waves
- **Epic**: Enemies move +30% faster for 5 waves
- **Legendary**: Enemies move +50% faster for 5 waves

### 5. Enemy HP Boost (敵人血量提升)
- **Common**: Enemies have +10% HP for 3 waves
- **Rare**: Enemies have +20% HP for 3 waves
- **Epic**: Enemies have +30% HP for 5 waves
- **Legendary**: Enemies have +50% HP for 5 waves

### 6. Enemy Armor (敵人護甲)
- **Common**: Enemies have +10% damage reduction for 3 waves
- **Rare**: Enemies have +20% damage reduction for 3 waves
- **Epic**: Enemies have +30% damage reduction for 5 waves
- **Legendary**: Enemies have +50% damage reduction for 5 waves

### 7. Money Reduction (金錢減少)
- **Common**: -10% money earned for 3 waves
- **Rare**: -20% money earned for 3 waves
- **Epic**: -30% money earned for 5 waves
- **Legendary**: -50% money earned for 5 waves

### 8. Tower Cost Increase (成本增加)
- **Common**: +10% tower cost for 3 waves
- **Rare**: +20% tower cost for 3 waves
- **Epic**: +30% tower cost for 5 waves
- **Legendary**: +50% tower cost for 5 waves

### 9. Life Drain (生命流失)
- **Common**: -1 life
- **Rare**: -2 lives
- **Epic**: -3 lives
- **Legendary**: -5 lives

### 10. Vulnerability (易傷)
- **Common**: Towers take +10% damage for 3 waves
- **Rare**: Towers take +20% damage for 3 waves
- **Epic**: Towers take +30% damage for 5 waves
- **Legendary**: Towers take +50% damage for 5 waves

### 11. Slow Effect (減速效果)
- **Common**: Towers attack 10% slower permanently for entire combat
- **Rare**: Towers attack 15% slower permanently for entire combat
- **Epic**: Towers attack 20% slower permanently for entire combat
- **Legendary**: Towers attack 30% slower permanently for entire combat

### 12. Reduced Effectiveness (效果減弱)
- **Common**: All tower special effects -10% effectiveness for 3 waves
- **Rare**: All tower special effects -20% effectiveness for 3 waves
- **Epic**: All tower special effects -30% effectiveness for 5 waves
- **Legendary**: All tower special effects -50% effectiveness for 5 waves

### 13. Energy Drain (能量流失)
- **Common**: +10% cooldown for 3 waves
- **Rare**: +20% cooldown for 3 waves
- **Epic**: +30% cooldown for 5 waves
- **Legendary**: +50% cooldown for 5 waves

### 14. Miss Chance (失誤機率)
- **Common**: 5% chance attacks miss for 3 waves
- **Rare**: 10% chance attacks miss for 3 waves
- **Epic**: 15% chance attacks miss for 5 waves
- **Legendary**: 25% chance attacks miss for 5 waves

### 15. Enemy Regeneration (敵人再生)
- **Common**: Enemies heal 1% HP per second for 3 waves
- **Rare**: Enemies heal 2% HP per second for 3 waves
- **Epic**: Enemies heal 3% HP per second for 5 waves
- **Legendary**: Enemies heal 5% HP per second for 5 waves

### 16. Reduced Rewards (獎勵減少)
- **Common**: -5% credits earned for entire combat
- **Rare**: -8% credits earned for entire combat
- **Epic**: -12% credits earned for entire combat
- **Legendary**: -20% credits earned for entire combat

### 17. Tower Weakness (塔防弱化)
- **Common**: -5% tower max HP for entire combat
- **Rare**: -8% tower max HP for entire combat
- **Epic**: -12% tower max HP for entire combat
- **Legendary**: -20% tower max HP for entire combat

### 18. Disable Special Abilities (禁用特殊能力)
- **Common**: 1 tower type loses special ability for 3 waves
- **Rare**: 2 tower types lose special abilities for 3 waves
- **Epic**: 3 tower types lose special abilities for 5 waves
- **Legendary**: All towers lose special abilities for 5 waves

### 19. Enemy Spawn Boost (敵人生成提升)
- **Common**: +10% more enemies spawn for 3 waves
- **Rare**: +20% more enemies spawn for 3 waves
- **Epic**: +30% more enemies spawn for 5 waves
- **Legendary**: +50% more enemies spawn for 5 waves

### 20. Curse of Misfortune (厄運詛咒)
- **Common**: 5% chance for negative events for entire combat
- **Rare**: 8% chance for negative events for entire combat
- **Epic**: 12% chance for negative events for entire combat
- **Legendary**: 20% chance for negative events for entire combat

---

## Notes for Implementation

1. **Wave-based buffs** should stack multiplicatively (not additively)
2. **Combat-based buffs** should not stack, only strongest applies
3. **Rarity distribution** for random generation:
   - Common: 60%
   - Rare: 25%
   - Epic: 12%
   - Legendary: 3%

4. **Visual indicators**:
   - Show buff/debuff icons in UI
   - Display remaining wave count
   - Color code by rarity

5. **Balance considerations**:
   - Combat-long effects should be small (~5%) to avoid overpowering
   - Wave effects can be stronger since they're temporary
   - Legendary effects should feel impactful but not game-breaking

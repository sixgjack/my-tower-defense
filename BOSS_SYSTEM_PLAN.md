# Boss System Implementation Plan

## Requirements:
1. Mini-boss every 5 waves (but NOT on wave 10, which is big boss)
2. Big boss every 10 waves
3. Boss abilities: shield, slow towers, disable towers, etc.
4. Longer routes for more overpowered bosses
5. Boss deals more HP damage if reaches end (based on boss type)

## Implementation Steps:
1. ✅ Update types.ts - Added BossType, bossType, bossShieldHp to Enemy interface
2. ✅ Create BossAbilities.ts - Helper function for applying damage with shield
3. ⏳ Update spawnEnemy - Distinguish mini/big bosses, add abilities, set boss properties
4. ⏳ Update startWave - Already done (mini/big boss notifications)
5. ⏳ Update base hit damage - Scale with boss type (3 for mini, 8 for big)
6. ⏳ Update all damage application - Use applyDamageToEnemy
7. ⏳ Add slow_towers ability handler - In executeEnemyAbilities
8. ⏳ Fix map generation - Add pathLengthMultiplier support (optional - can skip for now)
9. ⏳ Fix compilation errors - Remove unused parameters

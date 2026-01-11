// src/engine/BossAbilities.ts
// Helper functions for boss special abilities

export function applyDamageToEnemy(enemy: any, damage: number): number {
  // If enemy has boss shield, damage goes to shield first
  if (enemy.bossType && enemy.bossShieldHp !== undefined && enemy.bossShieldHp > 0) {
    const shieldDamage = Math.min(damage, enemy.bossShieldHp);
    enemy.bossShieldHp -= shieldDamage;
    const remainingDamage = damage - shieldDamage;
    
    // Apply remaining damage to HP
    if (remainingDamage > 0) {
      enemy.hp -= remainingDamage;
    }
    
    return remainingDamage; // Return actual HP damage dealt
  } else {
    enemy.hp -= damage;
    return damage;
  }
}

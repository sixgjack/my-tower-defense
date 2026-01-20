// src/engine/buffSystem.ts
// Buff system for roguelike rewards and theme effects

export type BuffType = 'buff' | 'debuff';
export type BuffRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type DurationType = 'wave' | 'permanent';

export interface BuffDefinition {
  id: string;
  name: string;
  nameZh: string;
  type: BuffType;
  rarity: BuffRarity;
  waves?: number; // Duration in waves (if durationType is 'wave')
  durationType: DurationType;
  
  // Stat multipliers (percentage-based)
  damageMultiplier?: number;
  attackSpeedMultiplier?: number;
  rangeMultiplier?: number;
  moneyMultiplier?: number;
  enemySpeedMultiplier?: number; // Negative = enemies slower
  enemyHpMultiplier?: number; // Negative = enemies have less HP
  
  // Direct changes
  livesChange?: number; // + or - lives
}

// Buff definitions pool
const BUFF_DEFINITIONS: BuffDefinition[] = [
  // COMMON BUFFS
  {
    id: 'dmg_boost_5',
    name: 'Power Surge',
    nameZh: '力量湧動',
    type: 'buff',
    rarity: 'common',
    damageMultiplier: 0.05,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'speed_boost_10',
    name: 'Rapid Fire',
    nameZh: '急速射擊',
    type: 'buff',
    rarity: 'common',
    attackSpeedMultiplier: 0.10,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'range_boost_15',
    name: 'Extended Reach',
    nameZh: '延伸射程',
    type: 'buff',
    rarity: 'common',
    rangeMultiplier: 0.15,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'money_boost_20',
    name: 'Wealth Bonus',
    nameZh: '財富加成',
    type: 'buff',
    rarity: 'common',
    moneyMultiplier: 0.20,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'enemy_slow_15',
    name: 'Slowing Field',
    nameZh: '減速力場',
    type: 'buff',
    rarity: 'common',
    enemySpeedMultiplier: -0.15,
    waves: 3,
    durationType: 'wave'
  },
  
  // RARE BUFFS
  {
    id: 'dmg_boost_15',
    name: 'Power Overload',
    nameZh: '力量超載',
    type: 'buff',
    rarity: 'rare',
    damageMultiplier: 0.15,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'speed_boost_25',
    name: 'Lightning Strikes',
    nameZh: '閃電打擊',
    type: 'buff',
    rarity: 'rare',
    attackSpeedMultiplier: 0.25,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'range_boost_25',
    name: 'Long Range',
    nameZh: '長程射擊',
    type: 'buff',
    rarity: 'rare',
    rangeMultiplier: 0.25,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'combo_boost',
    name: 'Combo Master',
    nameZh: '連擊大師',
    type: 'buff',
    rarity: 'rare',
    damageMultiplier: 0.10,
    attackSpeedMultiplier: 0.10,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'enemy_slow_25',
    name: 'Time Dilation',
    nameZh: '時間膨脹',
    type: 'buff',
    rarity: 'rare',
    enemySpeedMultiplier: -0.25,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'money_boost_30',
    name: 'Gold Rush',
    nameZh: '淘金熱',
    type: 'buff',
    rarity: 'rare',
    moneyMultiplier: 0.30,
    waves: 5,
    durationType: 'wave'
  },
  
  // EPIC BUFFS
  {
    id: 'dmg_boost_30',
    name: 'Devastation',
    nameZh: '毀滅',
    type: 'buff',
    rarity: 'epic',
    damageMultiplier: 0.30,
    waves: 7,
    durationType: 'wave'
  },
  {
    id: 'speed_boost_40',
    name: 'Supersonic',
    nameZh: '超音速',
    type: 'buff',
    rarity: 'epic',
    attackSpeedMultiplier: 0.40,
    waves: 7,
    durationType: 'wave'
  },
  {
    id: 'ultimate_boost',
    name: 'Perfect Storm',
    nameZh: '完美風暴',
    type: 'buff',
    rarity: 'epic',
    damageMultiplier: 0.15,
    attackSpeedMultiplier: 0.15,
    rangeMultiplier: 0.15,
    waves: 7,
    durationType: 'wave'
  },
  {
    id: 'enemy_weak_30',
    name: 'Enemy Debilitation',
    nameZh: '敵人虛弱',
    type: 'buff',
    rarity: 'epic',
    enemySpeedMultiplier: -0.30,
    enemyHpMultiplier: -0.20,
    waves: 7,
    durationType: 'wave'
  },
  {
    id: 'money_boost_50',
    name: 'Treasure Trove',
    nameZh: '寶藏庫',
    type: 'buff',
    rarity: 'epic',
    moneyMultiplier: 0.50,
    waves: 7,
    durationType: 'wave'
  },
  {
    id: 'lives_plus_1',
    name: 'Extra Life',
    nameZh: '額外生命',
    type: 'buff',
    rarity: 'epic',
    livesChange: 1,
    durationType: 'permanent'
  },
  
  // LEGENDARY BUFFS
  {
    id: 'dmg_boost_50',
    name: 'Annihilation',
    nameZh: '殲滅',
    type: 'buff',
    rarity: 'legendary',
    damageMultiplier: 0.50,
    waves: 10,
    durationType: 'wave'
  },
  {
    id: 'speed_boost_60',
    name: 'Time Stop',
    nameZh: '時間停止',
    type: 'buff',
    rarity: 'legendary',
    attackSpeedMultiplier: 0.60,
    waves: 10,
    durationType: 'wave'
  },
  {
    id: 'god_mode',
    name: 'Divine Power',
    nameZh: '神力',
    type: 'buff',
    rarity: 'legendary',
    damageMultiplier: 0.25,
    attackSpeedMultiplier: 0.25,
    rangeMultiplier: 0.25,
    moneyMultiplier: 0.25,
    waves: 10,
    durationType: 'wave'
  },
  {
    id: 'enemy_cripple',
    name: 'Total Domination',
    nameZh: '完全支配',
    type: 'buff',
    rarity: 'legendary',
    enemySpeedMultiplier: -0.50,
    enemyHpMultiplier: -0.30,
    waves: 10,
    durationType: 'wave'
  },
  {
    id: 'lives_plus_3',
    name: 'Multiple Lives',
    nameZh: '多重生命',
    type: 'buff',
    rarity: 'legendary',
    livesChange: 3,
    durationType: 'permanent'
  },
  
  // COMMON DEBUFFS (for theme effects)
  {
    id: 'dmg_penalty_5',
    name: 'Power Drain',
    nameZh: '力量流失',
    type: 'debuff',
    rarity: 'common',
    damageMultiplier: -0.05,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'speed_penalty_10',
    name: 'Heavy Burden',
    nameZh: '沉重負擔',
    type: 'debuff',
    rarity: 'common',
    attackSpeedMultiplier: -0.10,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'range_penalty_10',
    name: 'Reduced Vision',
    nameZh: '視野縮小',
    type: 'debuff',
    rarity: 'common',
    rangeMultiplier: -0.10,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'enemy_fast_20',
    name: 'Rush Hour',
    nameZh: '高峰時段',
    type: 'debuff',
    rarity: 'common',
    enemySpeedMultiplier: 0.20,
    waves: 3,
    durationType: 'wave'
  },
  {
    id: 'enemy_tank_25',
    name: 'Armored Foes',
    nameZh: '裝甲敵人',
    type: 'debuff',
    rarity: 'common',
    enemyHpMultiplier: 0.25,
    waves: 3,
    durationType: 'wave'
  },
  
  // RARE DEBUFFS
  {
    id: 'dmg_penalty_15',
    name: 'Critical Weakness',
    nameZh: '致命弱點',
    type: 'debuff',
    rarity: 'rare',
    damageMultiplier: -0.15,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'speed_penalty_25',
    name: 'Crippling Slowdown',
    nameZh: '致殘減速',
    type: 'debuff',
    rarity: 'rare',
    attackSpeedMultiplier: -0.25,
    waves: 5,
    durationType: 'wave'
  },
  {
    id: 'double_trouble',
    name: 'Double Trouble',
    nameZh: '雙重麻煩',
    type: 'debuff',
    rarity: 'rare',
    enemySpeedMultiplier: 0.30,
    enemyHpMultiplier: 0.30,
    waves: 5,
    durationType: 'wave'
  },
];

// Debuff definitions pool
const DEBUFF_DEFINITIONS: BuffDefinition[] = BUFF_DEFINITIONS.filter(b => b.type === 'debuff');

/**
 * Generate a random buff of specified type and rarity
 */
export function generateRandomBuff(
  type: BuffType,
  rarity?: BuffRarity
): BuffDefinition {
  const pool = type === 'buff' 
    ? BUFF_DEFINITIONS.filter(b => b.type === 'buff')
    : DEBUFF_DEFINITIONS;
  
  // Filter by rarity if specified
  let filteredPool = pool;
  if (rarity) {
    filteredPool = pool.filter(b => b.rarity === rarity);
  }
  
  // If no matches, fall back to common
  if (filteredPool.length === 0) {
    filteredPool = pool.filter(b => b.rarity === 'common');
  }
  
  // Random selection with rarity weighting
  if (!rarity) {
    const weightedPool: BuffDefinition[] = [];
    for (const buff of filteredPool) {
      const weight = 
        buff.rarity === 'legendary' ? 1 :
        buff.rarity === 'epic' ? 3 :
        buff.rarity === 'rare' ? 5 : 10;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(buff);
      }
    }
    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
  }
  
  return filteredPool[Math.floor(Math.random() * filteredPool.length)];
}

/**
 * Generate 3 random buffs for 3-pick-1 selection (for roguelike rewards)
 */
export function generateBuffChoices(rarity?: BuffRarity): BuffDefinition[] {
  const choices: BuffDefinition[] = [];
  const usedIds = new Set<string>();
  
  // If rarity not specified, determine based on wave
  // This should be called with wave number from GameEngine
  const effectiveRarity = rarity || 'common';
  
  for (let i = 0; i < 3; i++) {
    let buff: BuffDefinition;
    let attempts = 0;
    do {
      buff = generateRandomBuff('buff', effectiveRarity);
      attempts++;
      if (attempts > 50) break; // Prevent infinite loop
    } while (usedIds.has(buff.id));
    
    usedIds.add(buff.id);
    choices.push(buff);
  }
  
  return choices;
}

/**
 * Get buff description with details and percentages
 */
export function getBuffDescription(buff: BuffDefinition, lang: 'en' | 'zh'): string {
  const name = lang === 'zh' ? buff.nameZh : buff.name;
  const rarity = buff.rarity;
  
  const parts: string[] = [];
  
  if (buff.damageMultiplier) {
    const val = Math.abs(buff.damageMultiplier * 100);
    parts.push(lang === 'zh' 
      ? `傷害 ${buff.type === 'buff' ? '+' : '-'}${val}%`
      : `Damage ${buff.type === 'buff' ? '+' : '-'}${val}%`);
  }
  
  if (buff.attackSpeedMultiplier) {
    const val = Math.abs(buff.attackSpeedMultiplier * 100);
    parts.push(lang === 'zh'
      ? `攻速 ${buff.type === 'buff' ? '+' : '-'}${val}%`
      : `Attack Speed ${buff.type === 'buff' ? '+' : '-'}${val}%`);
  }
  
  if (buff.rangeMultiplier) {
    const val = Math.abs(buff.rangeMultiplier * 100);
    parts.push(lang === 'zh'
      ? `射程 ${buff.type === 'buff' ? '+' : '-'}${val}%`
      : `Range ${buff.type === 'buff' ? '+' : '-'}${val}%`);
  }
  
  if (buff.moneyMultiplier) {
    const val = Math.abs(buff.moneyMultiplier * 100);
    parts.push(lang === 'zh'
      ? `金錢 ${buff.type === 'buff' ? '+' : '-'}${val}%`
      : `Money ${buff.type === 'buff' ? '+' : '-'}${val}%`);
  }
  
  if (buff.enemySpeedMultiplier) {
    const val = Math.abs(buff.enemySpeedMultiplier * 100);
    parts.push(lang === 'zh'
      ? `敵人速度 ${buff.type === 'buff' ? '-' : '+'}${val}%`
      : `Enemy Speed ${buff.type === 'buff' ? '-' : '+'}${val}%`);
  }
  
  if (buff.enemyHpMultiplier) {
    const val = Math.abs(buff.enemyHpMultiplier * 100);
    parts.push(lang === 'zh'
      ? `敵人血量 ${buff.type === 'buff' ? '-' : '+'}${val}%`
      : `Enemy HP ${buff.type === 'buff' ? '-' : '+'}${val}%`);
  }
  
  if (buff.livesChange) {
    parts.push(lang === 'zh'
      ? `生命 ${buff.type === 'buff' ? '+' : '-'}${buff.livesChange}`
      : `Lives ${buff.type === 'buff' ? '+' : '-'}${buff.livesChange}`);
  }
  
  const duration = buff.durationType === 'wave' && buff.waves
    ? (lang === 'zh' ? `持續 ${buff.waves} 波` : `for ${buff.waves} waves`)
    : (lang === 'zh' ? '永久' : 'permanent');
  
  const details = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  const rarityLabel = lang === 'zh'
    ? (rarity === 'legendary' ? '傳說' : rarity === 'epic' ? '史詩' : rarity === 'rare' ? '稀有' : '普通')
    : rarity.charAt(0).toUpperCase() + rarity.slice(1);
  
  return `${name}${details} - ${duration} [${rarityLabel}]`;
}

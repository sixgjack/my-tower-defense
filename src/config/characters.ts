export interface CommanderAbility {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  cooldown: number; // seconds
  icon: string; // text icon (no emoji — use ASCII art like [X] or text)
}

export interface Commander {
  id: string;
  name: string;
  nameZh: string;
  title: string;
  titleZh: string;
  lore: string;
  accentColor: string;
  bgFrom: string;
  bgTo: string;
  passive: { name: string; nameZh: string; description: string; descriptionZh: string; };
  active: CommanderAbility;
  stats: { intel: number; command: number; tech: number; combat: number; }; // 1-5 each
  // What game modifiers this commander applies
  gameModifiers: {
    sniperRangeBonus?: number;    // multiplier e.g. 1.25
    allTowerHpBonus?: number;
    buildCostDiscount?: number;   // e.g. 0.15 = 15% off
    aoeRadiusBonus?: number;
    enemySpeedOnStart?: number;   // multiplier e.g. 0.7 = 30% slower
    rebuildDestroyedTowers?: boolean;
  };
}

export const COMMANDERS: Record<string, Commander> = {
  GHOST: {
    id: 'GHOST',
    name: 'Ghost',
    nameZh: '幽靈',
    title: 'Shadow Operator',
    titleZh: '暗影特工',
    lore: 'A sniper of mythical precision. Three confirmed kills from 3 kilometers. The fourth target never knew there was a third.',
    accentColor: '#00ff88',
    bgFrom: '#001a0d',
    bgTo: '#0a1a0f',
    passive: {
      name: 'Phantom Optics',
      nameZh: '幽靈光學',
      description: 'All sniper-type towers gain +25% effective range.',
      descriptionZh: '所有狙擊型砲台有效射程增加25%。',
    },
    active: {
      id: 'phantom_mark',
      name: 'Phantom Mark',
      nameZh: '幽靈標記',
      description: 'Mark one enemy. All towers deal 3x damage to it for 8 seconds.',
      descriptionZh: '標記一個敵人，所有砲台對其造成3倍傷害，持續8秒。',
      cooldown: 45,
      icon: '[TGT]',
    },
    stats: { intel: 4, command: 2, tech: 3, combat: 5 },
    gameModifiers: { sniperRangeBonus: 1.25 },
  },

  TITAN: {
    id: 'TITAN',
    name: 'Titan',
    nameZh: '泰坦',
    title: 'Armored Vanguard',
    titleZh: '鐵甲先鋒',
    lore: 'Walked out of a direct missile strike. Complained it tickled. Somehow still cleared the objective.',
    accentColor: '#3b82f6',
    bgFrom: '#00051a',
    bgTo: '#0a0f1a',
    passive: {
      name: 'Fortified Grid',
      nameZh: '強化防線',
      description: 'All towers have +20% maximum HP and take 10% less damage.',
      descriptionZh: '所有砲台最大耐久提升20%，受到傷害減少10%。',
    },
    active: {
      id: 'orbital_hammer',
      name: 'Orbital Hammer',
      nameZh: '軌道錘擊',
      description: 'Call in a kinetic strike. Massive AOE damage on a target tile.',
      descriptionZh: '呼叫動能打擊，對目標格造成大範圍毀滅性傷害。',
      cooldown: 60,
      icon: '[ORB]',
    },
    stats: { intel: 2, command: 5, tech: 2, combat: 4 },
    gameModifiers: { allTowerHpBonus: 1.2 },
  },

  CIPHER: {
    id: 'CIPHER',
    name: 'Cipher',
    nameZh: '密碼',
    title: 'Systems Hacker',
    titleZh: '系統駭客',
    lore: 'Can compromise any network in under 11 seconds. Spent 3 of those seconds checking messages.',
    accentColor: '#facc15',
    bgFrom: '#1a1500',
    bgTo: '#1a1700',
    passive: {
      name: 'Efficient Protocols',
      nameZh: '高效協議',
      description: 'All tower build and upgrade costs reduced by 15%.',
      descriptionZh: '所有砲台建造與升級費用降低15%。',
    },
    active: {
      id: 'overclock',
      name: 'System Overclock',
      nameZh: '系統超頻',
      description: 'All towers fire 60% faster for 8 seconds. No other bonuses stack.',
      descriptionZh: '所有砲台攻擊速度提升60%，持續8秒。',
      cooldown: 50,
      icon: '[OVR]',
    },
    stats: { intel: 5, command: 2, tech: 5, combat: 1 },
    gameModifiers: { buildCostDiscount: 0.15 },
  },

  WRAITH: {
    id: 'WRAITH',
    name: 'Wraith',
    nameZh: '幻影',
    title: 'Phantom Ops',
    titleZh: '幻影行動',
    lore: 'Enemy radar has never detected her. Her own team barely can. She prefers it that way.',
    accentColor: '#a855f7',
    bgFrom: '#0d0014',
    bgTo: '#0f0019',
    passive: {
      name: 'Ghost Protocol',
      nameZh: '幽靈協議',
      description: 'Enemy movement speed reduced by 30% at the start of every wave.',
      descriptionZh: '每波開始時，敵人移動速度降低30%。',
    },
    active: {
      id: 'emp_cascade',
      name: 'EMP Cascade',
      nameZh: 'EMP連鎖',
      description: 'Emit a field-wide EMP. All enemies are disabled for 4 seconds.',
      descriptionZh: '釋放全場EMP，所有敵人被癱瘓4秒。',
      cooldown: 55,
      icon: '[EMP]',
    },
    stats: { intel: 4, command: 3, tech: 4, combat: 3 },
    gameModifiers: { enemySpeedOnStart: 0.7 },
  },

  PHOENIX: {
    id: 'PHOENIX',
    name: 'Phoenix',
    nameZh: '鳳凰',
    title: 'Combat Engineer',
    titleZh: '戰鬥工程師',
    lore: 'Rebuilt a defense grid under artillery fire in 6 minutes. Regulation time is 45. She has opinions about that.',
    accentColor: '#f97316',
    bgFrom: '#1a0800',
    bgTo: '#1a0c00',
    passive: {
      name: 'Auto-Rebuild',
      nameZh: '自動重建',
      description: 'When a tower is destroyed, it automatically rebuilds at 50% HP after 10 seconds.',
      descriptionZh: '砲台被摧毀後，10秒內自動以50%耐久重建。',
    },
    active: {
      id: 'emergency_repair',
      name: 'Emergency Repair',
      nameZh: '緊急修復',
      description: 'Instantly restore all towers to full HP and remove all debuffs.',
      descriptionZh: '立即將所有砲台恢復至滿血並清除所有負面效果。',
      cooldown: 70,
      icon: '[REP]',
    },
    stats: { intel: 3, command: 4, tech: 5, combat: 2 },
    gameModifiers: { rebuildDestroyedTowers: true },
  },

  NOVA: {
    id: 'NOVA',
    name: 'Nova',
    nameZh: '新星',
    title: 'Artillery Marshal',
    titleZh: '炮兵元帥',
    lore: 'Commands the largest mobile artillery platform ever deployed. It is named after her cat.',
    accentColor: '#ef4444',
    bgFrom: '#1a0000',
    bgTo: '#1a0505',
    passive: {
      name: 'Blast Doctrine',
      nameZh: '爆炸主義',
      description: 'All area-type towers have +30% blast radius and +15% explosion damage.',
      descriptionZh: '所有範圍型砲台爆炸半徑增加30%，爆炸傷害增加15%。',
    },
    active: {
      id: 'carpet_bomb',
      name: 'Carpet Bomb',
      nameZh: '地毯轟炸',
      description: 'Call in 5 sequential AOE strikes on random enemy positions.',
      descriptionZh: '對隨機敵方位置發動5次連續範圍轟炸。',
      cooldown: 65,
      icon: '[BOM]',
    },
    stats: { intel: 2, command: 4, tech: 3, combat: 5 },
    gameModifiers: { aoeRadiusBonus: 1.3 },
  },
};

export const COMMANDER_LIST = Object.values(COMMANDERS);
export const DEFAULT_COMMANDER = 'GHOST';

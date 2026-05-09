// src/config/towerCards.ts
// Tower Card 育成 system — levels, XP, stars, bond

export interface TowerCardData {
  towerKey: string;
  level: number;       // 1–20
  xp: number;          // current XP toward next level
  stars: number;       // 1–5 rarity
  bondLevel: number;   // 0–10, grows from total use
  totalKills: number;  // lifetime enemy kills
  unlocked: boolean;
}

export const STARS_COLORS: Record<number, string> = {
  1: '#94a3b8',  // grey
  2: '#4ade80',  // green
  3: '#60a5fa',  // blue
  4: '#a855f7',  // purple
  5: '#facc15',  // gold
};

export const STARS_LABELS: Record<number, string> = {
  1: 'COMMON', 2: 'UNCOMMON', 3: 'RARE', 4: 'EPIC', 5: 'LEGENDARY',
};

export function xpToNextLevel(level: number): number {
  return level * 120;
}

// Stat bonuses per card level (compounding from base)
export function cardStatMultipliers(level: number) {
  const l = level - 1; // 0-based
  return {
    damage: 1 + l * 0.04,      // +4% damage per level
    range:  1 + l * 0.025,     // +2.5% range per level
    cooldownDiv: 1 + l * 0.02, // / (1 + l*0.02) → faster fire rate
  };
}

// Bond level bonuses (unlocked at specific bond levels)
export const BOND_BONUSES: Record<number, string> = {
  2:  '+8% damage',
  4:  '+10% range',
  6:  'Crit chance +5%',
  8:  '+15% damage',
  10: 'BOND MAX: +25% all stats',
};

// ---- LOCAL STORAGE PERSISTENCE ----
const STORAGE_KEY = (userId: string) => `towerCards_${userId}`;

export function loadTowerCards(userId: string): Record<string, TowerCardData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveTowerCards(userId: string, cards: Record<string, TowerCardData>) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(cards));
  } catch {}
}

export function getOrInitCard(
  cards: Record<string, TowerCardData>,
  towerKey: string,
  unlocked: boolean,
): TowerCardData {
  if (cards[towerKey]) return cards[towerKey];
  return {
    towerKey,
    level: 1,
    xp: 0,
    stars: 1,
    bondLevel: 0,
    totalKills: 0,
    unlocked,
  };
}

// Add XP to a card. Returns updated card + whether a level-up occurred.
export function addCardXp(
  card: TowerCardData,
  xpGain: number,
): { card: TowerCardData; leveledUp: boolean } {
  if (card.level >= 20) return { card, leveledUp: false };
  let { xp, level, totalKills } = card;
  xp += xpGain;
  totalKills += 1;
  let leveledUp = false;

  while (level < 20 && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    leveledUp = true;
  }

  // Bond XP: 1 bond point per 50 kills
  const newBond = Math.min(10, Math.floor(totalKills / 50));

  return {
    card: { ...card, xp, level, bondLevel: newBond, totalKills },
    leveledUp,
  };
}

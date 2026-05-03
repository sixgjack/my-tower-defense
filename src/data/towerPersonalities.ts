// src/data/towerPersonalities.ts
// Clash Royale-style personality descriptions for towers
export interface TowerPersonality {
  name: string;
  nameZh: string;
  personality: string;
  personalityZh: string;
  catchphrase: string;
  catchphraseZh: string;
  lore: string;
  loreZh: string;
}

export const TOWER_PERSONALITIES: Record<string, TowerPersonality> = {
  'ARCHER': {
    name: 'Auto-Rifle Turret',
    nameZh: '自動步槍砲塔',
    personality: 'The Reliable Guardian',
    personalityZh: '可靠的守護者',
    catchphrase: '"Never miss, never falter!"',
    catchphraseZh: '「從不錯過，從不猶豫！」',
    lore: 'Born from the ashes of countless battles, this turret has seen it all. Fast, precise, and always ready. It may not be the flashiest, but when the chips are down, you can count on it to hold the line.',
    loreZh: '從無數戰鬥的灰燼中誕生，這座砲塔見證了一切。快速、精準、時刻準備。它可能不是最華麗的，但在關鍵時刻，你可以依靠它守住防線。'
  },
  'CANNON': {
    name: 'Mortar Cannon',
    nameZh: '迫擊砲',
    personality: 'The Explosive Veteran',
    personalityZh: '爆炸老兵',
    catchphrase: '"Boom goes the enemy!"',
    catchphraseZh: '「敵人灰飛煙滅！」',
    lore: 'A grizzled veteran who loves nothing more than a good explosion. Its shells rain down like judgment, clearing entire groups with a single shot. Age has only made it more accurate.',
    loreZh: '一位飽經風霜的老兵，最愛的就是爆炸。它的砲彈如審判般落下，一發就能清除整群敵人。歲月只讓它更加精準。'
  },
  'WIZARD': {
    name: 'EMP Blaster',
    nameZh: '電磁脈衝砲',
    personality: 'The Tech Disruptor',
    personalityZh: '科技破壞者',
    catchphrase: '"Technology? Overrated!"',
    catchphraseZh: '「科技？被高估了！」',
    lore: 'A rebel who turned against the very technology that created it. Its electromagnetic pulses fry circuits and disable multiple enemies at once. It fights with the chaos it was meant to prevent.',
    loreZh: '一個反抗創造它的科技的叛逆者。它的電磁脈衝會燒毀電路，同時癱瘓多個敵人。它用本應阻止的混亂來戰鬥。'
  },
  'MORTAR': {
    name: 'Artillery Battery',
    nameZh: '火砲陣地',
    personality: 'The Patient Strategist',
    personalityZh: '耐心的戰略家',
    catchphrase: '"Distance is my friend."',
    catchphraseZh: '「距離是我的朋友。」',
    lore: 'Calculating and methodical, this artillery piece never rushes. It waits for the perfect moment, then delivers devastating long-range strikes. Every shot is a masterpiece of precision.',
    loreZh: '計算縝密、有條不紊，這座火砲從不匆忙。它等待完美時機，然後發動毀滅性的遠程打擊。每一發都是精準的傑作。'
  },
  'AIR_DEFENSE': {
    name: 'SAM Launcher',
    nameZh: '地對空導彈',
    personality: 'The Sky Hunter',
    personalityZh: '天空獵手',
    catchphrase: '"What goes up, must come down!"',
    catchphraseZh: '「飛上去的，必須掉下來！」',
    lore: 'Born to dominate the skies, this launcher tracks every aerial threat with deadly precision. Its missiles never miss, and enemies learn to fear the sound of its lock-on.',
    loreZh: '生來就統治天空，這座發射器以致命精準追蹤每個空中威脅。它的導彈從不錯過，敵人學會了恐懼它的鎖定聲。'
  },
  'TESLA': {
    name: 'Shock Generator',
    nameZh: '電擊發生器',
    personality: 'The Hidden Surprise',
    personalityZh: '隱藏的驚喜',
    catchphrase: '"Surprise!"',
    catchphraseZh: '「驚喜！」',
    lore: 'A master of ambush, this generator hides until enemies are close. Then it unleashes devastating electric shocks that chain between targets. The element of surprise is its greatest weapon.',
    loreZh: '伏擊大師，這個發生器隱藏起來，直到敵人靠近。然後它釋放毀滅性的電擊，在目標間連鎖。出其不意是它最強大的武器。'
  },
  'SNOW_HUNTER': {
    name: 'Cryo Cannon',
    nameZh: '冷凍砲',
    personality: 'The Ice Queen',
    personalityZh: '冰霜女王',
    catchphrase: '"Freeze in your tracks!"',
    catchphraseZh: '「凍在原地！」',
    lore: 'Cold and calculating, this cannon slows enemies to a crawl with freezing projectiles. It doesn\'t just defeat enemies—it makes them suffer in the cold.',
    loreZh: '冷酷而精於算計，這座砲用冰凍彈將敵人減速到爬行。它不只是擊敗敵人——它讓它們在寒冷中受苦。'
  },
  'SCHWARZ': {
    name: 'Anti-Tank Rifle',
    nameZh: '反坦克步槍',
    personality: 'The One-Shot Wonder',
    personalityZh: '一擊必殺',
    catchphrase: '"One shot, one kill."',
    catchphraseZh: '「一發，一殺。」',
    lore: 'A precision instrument of destruction. This rifle doesn\'t need multiple shots—it only needs one. Its high-penetration rounds pierce through armor like paper.',
    loreZh: '精密的毀滅工具。這把步槍不需要多發——只需要一發。它的高穿透彈如紙般穿透裝甲。'
  },
  'EXUSIAI': {
    name: 'Multi-Missile System',
    nameZh: '多導彈系統',
    personality: 'The Overwhelming Force',
    personalityZh: '壓倒性力量',
    catchphrase: '"Quantity has a quality all its own!"',
    catchphraseZh: '「數量本身就是一種品質！」',
    lore: 'Why fire one missile when you can fire dozens? This system believes in overwhelming the enemy with sheer volume. Its rapid-fire barrage leaves no room for escape.',
    loreZh: '為什麼只發射一枚導彈，當你可以發射數十枚？這個系統相信用純粹的數量壓倒敵人。它的快速連射讓敵人無處可逃。'
  }
};

// Default personality for towers without specific entries
export const getTowerPersonality = (towerKey: string, towerName: string): TowerPersonality => {
  if (TOWER_PERSONALITIES[towerKey]) {
    return TOWER_PERSONALITIES[towerKey];
  }
  
  // Generate default personality based on tower name
  return {
    name: towerName,
    nameZh: towerName,
    personality: 'The Defender',
    personalityZh: '防禦者',
    catchphrase: '"I stand guard!"',
    catchphraseZh: '「我守衛這裡！」',
    lore: 'A dedicated guardian of the realm, always ready to protect what matters most.',
    loreZh: '領域的忠誠守護者，時刻準備保護最重要的東西。'
  };
};

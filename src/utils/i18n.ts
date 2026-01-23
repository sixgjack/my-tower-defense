// src/utils/i18n.ts
// Internationalization support (English/Traditional Chinese)

export type Language = 'en' | 'zh';

let currentLanguage: Language = 'en';

export const i18n = {
  setLanguage: (lang: Language) => {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);
  },
  
  getLanguage: (): Language => {
    const saved = localStorage.getItem('gameLanguage');
    if (saved === 'zh' || saved === 'en') return saved as Language;
    return currentLanguage;
  },
  
  t: (key: string): string => {
    const lang = i18n.getLanguage();
    return translations[lang][key] || translations.en[key] || key;
  }
};

// Helper function to get translated tower name
export const getTowerName = (towerKey: string): string => {
  return i18n.t(`tower.${towerKey}.name`) || towerKey;
};

// Helper function to get translated tower description
export const getTowerDescription = (towerKey: string): string => {
  return i18n.t(`tower.${towerKey}.description`) || '';
};

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // UI Elements
    'game.title': 'Code Defense',
    'game.money': 'Money',
    'game.lives': 'Lives',
    'game.wave': 'Wave',
    'game.currentWave': 'Current Wave',
    'game.nextWaveIn': 'Next Wave In',
    'game.paused': 'PAUSED',
    'game.play': 'PLAY',
    'game.upgrade': 'UPGRADE',
    'game.sell': 'SELL',
    'game.language': 'Language',
    'game.lang.en': 'English',
    'game.lang.zh': '中文',
    
    // Notifications
    'notif.boss': '⚠️ BOSS INCOMING ⚠️',
    'notif.gameOver': 'GAME OVER',
    'notif.blocked': 'Blocked!',
    'notif.needFunds': 'Need Funds!',
    'notif.wave': 'WAVE',
    
    // Game Over
    'gameOver.title': 'GAME OVER',
    'gameOver.subtitle': 'Your defense has been breached!',
    'gameOver.waveReached': 'Wave Reached',
    'gameOver.towersBuilt': 'Towers Built',
    'gameOver.enemiesKilled': 'Enemies Killed',
    'gameOver.totalEarned': 'Total Earned',
    'gameOver.restart': 'RESTART',
    
    // Towers
    'tower.range': 'Range',
    'tower.damage': 'Dmg',
    
    // ==========================================
    // 8 BASIC TOWERS (Unlocked by default)
    // ==========================================
    'tower.BASIC_RIFLE.name': 'Auto-Rifle',
    'tower.BASIC_RIFLE.description': 'Basic rapid-fire turret. Reliable single-target damage.',
    'tower.BASIC_CANNON.name': 'Mortar',
    'tower.BASIC_CANNON.description': 'Explosive area damage. Shells arc over obstacles.',
    'tower.BASIC_SNIPER.name': 'Sniper Rifle',
    'tower.BASIC_SNIPER.description': 'Long-range precision shots. Pierces through enemies.',
    'tower.BASIC_SHOTGUN.name': 'Shotgun',
    'tower.BASIC_SHOTGUN.description': 'Fires 5 pellets in a spread. High burst damage.',
    'tower.BASIC_FREEZE.name': 'Cryo Turret',
    'tower.BASIC_FREEZE.description': 'Freezing projectiles slow enemies by 50%.',
    'tower.BASIC_BURN.name': 'Flamethrower',
    'tower.BASIC_BURN.description': 'Continuous flame beam. Damage ramps up over time.',
    'tower.BASIC_STUN.name': 'Stun Cannon',
    'tower.BASIC_STUN.description': 'Electric projectiles stun enemies for 1.5 seconds.',
    'tower.BASIC_HEAL.name': 'Medic Station',
    'tower.BASIC_HEAL.description': 'Heals nearby towers. No damage, pure support.',
    
    // ==========================================
    // SPECIALIZED DAMAGE TOWERS
    // ==========================================
    'tower.CHAIN_LIGHTNING.name': 'Chain Lightning',
    'tower.CHAIN_LIGHTNING.description': 'Lightning chains between 3-5 enemies.',
    'tower.PENETRATOR.name': 'Railgun',
    'tower.PENETRATOR.description': 'Piercing projectile travels through ALL enemies.',
    'tower.GATLING.name': 'Gatling Gun',
    'tower.GATLING.description': 'Extremely fast attack rate. Overwhelming DPS.',
    'tower.ARTILLERY.name': 'Artillery',
    'tower.ARTILLERY.description': 'Long-range bombardment. Massive area damage.',
    'tower.EXPLOSIVE.name': 'Grenade Launcher',
    'tower.EXPLOSIVE.description': 'Timed grenades with 2.0 radius splash damage.',
    'tower.LASER_BEAM.name': 'Laser Cannon',
    'tower.LASER_BEAM.description': 'Continuous laser. Damage ramps up over time.',
    'tower.INFERNO.name': 'Inferno Tower',
    'tower.INFERNO.description': 'Extreme damage ramp. Starts weak, becomes devastating.',
    'tower.POISON_TOWER.name': 'Toxin Launcher',
    'tower.POISON_TOWER.description': 'Poison deals 15 DPS for 3s. Stacks 3 times.',
    'tower.SLOW_FIELD.name': 'Slow Field',
    'tower.SLOW_FIELD.description': 'Aura slows all enemies by 60%. Max crowd control.',
    'tower.STUN_TOWER.name': 'Stun Turret',
    'tower.STUN_TOWER.description': 'Electric shock stuns enemies for 2 seconds.',
    
    // Position Control
    'tower.VORTEX.name': 'Gravity Vortex',
    'tower.VORTEX.description': 'Pulls enemies toward tower. Disrupts enemy flow.',
    'tower.PUSHER.name': 'Repulsor Cannon',
    'tower.PUSHER.description': 'Pushes enemies backward, buying time.',
    
    // Support Towers
    'tower.SPEED_BUFF.name': 'Speed Enhancer',
    'tower.SPEED_BUFF.description': 'Increases attack speed of nearby towers by 30%.',
    'tower.DAMAGE_BUFF.name': 'Damage Amplifier',
    'tower.DAMAGE_BUFF.description': 'Boosts damage of nearby towers by 50%.',
    'tower.RANGE_BUFF.name': 'Range Extender',
    'tower.RANGE_BUFF.description': 'Extends range of nearby towers by 20%.',
    'tower.FROST_ENHANCER.name': 'Frost Enhancer',
    'tower.FROST_ENHANCER.description': 'Grants nearby towers freeze effect on attacks.',
    'tower.VENOM_ENHANCER.name': 'Venom Enhancer',
    'tower.VENOM_ENHANCER.description': 'Grants nearby towers poison effect on attacks.',
    'tower.HEALER.name': 'Repair Bay',
    'tower.HEALER.description': 'Heals nearby towers for 40 HP per tick.',
    
    // Special Mechanics
    'tower.MINE_LAYER.name': 'Mine Layer',
    'tower.MINE_LAYER.description': 'Plants explosive mines on the path. Max 3 per level.',
    'tower.ORBITAL.name': 'Orbital Strike',
    'tower.ORBITAL.description': 'Calls orbital strike on random enemies.',
    'tower.EXECUTIONER.name': 'Executioner',
    'tower.EXECUTIONER.description': 'Instantly kills enemies below 15% HP.',
    'tower.BANKER.name': 'Gold Factory',
    'tower.BANKER.description': 'Generates $5 per second. Investment tower.',
    'tower.WEAKENER.name': 'Weakening Field',
    'tower.WEAKENER.description': 'Aura reduces enemy armor by 30%.',
    'tower.SUMMONER.name': 'Drone Bay',
    'tower.SUMMONER.description': 'Deploys 3 combat drones that attack enemies.',
    'tower.BOOMERANG.name': 'Boomerang Turret',
    'tower.BOOMERANG.description': 'Projectiles return and hit multiple times.',
    'tower.CRYO_BEAM.name': 'Cryo Beam',
    'tower.CRYO_BEAM.description': 'Freezing beam slows and deals cold damage.',
    'tower.TESLA.name': 'Tesla Coil',
    'tower.TESLA.description': 'Continuous lightning jumps to nearby enemies.',
  },
  zh: {
    // UI Elements - Traditional Chinese (繁體中文)
    'game.title': '代碼防禦',
    'game.money': '金錢',
    'game.lives': '生命',
    'game.wave': '波次',
    'game.currentWave': '當前波次',
    'game.nextWaveIn': '下一波',
    'game.paused': '暫停',
    'game.play': '繼續',
    'game.upgrade': '升級',
    'game.sell': '出售',
    'game.language': '語言',
    'game.lang.en': 'English',
    'game.lang.zh': '繁體中文',
    
    // Notifications
    'notif.boss': '⚠️ BOSS來襲 ⚠️',
    'notif.gameOver': '遊戲結束',
    'notif.blocked': '無法放置！',
    'notif.needFunds': '資金不足！',
    'notif.wave': '波次',
    
    // Game Over
    'gameOver.title': '遊戲結束',
    'gameOver.subtitle': '您的防禦已被突破！',
    'gameOver.waveReached': '到達波次',
    'gameOver.towersBuilt': '建造砲塔',
    'gameOver.enemiesKilled': '擊殺敵人',
    'gameOver.totalEarned': '總收入',
    'gameOver.restart': '重新開始',
    
    // Towers
    'tower.range': '範圍',
    'tower.damage': '傷害',
    
    // ==========================================
    // 8 BASIC TOWERS - Traditional Chinese
    // ==========================================
    'tower.BASIC_RIFLE.name': '自動步槍',
    'tower.BASIC_RIFLE.description': '基本快速砲塔。可靠的單體傷害。',
    'tower.BASIC_CANNON.name': '迫擊砲',
    'tower.BASIC_CANNON.description': '爆炸區域傷害。彈殼越過障礙物。',
    'tower.BASIC_SNIPER.name': '狙擊槍',
    'tower.BASIC_SNIPER.description': '遠程精確射擊。穿透敵人。',
    'tower.BASIC_SHOTGUN.name': '散彈槍',
    'tower.BASIC_SHOTGUN.description': '發射5顆彈丸扇形散射。高爆發傷害。',
    'tower.BASIC_FREEZE.name': '冷凍砲塔',
    'tower.BASIC_FREEZE.description': '冰凍彈藥減速敵人50%。',
    'tower.BASIC_BURN.name': '火焰噴射器',
    'tower.BASIC_BURN.description': '連續火焰光束。傷害隨時間增加。',
    'tower.BASIC_STUN.name': '電擊砲',
    'tower.BASIC_STUN.description': '電擊彈藥擊暈敵人1.5秒。',
    'tower.BASIC_HEAL.name': '醫療站',
    'tower.BASIC_HEAL.description': '治療附近砲塔。純支援單位。',
    
    // ==========================================
    // SPECIALIZED DAMAGE TOWERS - Traditional Chinese
    // ==========================================
    'tower.CHAIN_LIGHTNING.name': '鏈式閃電',
    'tower.CHAIN_LIGHTNING.description': '閃電在3-5個敵人間連鎖。',
    'tower.PENETRATOR.name': '電磁軌道砲',
    'tower.PENETRATOR.description': '穿透彈藥穿過所有敵人。',
    'tower.GATLING.name': '加特林機槍',
    'tower.GATLING.description': '極快攻擊速度。壓倒性DPS。',
    'tower.ARTILLERY.name': '砲兵陣地',
    'tower.ARTILLERY.description': '遠程轟炸。巨大區域傷害。',
    'tower.EXPLOSIVE.name': '榴彈發射器',
    'tower.EXPLOSIVE.description': '定時手榴彈。2.0範圍濺射傷害。',
    'tower.LASER_BEAM.name': '雷射砲',
    'tower.LASER_BEAM.description': '連續雷射。傷害隨時間增加。',
    'tower.INFERNO.name': '地獄塔',
    'tower.INFERNO.description': '極端傷害遞增。初期弱，後期毀滅。',
    'tower.POISON_TOWER.name': '毒素發射器',
    'tower.POISON_TOWER.description': '毒藥造成每秒15傷害持續3秒。疊加3次。',
    'tower.SLOW_FIELD.name': '減速場',
    'tower.SLOW_FIELD.description': '光環減速所有敵人60%。最強控場。',
    'tower.STUN_TOWER.name': '電擊砲塔',
    'tower.STUN_TOWER.description': '電擊擊暈敵人2秒。',
    
    // Position Control - Traditional Chinese
    'tower.VORTEX.name': '重力漩渦',
    'tower.VORTEX.description': '將敵人拉向砲塔。擾亂敵人路線。',
    'tower.PUSHER.name': '排斥砲',
    'tower.PUSHER.description': '將敵人向後推，爭取時間。',
    
    // Support Towers - Traditional Chinese
    'tower.SPEED_BUFF.name': '速度增強器',
    'tower.SPEED_BUFF.description': '提升附近砲塔30%攻擊速度。',
    'tower.DAMAGE_BUFF.name': '傷害放大器',
    'tower.DAMAGE_BUFF.description': '提升附近砲塔50%傷害。',
    'tower.RANGE_BUFF.name': '射程延伸器',
    'tower.RANGE_BUFF.description': '延伸附近砲塔20%射程。',
    'tower.FROST_ENHANCER.name': '冰霜增強器',
    'tower.FROST_ENHANCER.description': '賦予附近砲塔冰凍效果。',
    'tower.VENOM_ENHANCER.name': '劇毒增強器',
    'tower.VENOM_ENHANCER.description': '賦予附近砲塔中毒效果。',
    'tower.HEALER.name': '維修站',
    'tower.HEALER.description': '每次治療附近砲塔40 HP。',
    
    // Special Mechanics - Traditional Chinese
    'tower.MINE_LAYER.name': '地雷部署器',
    'tower.MINE_LAYER.description': '在路徑上放置地雷。每級最多3枚。',
    'tower.ORBITAL.name': '軌道打擊',
    'tower.ORBITAL.description': '呼叫軌道打擊隨機敵人。',
    'tower.EXECUTIONER.name': '處刑者',
    'tower.EXECUTIONER.description': '即死攻擊血量低於15%的敵人。',
    'tower.BANKER.name': '黃金工廠',
    'tower.BANKER.description': '每秒產生$5。投資型砲塔。',
    'tower.WEAKENER.name': '削弱場',
    'tower.WEAKENER.description': '光環降低敵人護甲30%。',
    'tower.SUMMONER.name': '無人機塢',
    'tower.SUMMONER.description': '部署3架戰鬥無人機攻擊敵人。',
    'tower.BOOMERANG.name': '迴旋鏢砲塔',
    'tower.BOOMERANG.description': '彈藥返回多次擊中。',
    'tower.CRYO_BEAM.name': '冰霜光束',
    'tower.CRYO_BEAM.description': '冰凍光束減速並造成冰傷害。',
    'tower.TESLA.name': '特斯拉線圈',
    'tower.TESLA.description': '連續閃電跳躍至附近敵人。',
  }
};

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('gameLanguage');
  if (saved === 'zh' || saved === 'en') {
    currentLanguage = saved as Language;
  }
}

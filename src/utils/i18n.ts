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
    
    // Towers
    'tower.range': 'Range',
    'tower.damage': 'Dmg',
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
    
    // Towers
    'tower.range': '範圍',
    'tower.damage': '傷害',
  }
};

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('gameLanguage');
  if (saved === 'zh' || saved === 'en') {
    currentLanguage = saved as Language;
  }
}

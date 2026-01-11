// src/utils/i18n.ts
// Internationalization support (English/Chinese)

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
    // UI Elements
    'game.title': '代码防御',
    'game.money': '金钱',
    'game.lives': '生命',
    'game.wave': '波次',
    'game.currentWave': '当前波次',
    'game.nextWaveIn': '下一波',
    'game.paused': '暂停',
    'game.play': '继续',
    'game.upgrade': '升级',
    'game.sell': '出售',
    'game.language': '语言',
    'game.lang.en': 'English',
    'game.lang.zh': '中文',
    
    // Notifications
    'notif.boss': '⚠️ BOSS来袭 ⚠️',
    'notif.gameOver': '游戏结束',
    'notif.blocked': '无法放置！',
    'notif.needFunds': '资金不足！',
    'notif.wave': '波次',
    
    // Towers
    'tower.range': '范围',
    'tower.damage': '伤害',
  }
};

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('gameLanguage');
  if (saved === 'zh' || saved === 'en') {
    currentLanguage = saved as Language;
  }
}

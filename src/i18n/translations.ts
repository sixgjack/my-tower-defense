// src/i18n/translations.ts
// Bilingual translations: Traditional Chinese + English

export type Language = 'zh-TW' | 'en';

export interface Translations {
  [key: string]: {
    'zh-TW': string;
    'en': string;
  };
}

export const translations: Translations = {
  // Common
  'common.back': { 'zh-TW': '返回', 'en': 'Back' },
  'common.confirm': { 'zh-TW': '確認', 'en': 'Confirm' },
  'common.cancel': { 'zh-TW': '取消', 'en': 'Cancel' },
  'common.save': { 'zh-TW': '儲存', 'en': 'Save' },
  'common.delete': { 'zh-TW': '刪除', 'en': 'Delete' },
  'common.edit': { 'zh-TW': '編輯', 'en': 'Edit' },
  'common.loading': { 'zh-TW': '載入中...', 'en': 'Loading...' },
  'common.error': { 'zh-TW': '錯誤', 'en': 'Error' },
  'common.success': { 'zh-TW': '成功', 'en': 'Success' },
  
  // Menu
  'menu.title': { 'zh-TW': '塔防學習遊戲', 'en': 'Tower Defense Learning' },
  'menu.signIn': { 'zh-TW': '使用 Google 登入', 'en': 'Sign in with Google' },
  'menu.signOut': { 'zh-TW': '登出', 'en': 'Sign Out' },
  'menu.enterLobby': { 'zh-TW': '進入大廳', 'en': 'Enter Lobby' },
  
  // Lobby
  'lobby.title': { 'zh-TW': '指揮中心', 'en': 'Command Center' },
  'lobby.welcome': { 'zh-TW': '歡迎回來', 'en': 'Welcome back' },
  'lobby.credits': { 'zh-TW': '可用積分', 'en': 'Available Credits' },
  'lobby.highestWave': { 'zh-TW': '最高波數', 'en': 'Highest Wave' },
  'lobby.startCombat': { 'zh-TW': '開始戰鬥', 'en': 'Start Combat' },
  'lobby.luckyDraw': { 'zh-TW': '幸運抽獎', 'en': 'Lucky Draw' },
  'lobby.towerGallery': { 'zh-TW': '防禦塔圖鑑', 'en': 'Tower Gallery' },
  'lobby.enemyDictionary': { 'zh-TW': '敵人圖鑑', 'en': 'Enemy Dictionary' },
  'lobby.stats': { 'zh-TW': '統計', 'en': 'Statistics' },
  'lobby.gamesPlayed': { 'zh-TW': '遊戲次數', 'en': 'Games Played' },
  'lobby.totalWaves': { 'zh-TW': '總波數', 'en': 'Total Waves' },
  'lobby.enemiesKilled': { 'zh-TW': '擊殺敵人', 'en': 'Enemies Killed' },
  'lobby.totalEarned': { 'zh-TW': '總收入', 'en': 'Total Earned' },
  
  // Mode Selection
  'mode.select': { 'zh-TW': '選擇模式', 'en': 'Select Mode' },
  'mode.choose': { 'zh-TW': '選擇你的題目集', 'en': 'Choose your question set' },
  'mode.startCombat': { 'zh-TW': '開始戰鬥', 'en': 'Start Combat' },
  
  // Tower Gallery
  'tower.title': { 'zh-TW': '防禦塔圖鑑', 'en': 'Tower Gallery' },
  'tower.unlocked': { 'zh-TW': '已解鎖', 'en': 'Unlocked' },
  'tower.locked': { 'zh-TW': '已鎖定', 'en': 'Locked' },
  'tower.damage': { 'zh-TW': '傷害', 'en': 'Damage' },
  'tower.range': { 'zh-TW': '射程', 'en': 'Range' },
  'tower.cooldown': { 'zh-TW': '冷卻時間', 'en': 'Cooldown' },
  'tower.cost': { 'zh-TW': '成本', 'en': 'Cost' },
  'tower.specialAbility': { 'zh-TW': '特殊能力', 'en': 'Special Ability' },
  'tower.liveDemo': { 'zh-TW': '實戰演示', 'en': 'Live Demo' },
  
  // Enemy Dictionary
  'enemy.title': { 'zh-TW': '敵人圖鑑', 'en': 'Enemy Dictionary' },
  'enemy.locked': { 'zh-TW': '未解鎖', 'en': 'Locked' },
  'enemy.encounterToUnlock': { 'zh-TW': '在戰鬥中遭遇以解鎖', 'en': 'Encounter in battle to unlock' },
  'enemy.hp': { 'zh-TW': '生命值', 'en': 'Health Points' },
  'enemy.speed': { 'zh-TW': '速度', 'en': 'Speed' },
  'enemy.reward': { 'zh-TW': '獎勵', 'en': 'Reward' },
  'enemy.minWave': { 'zh-TW': '最低波數', 'en': 'Min Wave' },
  'enemy.specialAbilities': { 'zh-TW': '特殊能力', 'en': 'Special Abilities' },
  'enemy.boss': { 'zh-TW': '首領', 'en': 'BOSS' },
  'enemy.study': { 'zh-TW': '研究敵人類型和能力', 'en': 'Study enemy types and abilities' },
  
  // Teacher
  'teacher.login': { 'zh-TW': '教師登入', 'en': 'Teacher Login' },
  'teacher.access': { 'zh-TW': '教師專用', 'en': 'Teacher Access' },
  'teacher.manage': { 'zh-TW': '管理題目集', 'en': 'Manage Question Sets' },
  'teacher.questionSets': { 'zh-TW': '題目集', 'en': 'Question Sets' },
  'teacher.createSet': { 'zh-TW': '創建題目集', 'en': 'Create Question Set' },
  'teacher.editSet': { 'zh-TW': '編輯題目集', 'en': 'Edit Question Set' },
  'teacher.setName': { 'zh-TW': '題目集名稱', 'en': 'Set Name' },
  'teacher.setDescription': { 'zh-TW': '描述', 'en': 'Description' },
  'teacher.difficulty': { 'zh-TW': '難度', 'en': 'Difficulty' },
  'teacher.icon': { 'zh-TW': '圖標', 'en': 'Icon' },
  'teacher.color': { 'zh-TW': '顏色', 'en': 'Color' },
  
  // Admin Panel
  'admin.title': { 'zh-TW': '管理面板', 'en': 'Admin Panel' },
  'admin.questions': { 'zh-TW': '題目管理', 'en': 'Question Management' },
  'admin.bulkImport': { 'zh-TW': '批量匯入', 'en': 'Bulk Import' },
  'admin.addQuestion': { 'zh-TW': '新增題目', 'en': 'Add Question' },
  'admin.question': { 'zh-TW': '題目', 'en': 'Question' },
  'admin.options': { 'zh-TW': '選項', 'en': 'Options' },
  'admin.correct': { 'zh-TW': '正確答案', 'en': 'Correct Answer' },
  'admin.category': { 'zh-TW': '分類', 'en': 'Category' },
};

export const getTranslation = (key: string, lang: Language = 'en'): string => {
  return translations[key]?.[lang] || key;
};

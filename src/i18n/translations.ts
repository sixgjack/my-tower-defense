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
  
  // Lucky Draw
  'luckyDraw.title': { 'zh-TW': '🎰 幸運抽獎', 'en': '🎰 Lucky Draw' },
  'luckyDraw.back': { 'zh-TW': '← 返回', 'en': '← Back' },
  'luckyDraw.clickToDraw': { 'zh-TW': '點擊抽獎獲得防禦塔！', 'en': 'Click Draw to get a tower!' },
  'luckyDraw.drawing': { 'zh-TW': '抽獎中...', 'en': 'Drawing...' },
  'luckyDraw.drawButton': { 'zh-TW': '抽獎 (${cost} 積分)', 'en': 'Draw (${cost} credits)' },
  'luckyDraw.yourCredits': { 'zh-TW': '你的積分：', 'en': 'Your Credits:' },
  'luckyDraw.rarityChances': { 'zh-TW': '稀有度機率', 'en': 'Rarity Chances' },
  'luckyDraw.notEnough': { 'zh-TW': '積分不足！需要 100 積分。', 'en': 'Not enough credits! Need 100 credits to draw.' },
  
  // Rarity
  'rarity.common': { 'zh-TW': '普通', 'en': 'Common' },
  'rarity.rare': { 'zh-TW': '稀有', 'en': 'Rare' },
  'rarity.epic': { 'zh-TW': '史詩', 'en': 'Epic' },
  'rarity.legendary': { 'zh-TW': '傳說', 'en': 'Legendary' },
  
  // Difficulty
  'difficulty.easy': { 'zh-TW': '簡單', 'en': 'EASY' },
  'difficulty.medium': { 'zh-TW': '中等', 'en': 'MEDIUM' },
  'difficulty.hard': { 'zh-TW': '困難', 'en': 'HARD' },
  
  // Enemy Abilities
  'ability.teleport': { 'zh-TW': '瞬間移動', 'en': 'Teleport' },
  'ability.deactivate_towers': { 'zh-TW': '癱瘓防禦塔', 'en': 'Deactivate Towers' },
  'ability.heal_allies': { 'zh-TW': '治療同伴', 'en': 'Heal Allies' },
  'ability.shield': { 'zh-TW': '護盾', 'en': 'Shield' },
  'ability.spawn_minions': { 'zh-TW': '召喚小兵', 'en': 'Spawn Minions' },
  'ability.berserk': { 'zh-TW': '狂暴化', 'en': 'Berserk' },
  'ability.camouflage': { 'zh-TW': '偽裝', 'en': 'Camouflage' },
  'ability.regenerate': { 'zh-TW': '再生', 'en': 'Regenerate' },
  'ability.explode': { 'zh-TW': '爆炸', 'en': 'Explode' },
  'ability.charge': { 'zh-TW': '衝鋒', 'en': 'Charge' },
  'ability.retreat': { 'zh-TW': '撤退', 'en': 'Retreat' },
  'ability.stun_attack': { 'zh-TW': '眩暈攻擊', 'en': 'Stun Attack' },
  'ability.poison_aura': { 'zh-TW': '毒霧光環', 'en': 'Poison Aura' },
  'ability.freeze_aura': { 'zh-TW': '冰霜光環', 'en': 'Freeze Aura' },
  'ability.damage_reflect': { 'zh-TW': '傷害反彈', 'en': 'Damage Reflect' },
  'ability.split': { 'zh-TW': '分裂', 'en': 'Split' },
  'ability.fly': { 'zh-TW': '飛行', 'en': 'Fly' },
  'ability.burrow': { 'zh-TW': '潛地', 'en': 'Burrow' },
  'ability.summon': { 'zh-TW': '召喚', 'en': 'Summon' },
  'ability.invisible': { 'zh-TW': '隱身', 'en': 'Invisible' },
  'ability.slow_towers': { 'zh-TW': '減速防禦塔', 'en': 'Slow Towers' },
  'ability.boss_shield': { 'zh-TW': '首領護盾', 'en': 'Boss Shield' },
  'ability.attack_towers': { 'zh-TW': '攻擊防禦塔', 'en': 'Attack Towers' },
  'ability.cc_immune': { 'zh-TW': '控制免疫', 'en': 'CC Immune' },
  'ability.speed_aura': { 'zh-TW': '加速光環', 'en': 'Speed Aura' },
  'ability.shield_allies': { 'zh-TW': '為同伴加盾', 'en': 'Shield Allies' },
  'ability.area_disable': { 'zh-TW': '範圍癱瘓', 'en': 'Area Disable' },
  
  // Status Effects
  'status.stunned': { 'zh-TW': '眩暈', 'en': 'Stunned' },
  'status.frozen': { 'zh-TW': '冰凍', 'en': 'Frozen' },
  'status.slowed': { 'zh-TW': '減速', 'en': 'Slowed' },
  'status.burning': { 'zh-TW': '燃燒', 'en': 'Burning' },
  'status.poisoned': { 'zh-TW': '中毒', 'en': 'Poisoned' },
  'status.weakened': { 'zh-TW': '虛弱', 'en': 'Weakened' },
  'status.disabled': { 'zh-TW': '已癱瘓', 'en': 'DISABLED' },
  
  // Game UI
  'game.returnToLobby': { 'zh-TW': '返回大廳', 'en': 'Return to Lobby' },
  'game.home': { 'zh-TW': '主頁', 'en': 'Home' },
  'game.envEffects': { 'zh-TW': '環境效果', 'en': 'Environment Effects' },
  'game.backToMenu': { 'zh-TW': '返回主選單', 'en': 'Back to Menu' },
  
  // Question Modal
  'question.accessRequired': { 'zh-TW': '/// 需要系統授權 ///', 'en': '/// SYSTEM ACCESS REQUIRED ///' },
  'question.connecting': { 'zh-TW': '連接神經網路中...', 'en': 'Connecting to neural network...' },
  'question.noQuestions': { 'zh-TW': '錯誤：資料庫連接中斷。找不到題目。', 'en': 'ERROR: Database connection lost. No questions found.' },
  'question.wrongAnswer': { 'zh-TW': '⚠️ 存取拒絕：答案錯誤！', 'en': '⚠️ ACCESS DENIED: Incorrect Answer!' },
  
  // Tower Loadout
  'loadout.title': { 'zh-TW': '選擇裝備', 'en': 'Select Your Loadout' },
  'loadout.available': { 'zh-TW': '可用防禦塔', 'en': 'Available Towers' },
  'loadout.selected': { 'zh-TW': '已選防禦塔', 'en': 'Selected Towers' },
  'loadout.hoverForDetails': { 'zh-TW': '將滑鼠移到防禦塔上查看詳情', 'en': 'Hover over a tower to see details' },
  
  // Combat alerts
  'alert.leaderboard': { 'zh-TW': '排行榜', 'en': 'Leaderboard' },
  'alert.comingSoon': { 'zh-TW': '即將推出', 'en': 'Coming Soon' },
  'alert.startMission': { 'zh-TW': '開始新的防禦任務', 'en': 'Begin a new defense mission' },
  'alert.drawTowers': { 'zh-TW': '用積分抽取強力防禦塔', 'en': 'Draw powerful towers with credits' },
  'alert.viewTowers': { 'zh-TW': '查看所有可用防禦塔', 'en': 'View all available towers' },
  
  // Filters
  'filter.all': { 'zh-TW': '全部', 'en': 'All' },
  'filter.basic': { 'zh-TW': '基礎', 'en': 'Basic' },
  'filter.special': { 'zh-TW': '特殊', 'en': 'Special' },
  'filter.boss': { 'zh-TW': '首領', 'en': 'Boss' },
  
  // Battle Shop
  'shop.title': { 'zh-TW': '戰鬥商店', 'en': 'Battle Shop' },
  'shop.refresh': { 'zh-TW': '刷新', 'en': 'Refresh' },
  'shop.skip': { 'zh-TW': '跳過', 'en': 'Skip' },
};

export const getTranslation = (key: string, lang: Language = 'en'): string => {
  return translations[key]?.[lang] || key;
};

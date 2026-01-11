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
    
    // Towers
    'tower.range': 'Range',
    'tower.damage': 'Dmg',
    
    // Tower Names & Descriptions (Basic)
    'tower.ARCHER.name': 'Console.log',
    'tower.ARCHER.description': 'Basic debug output. Cheap and reliable.',
    'tower.CANNON.name': 'Print Statement',
    'tower.CANNON.description': 'Standard output with splash formatting.',
    'tower.WIZARD.name': 'Error Handler',
    'tower.WIZARD.description': 'Catches and processes multiple errors.',
    'tower.MORTAR.name': 'Logger Framework',
    'tower.MORTAR.description': 'Enterprise logging with long range.',
    'tower.AIR_DEFENSE.name': 'HTTP Request',
    'tower.AIR_DEFENSE.description': 'High-speed network requests.',
    'tower.TESLA.name': 'Event Listener',
    'tower.TESLA.description': 'Reactive trigger when threats detected.',
    'tower.X_BOW.name': 'Microservice',
    'tower.X_BOW.description': 'Extremely fast API calls.',
    'tower.INFERNO.name': 'Database Query',
    'tower.INFERNO.description': 'Continuous query execution. Damage ramps up over time.',
    'tower.EAGLE.name': 'Cloud Server',
    'tower.EAGLE.description': 'Global distributed processing.',
    'tower.SCATTERSHOT.name': 'Array.map()',
    'tower.SCATTERSHOT.description': 'Processes multiple targets simultaneously.',
    'tower.MONOLITH.name': 'Deep Learning',
    'tower.MONOLITH.description': 'Neural network inference with burn effect.',
    'tower.SPELL_TOWER.name': 'Middleware',
    'tower.SPELL_TOWER.description': 'Intercepts and processes requests (Coming Soon).',
    'tower.BUILDER.name': 'CI/CD Pipeline',
    'tower.BUILDER.description': 'Automated build and deployment.',
    
    // Tower Names & Descriptions (API & Services)
    'tower.EXUSIAI.name': 'REST API',
    'tower.EXUSIAI.description': 'Rapid HTTP endpoint calls.',
    'tower.SCHWARZ.name': 'GraphQL',
    'tower.SCHWARZ.description': 'Precise data query with high damage.',
    'tower.LEMUEN.name': 'WebSocket',
    'tower.LEMUEN.description': 'Real-time bidirectional connection.',
    'tower.SNOW_HUNTER.name': 'Cache Layer',
    'tower.SNOW_HUNTER.description': 'Freezes enemy data access.',
    'tower.SKYBOX.name': 'Load Balancer',
    'tower.SKYBOX.description': 'Distributes requests across servers.',
    'tower.BRIGID.name': 'Webhook',
    'tower.BRIGID.description': 'Callback mechanism that returns data.',
    'tower.ROSA.name': 'Rate Limiter',
    'tower.ROSA.description': 'Throttles and binds heavy traffic.',
    'tower.W.name': 'Message Queue',
    'tower.W.description': 'Delayed processing with massive burst.',
    
    // Tower Names & Descriptions (Frameworks)
    'tower.TITI.name': 'React Component',
    'tower.TITI.description': 'Reusable UI module with state management.',
    'tower.AKKORD.name': 'Express Server',
    'tower.AKKORD.description': 'Full-stack server framework.',
    'tower.IFRIT.name': 'Firebase',
    'tower.IFRIT.description': 'Real-time database with burn damage.',
    'tower.MANTRA.name': 'Vue.js',
    'tower.MANTRA.description': 'Progressive framework with reactivity.',
    'tower.CEOBE.name': 'Webpack',
    'tower.CEOBE.description': 'Bundles and optimizes code rapidly.',
    'tower.GOLDENGOLOW.name': 'Docker',
    'tower.GOLDENGOLOW.description': 'Containerized deployment anywhere.',
    'tower.NECRASS.name': 'Kubernetes',
    'tower.NECRASS.description': 'Orchestrates container clusters.',
    'tower.TRAGODIA.name': 'TypeScript',
    'tower.TRAGODIA.description': 'Type-safe JavaScript with compilation.',
    
    // Tower Names & Descriptions (Databases)
    'tower.HOSHIGUMA.name': 'Redis Cache',
    'tower.HOSHIGUMA.description': 'In-memory cache shreds nearby requests.',
    'tower.MUDROCK.name': 'PostgreSQL',
    'tower.MUDROCK.description': 'Robust relational database with massive queries.',
    'tower.NIAN.name': 'MongoDB',
    'tower.NIAN.description': 'NoSQL document store with heat map.',
    'tower.PENANCE.name': 'Elasticsearch',
    'tower.PENANCE.description': 'Full-text search engine with reflection.',
    'tower.YU.name': 'Blockchain',
    'tower.YU.description': 'Distributed ledger with immutable defense.',
    'tower.CAIRN.name': 'CDN',
    'tower.CAIRN.description': 'Content delivery network shield.',
    'tower.VETOCHKI.name': 'Backup System',
    'tower.VETOCHKI.description': 'Data persistence mechanism.',
    
    // Tower Names & Descriptions (Algorithms)
    'tower.SILVERASH.name': 'Sorting Algo',
    'tower.SILVERASH.description': 'Efficient algorithm processes wide area.',
    'tower.SURTR.name': 'Machine Learning',
    'tower.SURTR.description': 'AI model training with exponential damage.',
    'tower.THORNS.name': 'Regex Engine',
    'tower.THORNS.description': 'Pattern matching with DOT effect.',
    'tower.BLAZE.name': 'Event Loop',
    'tower.BLAZE.description': 'Asynchronous processing aura.',
    'tower.VARKARIS.name': 'Thread Pool',
    'tower.VARKARIS.description': 'Concurrent execution hits multiple targets.',
    'tower.NASTI.name': 'Compiler',
    'tower.NASTI.description': 'Code transformation and optimization.',
    'tower.HADIYA.name': 'Parser',
    'tower.HADIYA.description': 'Syntax analysis and tokenization.',
    
    // Tower Names & Descriptions (Security)
    'tower.ANGELINA.name': 'Code Linter',
    'tower.ANGELINA.description': 'Analyzes and slows problematic code.',
    'tower.GLADIITR.name': 'Firewall',
    'tower.GLADIITR.description': 'Filters and redirects malicious traffic.',
    'tower.WEEDY.name': 'Debounce',
    'tower.WEEDY.description': 'Throttles rapid requests back.',
    'tower.PHANTOM.name': 'Git Hook',
    'tower.PHANTOM.description': 'Pre-commit script automation.',
    'tower.SURFER.name': 'SSR Renderer',
    'tower.SURFER.description': 'Server-side rendering optimization.',
    'tower.PRAMANIX.name': 'Vulnerability Scanner',
    'tower.PRAMANIX.description': 'Weakens enemy security defenses.',
    'tower.ASTGENNE.name': 'Performance Monitor',
    'tower.ASTGENNE.description': 'Real-time metrics collection.',
    'tower.SUZURAN.name': 'Rate Limiter Aura',
    'tower.SUZURAN.description': 'Massive area request throttling.',
    
    // Tower Names & Descriptions (AI)
    'tower.TOGAWA.name': 'Neural Network',
    'tower.TOGAWA.description': 'Deep learning model inference.',
    'tower.UMIRI.name': 'GPT API',
    'tower.UMIRI.description': 'AI-powered processing waves.',
    'tower.MISUMI.name': 'Automation Bot',
    'tower.MISUMI.description': 'Automated support system (Concept).',
    'tower.WAKABA.name': 'Scraper Bot',
    'tower.WAKABA.description': 'Automated data extraction.',
    'tower.YUTENJI.name': 'Test Runner',
    'tower.YUTENJI.description': 'Automated test execution suite.',
    
    // Tower Names & Descriptions (Tools)
    'tower.PERFUMER.name': 'Health Check',
    'tower.PERFUMER.description': 'System monitoring (Concept).',
    'tower.HARUKA.name': 'API Gateway',
    'tower.HARUKA.description': 'Routes requests to services.',
    'tower.KICHISEI.name': 'Package Manager',
    'tower.KICHISEI.description': 'Installs multiple dependencies.',
    'tower.MATSUKIRI.name': 'Debugger',
    'tower.MATSUKIRI.description': 'Code inspection tool.',
    'tower.RAIDIAN.name': 'Task Scheduler',
    'tower.RAIDIAN.description': 'Cron job automation.',
    'tower.LEIZI.name': 'Chain Promise',
    'tower.LEIZI.description': 'Asynchronous promise chain.',
    'tower.RECORD_KEEPER.name': 'Logger',
    'tower.RECORD_KEEPER.description': 'Event logging system.',
    'tower.TIPPI.name': 'Watch Mode',
    'tower.TIPPI.description': 'File system monitoring.',
    'tower.MISS_CHRISTINE.name': 'Code Formatter',
    'tower.MISS_CHRISTINE.description': 'Automated code styling.',
    'tower.SANKTA.name': 'Build Tool',
    'tower.SANKTA.description': 'Production build system.',
    'tower.GRACEBEARER.name': 'Version Control',
    'tower.GRACEBEARER.description': 'Git repository manager.',
    'tower.CONFESS_47.name': 'CLI Tool',
    'tower.CONFESS_47.description': 'Command line interface.',
    'tower.MON3TR.name': 'Virtual Machine',
    'tower.MON3TR.description': 'Isolated execution environment.',
    'tower.ALANNA.name': 'Code Generator',
    'tower.ALANNA.description': 'Automated code generation.',
    'tower.WINDSCOOT.name': 'Web Worker',
    'tower.WINDSCOOT.description': 'Background thread processing.',
    'tower.WULFENITE.name': 'Exception Handler',
    'tower.WULFENITE.description': 'Try-catch error trapping.',
    'tower.ENTELECHIA.name': 'Garbage Collector',
    'tower.ENTELECHIA.description': 'Memory management system.',
    'tower.NOWELL.name': 'Validator',
    'tower.NOWELL.description': 'Input validation system.',
    'tower.XINGZHU.name': 'Serializer',
    'tower.XINGZHU.description': 'Data format conversion.',
    'tower.TECNO.name': 'Service Worker',
    'tower.TECNO.description': 'Background service process.',
    'tower.ROSE_SALT.name': 'Health Monitor',
    'tower.ROSE_SALT.description': 'Multi-service health checks.',
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
    
    // Tower Names & Descriptions (Basic) - Traditional Chinese
    'tower.ARCHER.name': '控制台輸出',
    'tower.ARCHER.description': '基礎除錯輸出，便宜可靠。',
    'tower.CANNON.name': '輸出語句',
    'tower.CANNON.description': '帶有濺射格式的標準輸出。',
    'tower.WIZARD.name': '錯誤處理器',
    'tower.WIZARD.description': '捕獲並處理多個錯誤。',
    'tower.MORTAR.name': '日誌框架',
    'tower.MORTAR.description': '企業級長距離日誌系統。',
    'tower.AIR_DEFENSE.name': 'HTTP 請求',
    'tower.AIR_DEFENSE.description': '高速網路請求。',
    'tower.TESLA.name': '事件監聽器',
    'tower.TESLA.description': '威脅檢測時的響應式觸發。',
    'tower.X_BOW.name': '微服務',
    'tower.X_BOW.description': '極快的 API 調用。',
    'tower.INFERNO.name': '資料庫查詢',
    'tower.INFERNO.description': '持續查詢執行，傷害隨時間遞增。',
    'tower.EAGLE.name': '雲端伺服器',
    'tower.EAGLE.description': '全球分散式處理。',
    'tower.SCATTERSHOT.name': '陣列映射',
    'tower.SCATTERSHOT.description': '同時處理多個目標。',
    'tower.MONOLITH.name': '深度學習',
    'tower.MONOLITH.description': '神經網路推理，帶有燃燒效果。',
    'tower.SPELL_TOWER.name': '中介軟體',
    'tower.SPELL_TOWER.description': '攔截並處理請求（即將推出）。',
    'tower.BUILDER.name': 'CI/CD 流水線',
    'tower.BUILDER.description': '自動化建置與部署。',
    
    // Tower Names & Descriptions (API & Services) - Traditional Chinese
    'tower.EXUSIAI.name': 'REST API',
    'tower.EXUSIAI.description': '快速的 HTTP 端點調用。',
    'tower.SCHWARZ.name': 'GraphQL',
    'tower.SCHWARZ.description': '精確資料查詢，高傷害。',
    'tower.LEMUEN.name': 'WebSocket',
    'tower.LEMUEN.description': '即時雙向連接。',
    'tower.SNOW_HUNTER.name': '快取層',
    'tower.SNOW_HUNTER.description': '凍結敵方資料存取。',
    'tower.SKYBOX.name': '負載平衡器',
    'tower.SKYBOX.description': '將請求分配到多個伺服器。',
    'tower.BRIGID.name': 'Webhook',
    'tower.BRIGID.description': '回調機制，返回資料。',
    'tower.ROSA.name': '速率限制器',
    'tower.ROSA.description': '節流並綁定大量流量。',
    'tower.W.name': '訊息佇列',
    'tower.W.description': '延遲處理，具有大量爆發。',
    
    // Tower Names & Descriptions (Frameworks) - Traditional Chinese
    'tower.TITI.name': 'React 元件',
    'tower.TITI.description': '可重用的 UI 模組，帶有狀態管理。',
    'tower.AKKORD.name': 'Express 伺服器',
    'tower.AKKORD.description': '全端伺服器框架。',
    'tower.IFRIT.name': 'Firebase',
    'tower.IFRIT.description': '即時資料庫，帶有燃燒傷害。',
    'tower.MANTRA.name': 'Vue.js',
    'tower.MANTRA.description': '漸進式框架，具有響應性。',
    'tower.CEOBE.name': 'Webpack',
    'tower.CEOBE.description': '快速打包和優化程式碼。',
    'tower.GOLDENGOLOW.name': 'Docker',
    'tower.GOLDENGOLOW.description': '容器化部署，隨處可用。',
    'tower.NECRASS.name': 'Kubernetes',
    'tower.NECRASS.description': '編排容器叢集。',
    'tower.TRAGODIA.name': 'TypeScript',
    'tower.TRAGODIA.description': '型別安全的 JavaScript，帶有編譯。',
    
    // Tower Names & Descriptions (Databases) - Traditional Chinese
    'tower.HOSHIGUMA.name': 'Redis 快取',
    'tower.HOSHIGUMA.description': '記憶體快取，粉碎附近請求。',
    'tower.MUDROCK.name': 'PostgreSQL',
    'tower.MUDROCK.description': '強大的關聯式資料庫，大規模查詢。',
    'tower.NIAN.name': 'MongoDB',
    'tower.NIAN.description': 'NoSQL 文件儲存，帶有熱度圖。',
    'tower.PENANCE.name': 'Elasticsearch',
    'tower.PENANCE.description': '全文搜尋引擎，帶有反射。',
    'tower.YU.name': '區塊鏈',
    'tower.YU.description': '分散式帳本，不可變防禦。',
    'tower.CAIRN.name': 'CDN',
    'tower.CAIRN.description': '內容傳遞網路防護。',
    'tower.VETOCHKI.name': '備份系統',
    'tower.VETOCHKI.description': '資料持久化機制。',
    
    // Tower Names & Descriptions (Algorithms) - Traditional Chinese
    'tower.SILVERASH.name': '排序演算法',
    'tower.SILVERASH.description': '高效演算法，處理廣泛區域。',
    'tower.SURTR.name': '機器學習',
    'tower.SURTR.description': 'AI 模型訓練，指數級傷害。',
    'tower.THORNS.name': '正則表達式引擎',
    'tower.THORNS.description': '模式匹配，帶有 DOT 效果。',
    'tower.BLAZE.name': '事件迴圈',
    'tower.BLAZE.description': '非同步處理光環。',
    'tower.VARKARIS.name': '執行緒池',
    'tower.VARKARIS.description': '並發執行，擊中多個目標。',
    'tower.NASTI.name': '編譯器',
    'tower.NASTI.description': '程式碼轉換與優化。',
    'tower.HADIYA.name': '解析器',
    'tower.HADIYA.description': '語法分析與標記化。',
    
    // Tower Names & Descriptions (Security) - Traditional Chinese
    'tower.ANGELINA.name': '程式碼檢查器',
    'tower.ANGELINA.description': '分析並減速問題程式碼。',
    'tower.GLADIITR.name': '防火牆',
    'tower.GLADIITR.description': '過濾並重定向惡意流量。',
    'tower.WEEDY.name': '防抖器',
    'tower.WEEDY.description': '節流快速請求返回。',
    'tower.PHANTOM.name': 'Git 鉤子',
    'tower.PHANTOM.description': '提交前腳本自動化。',
    'tower.SURFER.name': 'SSR 渲染器',
    'tower.SURFER.description': '伺服器端渲染優化。',
    'tower.PRAMANIX.name': '漏洞掃描器',
    'tower.PRAMANIX.description': '削弱敵方安全防禦。',
    'tower.ASTGENNE.name': '效能監控器',
    'tower.ASTGENNE.description': '即時指標收集。',
    'tower.SUZURAN.name': '速率限制光環',
    'tower.SUZURAN.description': '大範圍請求節流。',
    
    // Tower Names & Descriptions (AI) - Traditional Chinese
    'tower.TOGAWA.name': '神經網路',
    'tower.TOGAWA.description': '深度學習模型推理。',
    'tower.UMIRI.name': 'GPT API',
    'tower.UMIRI.description': 'AI 驅動的處理波。',
    'tower.MISUMI.name': '自動化機器人',
    'tower.MISUMI.description': '自動化支援系統（概念）。',
    'tower.WAKABA.name': '爬蟲機器人',
    'tower.WAKABA.description': '自動化資料提取。',
    'tower.YUTENJI.name': '測試執行器',
    'tower.YUTENJI.description': '自動化測試執行套件。',
    
    // Tower Names & Descriptions (Tools) - Traditional Chinese
    'tower.PERFUMER.name': '健康檢查',
    'tower.PERFUMER.description': '系統監控（概念）。',
    'tower.HARUKA.name': 'API 閘道',
    'tower.HARUKA.description': '將請求路由到服務。',
    'tower.KICHISEI.name': '套件管理器',
    'tower.KICHISEI.description': '安裝多個依賴項。',
    'tower.MATSUKIRI.name': '除錯器',
    'tower.MATSUKIRI.description': '程式碼檢查工具。',
    'tower.RAIDIAN.name': '任務排程器',
    'tower.RAIDIAN.description': '定時任務自動化。',
    'tower.LEIZI.name': '鏈式 Promise',
    'tower.LEIZI.description': '非同步 Promise 鏈。',
    'tower.RECORD_KEEPER.name': '日誌記錄器',
    'tower.RECORD_KEEPER.description': '事件日誌系統。',
    'tower.TIPPI.name': '監視模式',
    'tower.TIPPI.description': '檔案系統監控。',
    'tower.MISS_CHRISTINE.name': '程式碼格式化器',
    'tower.MISS_CHRISTINE.description': '自動化程式碼樣式。',
    'tower.SANKTA.name': '建置工具',
    'tower.SANKTA.description': '生產建置系統。',
    'tower.GRACEBEARER.name': '版本控制',
    'tower.GRACEBEARER.description': 'Git 儲存庫管理器。',
    'tower.CONFESS_47.name': 'CLI 工具',
    'tower.CONFESS_47.description': '命令列介面。',
    'tower.MON3TR.name': '虛擬機器',
    'tower.MON3TR.description': '隔離的執行環境。',
    'tower.ALANNA.name': '程式碼生成器',
    'tower.ALANNA.description': '自動化程式碼生成。',
    'tower.WINDSCOOT.name': 'Web Worker',
    'tower.WINDSCOOT.description': '背景執行緒處理。',
    'tower.WULFENITE.name': '例外處理器',
    'tower.WULFENITE.description': 'Try-catch 錯誤捕獲。',
    'tower.ENTELECHIA.name': '垃圾回收器',
    'tower.ENTELECHIA.description': '記憶體管理系統。',
    'tower.NOWELL.name': '驗證器',
    'tower.NOWELL.description': '輸入驗證系統。',
    'tower.XINGZHU.name': '序列化器',
    'tower.XINGZHU.description': '資料格式轉換。',
    'tower.TECNO.name': '服務工作者',
    'tower.TECNO.description': '背景服務進程。',
    'tower.ROSE_SALT.name': '健康監控器',
    'tower.ROSE_SALT.description': '多服務健康檢查。',
  }
};

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('gameLanguage');
  if (saved === 'zh' || saved === 'en') {
    currentLanguage = saved as Language;
  }
}

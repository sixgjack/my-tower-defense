// src/engine/data.ts
import type { TowerStats } from './types';

export const ENEMY_TYPES = [
    { name: "Bug", hp: 30, speed: 1.0, reward: 15, color: "#f87171", icon: "🐛" }, // Fast, weak
    { name: "Glitch", hp: 80, speed: 0.7, reward: 25, color: "#c084fc", icon: "👾" }, // Balanced
    { name: "Virus", hp: 200, speed: 0.4, reward: 50, color: "#4ade80", icon: "🦠" }, // Tank
    { name: "Trojan", hp: 400, speed: 0.3, reward: 100, color: "#fbbf24", icon: "🐴" }, // Boss-like
    { name: "Worm", hp: 60, speed: 1.2, reward: 20, color: "#f472b6", icon: "🪱" }, // Very fast
];

// Add 'obstacleChar' to your THEMES
export const THEMES = [
  { 
    name: 'Cyber City', 
    bg: 'bg-slate-900', 
    grid: 'border-cyan-900/30', 
    path: 'bg-cyan-900/20', 
    obstacle: '🧱', // Firewall/Block
    obstacleColor: '#0891b2'
  },
  { 
    name: 'Forest Ruin', 
    bg: 'bg-emerald-950', 
    grid: 'border-emerald-800/30', 
    path: 'bg-stone-800/40', 
    obstacle: '🌲', // Tree
    obstacleColor: '#059669'
  },
  { 
    name: 'Mars Base', 
    bg: 'bg-orange-950', 
    grid: 'border-orange-900/30', 
    path: 'bg-red-900/20', 
    obstacle: '🪨', // Rock
    obstacleColor: '#7c2d12'
  },
  { 
    name: 'Deep Space', 
    bg: 'bg-indigo-950', 
    grid: 'border-indigo-800/30', 
    path: 'bg-violet-900/20', 
    obstacle: '☄️', // Meteor
    obstacleColor: '#4c1d95'
  }
];

// ... (Keep existing TOWERS and ENEMIES)

export const TOWERS: Record<string, TowerStats> = {
  // ==========================================
  // BASIC OUTPUT & LOGGING (Entry Level)
  // ==========================================
  'ARCHER': {
    name: 'Console.log', cost: 50, damage: 12, range: 3.5, cooldown: 50,
    type: 'projectile', color: '#fbbf24', icon: '💬',
    description: 'Basic debug output. Cheap and reliable.',
    projectileStyle: 'dot'
  },
  'CANNON': {
    name: 'Print Statement', cost: 120, damage: 45, range: 4, cooldown: 100,
    type: 'area', color: '#1e293b', icon: '📝',
    description: 'Standard output with splash formatting.', areaRadius: 1.5,
    projectileStyle: 'arc'
  },
  'WIZARD': {
    name: 'Error Handler', cost: 200, damage: 30, range: 3, cooldown: 60,
    type: 'area', color: '#8b5cf6', icon: '⚠️',
    description: 'Catches and processes multiple errors.', areaRadius: 2.0,
    projectileStyle: 'fire'
  },
  'MORTAR': {
    name: 'Logger Framework', cost: 350, damage: 120, range: 6, cooldown: 200,
    type: 'area', color: '#475569', icon: '📊',
    description: 'Enterprise logging with long range.', areaRadius: 2.5,
    projectileStyle: 'arc'
  },
  'AIR_DEFENSE': {
    name: 'HTTP Request', cost: 180, damage: 80, range: 5, cooldown: 40,
    type: 'projectile', color: '#ef4444', icon: '🌐',
    description: 'High-speed network requests.',
    projectileStyle: 'missile'
  },
  'TESLA': {
    name: 'Event Listener', cost: 250, damage: 90, range: 2.5, cooldown: 55,
    type: 'projectile', color: '#facc15', icon: '👂',
    description: 'Reactive trigger when threats detected.',
    projectileStyle: 'lightning'
  },
  'X_BOW': {
    name: 'Microservice', cost: 500, damage: 8, range: 7, cooldown: 6,
    type: 'projectile', color: '#ec4899', icon: '⚡',
    description: 'Extremely fast API calls.', projectileSpeed: 0.25,
    projectileStyle: 'arrow_classic'
  },
  'INFERNO': {
    name: 'Database Query', cost: 600, damage: 5, range: 4.5, cooldown: 5,
    type: 'beam', color: '#ef4444', icon: '💾',
    description: 'Continuous query execution. Damage ramps up over time.', beamRamp: 0.8
  },
  'EAGLE': {
    name: 'Cloud Server', cost: 1000, damage: 300, range: 99, cooldown: 350,
    type: 'area', color: '#fff', icon: '☁️',
    description: 'Global distributed processing.', areaRadius: 3,
    projectileStyle: 'arc'
  },
  'SCATTERSHOT': {
    name: 'Array.map()', cost: 550, damage: 40, range: 3, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '📋',
    description: 'Processes multiple targets simultaneously.', multiTarget: 3,
    projectileStyle: 'shotgun'
  },
  'MONOLITH': {
    name: 'Deep Learning', cost: 1500, damage: 500, range: 5, cooldown: 150,
    type: 'projectile', color: '#020617', icon: '🧠',
    description: 'Neural network inference with burn effect.', burnDamage: 20,
    projectileStyle: 'fire'
  },
  'SPELL_TOWER': {
    name: 'Middleware', cost: 300, damage: 0, range: 3, cooldown: 1000,
    type: 'aura', color: '#db2777', icon: '🔗',
    description: 'Intercepts and processes requests (Coming Soon).',
    projectileStyle: 'magic'
  },
  'BUILDER': {
    name: 'CI/CD Pipeline', cost: 2000, damage: 20, range: 2, cooldown: 30,
    type: 'projectile', color: '#a3e635', icon: '🔄',
    description: 'Automated build and deployment.',
    projectileStyle: 'bullet'
  },

  // ==========================================
  // API & SERVICES (Intermediate)
  // ==========================================
  'EXUSIAI': {
    name: 'REST API', cost: 550, damage: 15, range: 4, cooldown: 8,
    type: 'projectile', color: '#ef4444', icon: '🌐',
    description: 'Rapid HTTP endpoint calls.', projectileSpeed: 0.9,
    projectileStyle: 'dot'
  },
  'SCHWARZ': {
    name: 'GraphQL', cost: 650, damage: 400, range: 3, cooldown: 150,
    type: 'projectile', color: '#1e1e1e', icon: '📊',
    description: 'Precise data query with high damage.',
    projectileStyle: 'sniper'
  },
  'LEMUEN': {
    name: 'WebSocket', cost: 600, damage: 180, range: 6, cooldown: 140,
    type: 'projectile', color: '#fcd34d', icon: '🔌',
    description: 'Real-time bidirectional connection.',
    projectileStyle: 'sniper'
  },
  'SNOW_HUNTER': {
    name: 'Cache Layer', cost: 320, damage: 90, range: 4, cooldown: 100,
    type: 'projectile', color: '#cbd5e1', icon: '❄️',
    description: 'Freezes enemy data access.', slowFactor: 0.5,
    projectileStyle: 'ice'
  },
  'SKYBOX': {
    name: 'Load Balancer', cost: 450, damage: 65, range: 5, cooldown: 55,
    type: 'area', color: '#0ea5e9', icon: '⚖️',
    description: 'Distributes requests across servers.',
    projectileStyle: 'rocket'
  },
  'BRIGID': {
    name: 'Webhook', cost: 380, damage: 55, range: 3.5, cooldown: 45,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Callback mechanism that returns data.',
    projectileStyle: 'boomerang'
  },
  'ROSA': {
    name: 'Rate Limiter', cost: 580, damage: 110, range: 5, cooldown: 160,
    type: 'pull', color: '#fff', icon: '🚦',
    description: 'Throttles and binds heavy traffic.', stunDuration: 30
  },
  'W': {
    name: 'Message Queue', cost: 600, damage: 200, range: 4, cooldown: 120,
    type: 'area', color: '#dc2626', icon: '📬',
    description: 'Delayed processing with massive burst.', areaRadius: 2.0,
    projectileStyle: 'grenade'
  },

  // ==========================================
  // FRAMEWORKS & LIBRARIES (Advanced)
  // ==========================================
  'TITI': {
    name: 'React Component', cost: 300, damage: 45, range: 3.5, cooldown: 60,
    type: 'projectile', color: '#8b5cf6', icon: '⚛️',
    description: 'Reusable UI module with state management.',
    projectileStyle: 'needle'
  },
  'AKKORD': {
    name: 'Express Server', cost: 700, damage: 95, range: 8, cooldown: 180,
    type: 'area', color: '#f472b6', icon: '🚂',
    description: 'Full-stack server framework.',
    projectileStyle: 'arc'
  },
  'IFRIT': {
    name: 'Firebase', cost: 750, damage: 120, range: 5, cooldown: 50,
    type: 'line', color: '#ff5722', icon: '🔥',
    description: 'Real-time database with burn damage.', burnDamage: 10
  },
  'MANTRA': {
    name: 'Vue.js', cost: 350, damage: 35, range: 4, cooldown: 50,
    type: 'projectile', color: '#14b8a6', icon: '💚',
    description: 'Progressive framework with reactivity.',
    projectileStyle: 'poison'
  },
  'CEOBE': {
    name: 'Webpack', cost: 400, damage: 50, range: 3.5, cooldown: 35,
    type: 'projectile', color: '#fb923c', icon: '📦',
    description: 'Bundles and optimizes code rapidly.',
    projectileStyle: 'blade'
  },
  'GOLDENGOLOW': {
    name: 'Docker', cost: 450, damage: 20, range: 99, cooldown: 20,
    type: 'projectile', color: '#f9a8d4', icon: '🐳',
    description: 'Containerized deployment anywhere.',
    projectileStyle: 'lightning'
  },
  'NECRASS': {
    name: 'Kubernetes', cost: 520, damage: 70, range: 3, cooldown: 80,
    type: 'summon', color: '#4c1d95', icon: '☸️',
    description: 'Orchestrates container clusters.',
  },
  'TRAGODIA': {
    name: 'TypeScript', cost: 310, damage: 40, range: 3, cooldown: 55,
    type: 'projectile', color: '#7e22ce', icon: '📘',
    description: 'Type-safe JavaScript with compilation.',
    projectileStyle: 'shadow'
  },

  // ==========================================
  // DATABASES & STORAGE (Defensive)
  // ==========================================
  'HOSHIGUMA': {
    name: 'Redis Cache', cost: 550, damage: 60, range: 1.5, cooldown: 30,
    type: 'aura', color: '#22c55e', icon: '🗄️',
    description: 'In-memory cache shreds nearby requests.',
    projectileStyle: 'saw'
  },
  'MUDROCK': {
    name: 'PostgreSQL', cost: 900, damage: 350, range: 1.5, cooldown: 180,
    type: 'area', color: '#57534e', icon: '🐘',
    description: 'Robust relational database with massive queries.', areaRadius: 2.0,
    projectileStyle: 'cannonball'
  },
  'NIAN': {
    name: 'MongoDB', cost: 600, damage: 80, range: 1.5, cooldown: 60,
    type: 'aura', color: '#ef4444', icon: '🍃',
    description: 'NoSQL document store with heat map.', burnDamage: 15,
    projectileStyle: 'fire'
  },
  'PENANCE': {
    name: 'Elasticsearch', cost: 620, damage: 140, range: 1.5, cooldown: 90,
    type: 'projectile', color: '#9f1239', icon: '🔍',
    description: 'Full-text search engine with reflection.',
    projectileStyle: 'orb'
  },
  'YU': {
    name: 'Blockchain', cost: 700, damage: 100, range: 1.5, cooldown: 70,
    type: 'aura', color: '#b91c1c', icon: '⛓️',
    description: 'Distributed ledger with immutable defense.',
    projectileStyle: 'fire'
  },
  'CAIRN': {
    name: 'CDN', cost: 480, damage: 50, range: 1.5, cooldown: 50,
    type: 'projectile', color: '#64748b', icon: '🌍',
    description: 'Content delivery network shield.',
    projectileStyle: 'disc'
  },
  'VETOCHKI': {
    name: 'Backup System', cost: 510, damage: 65, range: 1.5, cooldown: 60,
    type: 'projectile', color: '#334155', icon: '💿',
    description: 'Data persistence mechanism.',
    projectileStyle: 'spike'
  },

  // ==========================================
  // ALGORITHMS & LOGIC (High DPS)
  // ==========================================
  'SILVERASH': {
    name: 'Sorting Algo', cost: 1000, damage: 220, range: 3.5, cooldown: 70,
    type: 'area', color: '#cbd5e1', icon: '🔀',
    description: 'Efficient algorithm processes wide area.',
    projectileStyle: 'blade'
  },
  'SURTR': {
    name: 'Machine Learning', cost: 900, damage: 400, range: 2.5, cooldown: 40,
    type: 'beam', color: '#f59e0b', icon: '🤖',
    description: 'AI model training with exponential damage.', beamRamp: 2.0
  },
  'THORNS': {
    name: 'Regex Engine', cost: 550, damage: 70, range: 3, cooldown: 45,
    type: 'projectile', color: '#d97706', icon: '🔤',
    description: 'Pattern matching with DOT effect.', burnDamage: 10,
    projectileStyle: 'poison'
  },
  'BLAZE': {
    name: 'Event Loop', cost: 600, damage: 110, range: 2, cooldown: 20,
    type: 'aura', color: '#ea580c', icon: '♻️',
    description: 'Asynchronous processing aura.',
    projectileStyle: 'fire'
  },
  'VARKARIS': {
    name: 'Thread Pool', cost: 450, damage: 90, range: 1.5, cooldown: 50,
    type: 'area', color: '#94a3b8', icon: '🧵',
    description: 'Concurrent execution hits multiple targets.',
    projectileStyle: 'bullet'
  },
  'NASTI': {
    name: 'Compiler', cost: 400, damage: 60, range: 1.5, cooldown: 55,
    type: 'projectile', color: '#475569', icon: '⚙️',
    description: 'Code transformation and optimization.',
    projectileStyle: 'needle'
  },
  'HADIYA': {
    name: 'Parser', cost: 380, damage: 55, range: 1.5, cooldown: 45,
    type: 'projectile', color: '#a8a29e', icon: '📖',
    description: 'Syntax analysis and tokenization.',
    projectileStyle: 'arrow'
  },

  // ==========================================
  // SECURITY & OPTIMIZATION (CC)
  // ==========================================
  'ANGELINA': {
    name: 'Code Linter', cost: 400, damage: 25, range: 4, cooldown: 20,
    type: 'projectile', color: '#818cf8', icon: '🔍',
    description: 'Analyzes and slows problematic code.', slowFactor: 0.7,
    projectileStyle: 'vortex'
  },
  'GLADIITR': {
    name: 'Firewall', cost: 500, damage: 80, range: 3.5, cooldown: 90,
    type: 'pull', color: '#1e3a8a', icon: '🛡️',
    description: 'Filters and redirects malicious traffic.', pullStrength: 1.5,
    projectileStyle: 'vortex'
  },
  'WEEDY': {
    name: 'Debounce', cost: 450, damage: 60, range: 3, cooldown: 100,
    type: 'pull', color: '#2dd4bf', icon: '⏱️',
    description: 'Throttles rapid requests back.', pullStrength: -2.0,
    projectileStyle: 'ice'
  },
  'PHANTOM': {
    name: 'Git Hook', cost: 300, damage: 80, range: 2, cooldown: 40,
    type: 'projectile', color: '#111827', icon: '🪝',
    description: 'Pre-commit script automation.',
    projectileStyle: 'kunai'
  },
  'SURFER': {
    name: 'SSR Renderer', cost: 250, damage: 45, range: 1.5, cooldown: 30,
    type: 'projectile', color: '#0ea5e9', icon: '🌊',
    description: 'Server-side rendering optimization.',
    projectileStyle: 'ice'
  },
  'PRAMANIX': {
    name: 'Vulnerability Scanner', cost: 350, damage: 30, range: 3.5, cooldown: 60,
    type: 'aura', color: '#fff', icon: '🔒',
    description: 'Weakens enemy security defenses.',
    projectileStyle: 'holy'
  },
  'ASTGENNE': {
    name: 'Performance Monitor', cost: 380, damage: 40, range: 3, cooldown: 50,
    type: 'projectile', color: '#facc15', icon: '📈',
    description: 'Real-time metrics collection.',
    projectileStyle: 'star'
  },
  'SUZURAN': {
    name: 'Rate Limiter Aura', cost: 500, damage: 10, range: 4, cooldown: 10,
    type: 'aura', color: '#fef08a', icon: '🚦',
    description: 'Massive area request throttling.', slowFactor: 0.4,
    projectileStyle: 'fire'
  },

  // ==========================================
  // AI & AUTOMATION (Special)
  // ==========================================
  'TOGAWA': {
    name: 'Neural Network', cost: 420, damage: 95, range: 3, cooldown: 60,
    type: 'beam', color: '#4c1d95', icon: '🧠',
    description: 'Deep learning model inference.', beamRamp: 0.6
  },
  'UMIRI': {
    name: 'GPT API', cost: 380, damage: 110, range: 1.5, cooldown: 45,
    type: 'aura', color: '#be185d', icon: '🤖',
    description: 'AI-powered processing waves.',
  },
  'MISUMI': {
    name: 'Automation Bot', cost: 300, damage: 0, range: 3, cooldown: 60,
    type: 'aura', color: '#fcd34d', icon: '🤖',
    description: 'Automated support system (Concept).',
  },
  'WAKABA': {
    name: 'Scraper Bot', cost: 400, damage: 85, range: 1.5, cooldown: 40,
    type: 'projectile', color: '#10b981', icon: '🕷️',
    description: 'Automated data extraction.',
  },
  'YUTENJI': {
    name: 'Test Runner', cost: 450, damage: 130, range: 1.5, cooldown: 80,
    type: 'area', color: '#fca5a5', icon: '🧪',
    description: 'Automated test execution suite.',
  },

  // ==========================================
  // TOOLS & UTILITIES (Support)
  // ==========================================
  'PERFUMER': { name: 'Health Check', cost: 200, damage: 10, range: 3, cooldown: 60, type: 'projectile', color: '#bef264', icon: '💚', description: 'System monitoring (Concept).' },
  'HARUKA': { name: 'API Gateway', cost: 220, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#a5f3fc', icon: '🚪', description: 'Routes requests to services.' },
  'KICHISEI': { name: 'Package Manager', cost: 480, damage: 60, range: 2.5, cooldown: 80, type: 'spread', color: '#fdba74', icon: '📦', description: 'Installs multiple dependencies.' },
  'MATSUKIRI': { name: 'Debugger', cost: 350, damage: 45, range: 1.5, cooldown: 50, type: 'projectile', color: '#94a3b8', icon: '🐛', description: 'Code inspection tool.' },
  'RAIDIAN': { name: 'Task Scheduler', cost: 300, damage: 35, range: 3, cooldown: 55, type: 'summon', color: '#e2e8f0', icon: '⏰', description: 'Cron job automation.' },
  'LEIZI': { name: 'Chain Promise', cost: 580, damage: 70, range: 3.5, cooldown: 65, type: 'projectile', color: '#fcd34d', icon: '⚡', description: 'Asynchronous promise chain.' },
  'RECORD_KEEPER': { name: 'Logger', cost: 200, damage: 15, range: 3, cooldown: 70, type: 'projectile', color: '#fff', icon: '📝', description: 'Event logging system.' },
  'TIPPI': { name: 'Watch Mode', cost: 360, damage: 50, range: 3, cooldown: 50, type: 'projectile', color: '#86efac', icon: '👁️', description: 'File system monitoring.' },
  'MISS_CHRISTINE': { name: 'Code Formatter', cost: 280, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#f472b6', icon: '✨', description: 'Automated code styling.' },
  'SANKTA': { name: 'Build Tool', cost: 600, damage: 80, range: 1.5, cooldown: 50, type: 'projectile', color: '#fca5a5', icon: '🔨', description: 'Production build system.' },
  'GRACEBEARER': { name: 'Version Control', cost: 550, damage: 90, range: 1.5, cooldown: 60, type: 'projectile', color: '#fbbf24', icon: '📚', description: 'Git repository manager.' },
  'CONFESS_47': { name: 'CLI Tool', cost: 100, damage: 20, range: 1.5, cooldown: 30, type: 'projectile', color: '#94a3b8', icon: '⌨️', description: 'Command line interface.' },
  'MON3TR': { name: 'Virtual Machine', cost: 400, damage: 200, range: 2, cooldown: 60, type: 'projectile', color: '#10b981', icon: '🖥️', description: 'Isolated execution environment.' },
  'ALANNA': { name: 'Code Generator', cost: 350, damage: 50, range: 1.5, cooldown: 55, type: 'projectile', color: '#d6d3d1', icon: '🏭', description: 'Automated code generation.' },
  'WINDSCOOT': { name: 'Web Worker', cost: 400, damage: 80, range: 1.5, cooldown: 40, type: 'projectile', color: '#bae6fd', icon: '💨', description: 'Background thread processing.' },
  'WULFENITE': { name: 'Exception Handler', cost: 320, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#fde047', icon: '🪤', description: 'Try-catch error trapping.' },
  'ENTELECHIA': { name: 'Garbage Collector', cost: 600, damage: 100, range: 1.5, cooldown: 60, type: 'area', color: '#1e293b', icon: '🗑️', description: 'Memory management system.' },
  'NOWELL': { name: 'Validator', cost: 250, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#bfdbfe', icon: '✅', description: 'Input validation system.' },
  'XINGZHU': { name: 'Serializer', cost: 300, damage: 30, range: 3, cooldown: 55, type: 'projectile', color: '#fca5a5', icon: '🔄', description: 'Data format conversion.' },
  'TECNO': { name: 'Service Worker', cost: 350, damage: 40, range: 3, cooldown: 50, type: 'summon', color: '#a5f3fc', icon: '👷', description: 'Background service process.' },
  'ROSE_SALT': { name: 'Health Monitor', cost: 280, damage: 15, range: 3, cooldown: 60, type: 'projectile', color: '#fbcfe8', icon: '💓', description: 'Multi-service health checks.' },
};

// src/engine/data.ts

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
  // CLASSIC DEFENSE (Clash/Generic)
  // ==========================================
  'ARCHER': {
    name: 'Archer Tower', cost: 50, damage: 12, range: 3.5, cooldown: 50,
    type: 'projectile', color: '#fbbf24', icon: '🏹',
    description: 'Basic rapid fire unit. Cheap and reliable.',
    projectileStyle: 'dot'
  },
  'CANNON': {
    name: 'Cannon', cost: 120, damage: 45, range: 4, cooldown: 100,
    type: 'area', color: '#1e293b', icon: '💣',
    description: 'Deals splash damage to grouped enemies.', areaRadius: 1.5,
    projectileStyle: 'arc'
  },
  'WIZARD': {
    name: 'Wizard Tower', cost: 200, damage: 30, range: 3, cooldown: 60,
    type: 'area', color: '#8b5cf6', icon: '🧙‍♂️',
    description: 'Magical splash damage.', areaRadius: 2.0,
    projectileStyle: 'fire'
  },
  'MORTAR': {
    name: 'Mortar', cost: 350, damage: 120, range: 6, cooldown: 200,
    type: 'area', color: '#475569', icon: '🧨',
    description: 'Huge damage, long range, blind spot nearby.', areaRadius: 2.5,
    projectileStyle: 'arc'
  },
  'AIR_DEFENSE': {
    name: 'Air Defense', cost: 180, damage: 80, range: 5, cooldown: 40,
    type: 'projectile', color: '#ef4444', icon: '🚀',
    description: 'High damage single target rockets.',
    projectileStyle: 'missile'
  },
  'TESLA': {
    name: 'Hidden Tesla', cost: 250, damage: 90, range: 2.5, cooldown: 55,
    type: 'projectile', color: '#facc15', icon: '⚡',
    description: 'Hidden until enemies are close. Fast shock.',
    projectileStyle: 'lightning'
  },
  'X_BOW': {
    name: 'X-Bow', cost: 500, damage: 8, range: 7, cooldown: 6,
    type: 'projectile', color: '#ec4899', icon: '⚔️',
    description: 'Insanely fast fire rate.', projectileSpeed: 0.25,
    projectileStyle: 'arrow_classic'
  },
  'INFERNO': {
    name: 'Inferno Tower', cost: 600, damage: 5, range: 4.5, cooldown: 5,
    type: 'beam', color: '#ef4444', icon: '🔥',
    description: 'Melts high HP tanks. Damage ramps up over time.', beamRamp: 0.8
  },
  'EAGLE': {
    name: 'Eagle Artillery', cost: 1000, damage: 300, range: 99, cooldown: 350,
    type: 'area', color: '#fff', icon: '🦅',
    description: 'Map-wide range artillery strike.', areaRadius: 3,
    projectileStyle: 'arc'
  },
  'SCATTERSHOT': {
    name: 'Scattershot', cost: 550, damage: 40, range: 3, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '🌂',
    description: 'Fires a cone of stones.', multiTarget: 3,
    projectileStyle: 'shotgun'
  },
  'MONOLITH': {
    name: 'Monolith', cost: 1500, damage: 500, range: 5, cooldown: 150,
    type: 'projectile', color: '#020617', icon: '⬛',
    description: 'Dark energy that decimates tanks.', burnDamage: 20,
    projectileStyle: 'fire'
  },
  'SPELL_TOWER': {
    name: 'Spell Tower', cost: 300, damage: 0, range: 3, cooldown: 1000,
    type: 'aura', color: '#db2777', icon: '📜',
    description: 'Support tower (Coming Soon).',
    projectileStyle: 'magic'
  },
  'BUILDER': {
    name: 'Builder Hut', cost: 2000, damage: 20, range: 2, cooldown: 30,
    type: 'projectile', color: '#a3e635', icon: '🔨',
    description: 'Fast repair (combat stats for now).',
    projectileStyle: 'bullet'
  },

  // ==========================================
  // ARKNIGHTS / ANIME - SNIPERS & RANGED
  // ==========================================
  'EXUSIAI': {
    name: 'Exusiai', cost: 550, damage: 15, range: 4, cooldown: 8,
    type: 'projectile', color: '#ef4444', icon: '😇',
    description: 'Vector: Extreme attack speed barrage.', projectileSpeed: 0.9,
    projectileStyle: 'dot'
  },
  'SCHWARZ': {
    name: 'Schwarz', cost: 650, damage: 400, range: 3, cooldown: 150,
    type: 'projectile', color: '#1e1e1e', icon: '♟️',
    description: 'Final Tactic: Massive armor piercing shot.',
    projectileStyle: 'sniper'
  },
  'LEMUEN': {
    name: 'Lemuen', cost: 600, damage: 180, range: 6, cooldown: 140,
    type: 'projectile', color: '#fcd34d', icon: '🎯',
    description: 'Target priority: Lowest DEF.',
    projectileStyle: 'sniper'
  },
  'SNOW_HUNTER': {
    name: 'Snow Hunter', cost: 320, damage: 90, range: 4, cooldown: 100,
    type: 'projectile', color: '#cbd5e1', icon: '❄️',
    description: 'Freezes enemies on hit.', slowFactor: 0.5,
    projectileStyle: 'ice'
  },
  'SKYBOX': {
    name: 'Skybox', cost: 450, damage: 65, range: 5, cooldown: 55,
    type: 'area', color: '#0ea5e9', icon: '✈️',
    description: 'Deployable anti-air platform.',
    projectileStyle: 'rocket'
  },
  'BRIGID': {
    name: 'Brigid', cost: 380, damage: 55, range: 3.5, cooldown: 45,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Boomerang projectile returns.',
    projectileStyle: 'boomerang'
  },
  'ROSA': {
    name: 'Rosa', cost: 580, damage: 110, range: 5, cooldown: 160,
    type: 'pull', color: '#fff', icon: '⚓',
    description: 'Binds heavy targets in place.', stunDuration: 30
  },
  'W': {
    name: 'W', cost: 600, damage: 200, range: 4, cooldown: 120,
    type: 'area', color: '#dc2626', icon: '🧨',
    description: 'D12: Massive delayed explosion.', areaRadius: 2.0,
    projectileStyle: 'grenade'
  },

  // ==========================================
  // ARKNIGHTS - CASTERS & ARTS
  // ==========================================
  'TITI': {
    name: 'Titi', cost: 300, damage: 45, range: 3.5, cooldown: 60,
    type: 'projectile', color: '#8b5cf6', icon: '💉',
    description: 'Heals allies (Concept: Magic Dmg for now).',
    projectileStyle: 'needle'
  },
  'AKKORD': {
    name: 'Akkord', cost: 700, damage: 95, range: 8, cooldown: 180,
    type: 'area', color: '#f472b6', icon: '🎼',
    description: 'Global range bombardment.',
    projectileStyle: 'arc'
  },
  'IFRIT': {
    name: 'Ifrit', cost: 750, damage: 120, range: 5, cooldown: 50,
    type: 'line', color: '#ff5722', icon: '🔥',
    description: 'Burns a straight line of tiles.', burnDamage: 10
  },
  'MANTRA': {
    name: 'Mantra', cost: 350, damage: 35, range: 4, cooldown: 50,
    type: 'projectile', color: '#14b8a6', icon: '🐍',
    description: 'Elemental Arts damage.',
    projectileStyle: 'poison'
  },
  'CEOBE': {
    name: 'Ceobe', cost: 400, damage: 50, range: 3.5, cooldown: 35,
    type: 'projectile', color: '#fb923c', icon: '🪓',
    description: 'Very Real Axe: Throws weapons rapidly.',
    projectileStyle: 'blade'
  },
  'GOLDENGOLOW': {
    name: 'Goldenglow', cost: 450, damage: 20, range: 99, cooldown: 20,
    type: 'projectile', color: '#f9a8d4', icon: '⚡',
    description: 'Drone seeks enemies anywhere.',
    projectileStyle: 'lightning'
  },
  'NECRASS': {
    name: 'Necrass', cost: 520, damage: 70, range: 3, cooldown: 80,
    type: 'summon', color: '#4c1d95', icon: '👻',
    description: 'Summons spirits from defeated enemies.',
  },
  'TRAGODIA': {
    name: 'Tragodia', cost: 310, damage: 40, range: 3, cooldown: 55,
    type: 'projectile', color: '#7e22ce', icon: '🎭',
    description: 'Arts damage with mental corruption.',
    projectileStyle: 'shadow'
  },

  // ==========================================
  // ARKNIGHTS - DEFENDERS (High Block/Aura)
  // ==========================================
  'HOSHIGUMA': {
    name: 'Hoshiguma', cost: 550, damage: 60, range: 1.5, cooldown: 30,
    type: 'aura', color: '#22c55e', icon: '🟢',
    description: 'Sawblade: Shreds all enemies in melee range.',
    projectileStyle: 'saw'
  },
  'MUDROCK': {
    name: 'Mudrock', cost: 900, damage: 350, range: 1.5, cooldown: 180,
    type: 'area', color: '#57534e', icon: '🔨',
    description: 'Sledgehammer: Massive AoE spin.', areaRadius: 2.0,
    projectileStyle: 'cannonball'
  },
  'NIAN': {
    name: 'Nian', cost: 600, damage: 80, range: 1.5, cooldown: 60,
    type: 'aura', color: '#ef4444', icon: '🏮',
    description: 'Heat aura burns nearby enemies.', burnDamage: 15,
    projectileStyle: 'fire'
  },
  'PENANCE': {
    name: 'Penance', cost: 620, damage: 140, range: 1.5, cooldown: 90,
    type: 'projectile', color: '#9f1239', icon: '⚖️',
    description: 'Reflects damage.',
    projectileStyle: 'orb'
  },
  'YU': {
    name: 'Yu', cost: 700, damage: 100, range: 1.5, cooldown: 70,
    type: 'aura', color: '#b91c1c', icon: '🐉',
    description: 'Dragon aura defense.',
    projectileStyle: 'fire'
  },
  'CAIRN': {
    name: 'Cairn', cost: 480, damage: 50, range: 1.5, cooldown: 50,
    type: 'projectile', color: '#64748b', icon: '🛡️',
    description: 'Solid defense.',
    projectileStyle: 'disc'
  },
  'VETOCHKI': {
    name: 'Vetochki', cost: 510, damage: 65, range: 1.5, cooldown: 60,
    type: 'projectile', color: '#334155', icon: '🪵',
    description: 'Unstoppable force.',
    projectileStyle: 'spike'
  },

  // ==========================================
  // ARKNIGHTS - GUARDS (Melee DPS)
  // ==========================================
  'SILVERASH': {
    name: 'SilverAsh', cost: 1000, damage: 220, range: 3.5, cooldown: 70,
    type: 'area', color: '#cbd5e1', icon: '🗡️',
    description: 'True Silver Slash: Wide area massive damage.',
    projectileStyle: 'blade'
  },
  'SURTR': {
    name: 'Surtr', cost: 900, damage: 400, range: 2.5, cooldown: 40,
    type: 'beam', color: '#f59e0b', icon: '👿',
    description: 'Twilight: Massive damage, drains own HP.', beamRamp: 2.0
  },
  'THORNS': {
    name: 'Thorns', cost: 550, damage: 70, range: 3, cooldown: 45,
    type: 'projectile', color: '#d97706', icon: '🌵',
    description: 'Destreza: Poisonous ranged attacks.', burnDamage: 10,
    projectileStyle: 'poison'
  },
  'BLAZE': {
    name: 'Blaze', cost: 600, damage: 110, range: 2, cooldown: 20,
    type: 'aura', color: '#ea580c', icon: '🔥',
    description: 'Chainsaw module: Constant area damage.',
    projectileStyle: 'fire'
  },
  'VARKARIS': {
    name: 'Varkaris', cost: 450, damage: 90, range: 1.5, cooldown: 50,
    type: 'area', color: '#94a3b8', icon: '🐮',
    description: 'Minos warrior. Hits multiple enemies.',
    projectileStyle: 'bullet'
  },
  'NASTI': {
    name: 'Nasti', cost: 400, damage: 60, range: 1.5, cooldown: 55,
    type: 'projectile', color: '#475569', icon: '🔧',
    description: 'Artificer support.',
    projectileStyle: 'needle'
  },
  'HADIYA': {
    name: 'Hadiya', cost: 380, damage: 55, range: 1.5, cooldown: 45,
    type: 'projectile', color: '#a8a29e', icon: '⚔️',
    description: 'Mercenary strikes.',
    projectileStyle: 'arrow'
  },

  // ==========================================
  // SPECIALISTS & SUPPORTERS (Crowd Control)
  // ==========================================
  'ANGELINA': {
    name: 'Angelina', cost: 400, damage: 25, range: 4, cooldown: 20,
    type: 'projectile', color: '#818cf8', icon: '💫',
    description: 'Anti-Gravity: Makes enemies lighter (slower).', slowFactor: 0.7,
    projectileStyle: 'vortex'
  },
  'GLADIITR': {
    name: 'Gladiia', cost: 500, damage: 80, range: 3.5, cooldown: 90,
    type: 'pull', color: '#1e3a8a', icon: '⚓',
    description: 'Drags distant enemies into a vortex.', pullStrength: 1.5,
    projectileStyle: 'vortex'
  },
  'WEEDY': {
    name: 'Weedy', cost: 450, damage: 60, range: 3, cooldown: 100,
    type: 'pull', color: '#2dd4bf', icon: '🌊',
    description: 'Liquid Nitrogen Cannon: Pushes enemies back.', pullStrength: -2.0,
    projectileStyle: 'ice'
  },
  'PHANTOM': {
    name: 'Phantom', cost: 300, damage: 80, range: 2, cooldown: 40,
    type: 'projectile', color: '#111827', icon: '🐱',
    description: 'Fast redeploy assassin.',
    projectileStyle: 'kunai'
  },
  'SURFER': {
    name: 'Surfer', cost: 250, damage: 45, range: 1.5, cooldown: 30,
    type: 'projectile', color: '#0ea5e9', icon: '🏄‍♀️',
    description: 'Fast redeploy water strike.',
    projectileStyle: 'ice'
  },
  'PRAMANIX': {
    name: 'Pramanix', cost: 350, damage: 30, range: 3.5, cooldown: 60,
    type: 'aura', color: '#fff', icon: '🔔',
    description: 'Weakens enemy defense.',
    projectileStyle: 'holy'
  },
  'ASTGENNE': {
    name: 'Astgenne', cost: 380, damage: 40, range: 3, cooldown: 50,
    type: 'projectile', color: '#facc15', icon: '🌟',
    description: 'Star-light arts.',
    projectileStyle: 'star'
  },
  'SUZURAN': {
    name: 'Suzuran', cost: 500, damage: 10, range: 4, cooldown: 10,
    type: 'aura', color: '#fef08a', icon: '🦊',
    description: 'Foxfire: Massive area slow.', slowFactor: 0.4,
    projectileStyle: 'fire'
  },

  // ==========================================
  // AVE MUJICA (Collab)
  // ==========================================
  'TOGAWA': {
    name: 'Sakiko', cost: 420, damage: 95, range: 3, cooldown: 60,
    type: 'beam', color: '#4c1d95', icon: '🎹',
    description: 'Melancholic melody drains HP.', beamRamp: 0.6
  },
  'UMIRI': {
    name: 'Umiri', cost: 380, damage: 110, range: 1.5, cooldown: 45,
    type: 'aura', color: '#be185d', icon: '🎸',
    description: 'Bass shockwaves.',
  },
  'MISUMI': {
    name: 'Uika', cost: 300, damage: 0, range: 3, cooldown: 60,
    type: 'aura', color: '#fcd34d', icon: '🎤',
    description: 'Idol aura heals/buffs (Concept).',
  },
  'WAKABA': {
    name: 'Mutsumi', cost: 400, damage: 85, range: 1.5, cooldown: 40,
    type: 'projectile', color: '#10b981', icon: '🥒',
    description: 'Puppet master strike.',
  },
  'YUTENJI': {
    name: 'Nyamu', cost: 450, damage: 130, range: 1.5, cooldown: 80,
    type: 'area', color: '#fca5a5', icon: '🥁',
    description: 'Earthshaker drums.',
  },

  // ==========================================
  // OTHERS (User List Completers)
  // ==========================================
  'PERFUMER': { name: 'Perfumer', cost: 200, damage: 10, range: 3, cooldown: 60, type: 'projectile', color: '#bef264', icon: '🧴', description: 'Global regen (Concept).' },
  'HARUKA': { name: 'Haruka', cost: 220, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#a5f3fc', icon: '🌊', description: 'Support arts.' },
  'KICHISEI': { name: 'Kichisei', cost: 480, damage: 60, range: 2.5, cooldown: 80, type: 'spread', color: '#fdba74', icon: '🐕', description: 'Scattergun blasts.' },
  'MATSUKIRI': { name: 'Matsukiri', cost: 350, damage: 45, range: 1.5, cooldown: 50, type: 'projectile', color: '#94a3b8', icon: '🐺', description: 'Tactical strikes.' },
  'RAIDIAN': { name: 'Raidian', cost: 300, damage: 35, range: 3, cooldown: 55, type: 'summon', color: '#e2e8f0', icon: '🤖', description: 'Summons drones.' },
  'LEIZI': { name: 'Leizi', cost: 580, damage: 70, range: 3.5, cooldown: 65, type: 'projectile', color: '#fcd34d', icon: '⚡', description: 'Chain lightning.' },
  'RECORD_KEEPER': { name: 'Recorder', cost: 200, damage: 15, range: 3, cooldown: 70, type: 'projectile', color: '#fff', icon: '📝', description: 'Medic support.' },
  'TIPPI': { name: 'Tippi', cost: 360, damage: 50, range: 3, cooldown: 50, type: 'projectile', color: '#86efac', icon: '🐦', description: 'Aerial scout.' },
  'MISS_CHRISTINE': { name: 'Christine', cost: 280, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#f472b6', icon: '🐈', description: 'Elegant arts.' },
  'SANKTA': { name: 'Sankta Mixer', cost: 600, damage: 80, range: 1.5, cooldown: 50, type: 'projectile', color: '#fca5a5', icon: '🥛', description: 'Heavy defender.' },
  'GRACEBEARER': { name: 'Gracebearer', cost: 550, damage: 90, range: 1.5, cooldown: 60, type: 'projectile', color: '#fbbf24', icon: '⚔️', description: 'Standard bearer.' },
  'CONFESS_47': { name: 'Confess-47', cost: 100, damage: 20, range: 1.5, cooldown: 30, type: 'projectile', color: '#94a3b8', icon: '🤖', description: 'Robot assist.' },
  'MON3TR': { name: 'Mon3tr', cost: 400, damage: 200, range: 2, cooldown: 60, type: 'projectile', color: '#10b981', icon: '👾', description: 'Kal\'tsit\'s summon.' },
  'ALANNA': { name: 'Alanna', cost: 350, damage: 50, range: 1.5, cooldown: 55, type: 'projectile', color: '#d6d3d1', icon: '🛠️', description: 'Craftsman.' },
  'WINDSCOOT': { name: 'Windscoot', cost: 400, damage: 80, range: 1.5, cooldown: 40, type: 'projectile', color: '#bae6fd', icon: '🌬️', description: 'Wind slash.' },
  'WULFENITE': { name: 'Wulfenite', cost: 320, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#fde047', icon: '🪤', description: 'Trap master.' },
  'ENTELECHIA': { name: 'Entelechia', cost: 600, damage: 100, range: 1.5, cooldown: 60, type: 'area', color: '#1e293b', icon: '🌾', description: 'Reaper guard.' },
  'NOWELL': { name: 'Nowell', cost: 250, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#bfdbfe', icon: '⚕️', description: 'Medic.' },
  'XINGZHU': { name: 'Xingzhu', cost: 300, damage: 30, range: 3, cooldown: 55, type: 'projectile', color: '#fca5a5', icon: '🥢', description: 'Supporter.' },
  'TECNO': { name: 'Tecno', cost: 350, damage: 40, range: 3, cooldown: 50, type: 'summon', color: '#a5f3fc', icon: '💻', description: 'Techno summoner.' },
  'ROSE_SALT': { name: 'Rose Salt', cost: 280, damage: 15, range: 3, cooldown: 60, type: 'projectile', color: '#fbcfe8', icon: '🧂', description: 'Multi-healer.' },
};
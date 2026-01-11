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

export const TOWERS: Record<string, TowerStats> = {
  // ==========================================
  // BASIC INFANTRY & LIGHT WEAPONS
  // ==========================================
  'ARCHER': {
    name: 'Auto-Rifle Turret', cost: 50, damage: 12, range: 3.5, cooldown: 50,
    type: 'projectile', color: '#fbbf24', icon: '🔫',
    description: 'Rapid-fire bullets. Fast and reliable for basic defense.',
    projectileStyle: 'dot'
  },
  'CANNON': {
    name: 'Mortar Cannon', cost: 120, damage: 45, range: 4, cooldown: 100,
    type: 'area', color: '#1e293b', icon: '💣',
    description: 'Explosive shells deal area damage to groups of enemies.',
    areaRadius: 1.5,
    projectileStyle: 'arc'
  },
  'WIZARD': {
    name: 'EMP Blaster', cost: 200, damage: 30, range: 3, cooldown: 60,
    type: 'area', color: '#8b5cf6', icon: '⚡',
    description: 'Electromagnetic pulse disables multiple targets at once.',
    areaRadius: 2.0,
    projectileStyle: 'fire'
  },
  'MORTAR': {
    name: 'Artillery Battery', cost: 350, damage: 120, range: 6, cooldown: 200,
    type: 'area', color: '#475569', icon: '🎯',
    description: 'Long-range heavy shells. Massive damage but slow reload.',
    areaRadius: 2.5,
    projectileStyle: 'arc'
  },
  'AIR_DEFENSE': {
    name: 'SAM Launcher', cost: 180, damage: 80, range: 5, cooldown: 40,
    type: 'projectile', color: '#ef4444', icon: '🚀',
    description: 'Surface-to-air missiles with high single-target damage.',
    projectileStyle: 'missile'
  },
  'TESLA': {
    name: 'Shock Generator', cost: 250, damage: 90, range: 2.5, cooldown: 55,
    type: 'projectile', color: '#facc15', icon: '⚡',
    description: 'Hidden until enemies approach. Instant electric discharge.',
    projectileStyle: 'lightning'
  },
  'X_BOW': {
    name: 'Gatling Gun', cost: 500, damage: 8, range: 7, cooldown: 6,
    type: 'projectile', color: '#ec4899', icon: '⚔️',
    description: 'Extremely high rate of fire. Tears through enemies with a hail of bullets.',
    projectileSpeed: 0.25,
    projectileStyle: 'arrow_classic'
  },
  'INFERNO': {
    name: 'Flamethrower', cost: 600, damage: 5, range: 4.5, cooldown: 5,
    type: 'beam', color: '#ef4444', icon: '🔥',
    description: 'Continuous flame beam. Damage increases the longer it burns.',
    beamRamp: 0.8
  },
  'EAGLE': {
    name: 'Orbital Strike', cost: 1000, damage: 300, range: 99, cooldown: 350,
    type: 'area', color: '#fff', icon: '🛰️',
    description: 'Satellite-guided missile strikes anywhere on the battlefield.',
    areaRadius: 3,
    projectileStyle: 'arc',
    specialAbility: 'aoe',
    maxHp: 250
  },
  'SCATTERSHOT': {
    name: 'Shotgun Turret', cost: 550, damage: 40, range: 3, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '🔫',
    description: 'Fires multiple pellets in a spread pattern. Hits multiple targets.',
    multiTarget: 3,
    projectileStyle: 'shotgun'
  },
  'MONOLITH': {
    name: 'Railgun', cost: 1500, damage: 500, range: 5, cooldown: 150,
    type: 'projectile', color: '#020617', icon: '⚫',
    description: 'Electromagnetic projectile pierces through enemies with burn effect.',
    burnDamage: 20,
    projectileStyle: 'fire',
    specialAbility: 'aoe',
    areaRadius: 1.0,
    maxHp: 300
  },
  'SPELL_TOWER': {
    name: 'Command Center', cost: 300, damage: 0, range: 3, cooldown: 1000,
    type: 'aura', color: '#db2777', icon: '📡',
    description: 'Provides tactical support and coordination (Coming Soon).',
    projectileStyle: 'magic'
  },
  'BUILDER': {
    name: 'Repair Station', cost: 2000, damage: 20, range: 2, cooldown: 30,
    type: 'projectile', color: '#a3e635', icon: '🔧',
    description: 'Maintains and repairs nearby structures. Can defend itself.',
    projectileStyle: 'bullet'
  },

  // ==========================================
  // MISSILE SYSTEMS & GUIDED WEAPONS
  // ==========================================
  'EXUSIAI': {
    name: 'Multi-Missile System', cost: 550, damage: 15, range: 4, cooldown: 8,
    type: 'projectile', color: '#ef4444', icon: '🚀',
    description: 'Rapid-fire missile barrage. Overwhelms enemies with volume.',
    projectileSpeed: 0.9,
    projectileStyle: 'dot'
  },
  'SCHWARZ': {
    name: 'Anti-Tank Rifle', cost: 650, damage: 400, range: 3, cooldown: 150,
    type: 'projectile', color: '#1e1e1e', icon: '🎯',
    description: 'High-penetration sniper round. Devastating single-shot damage.',
    projectileStyle: 'sniper'
  },
  'LEMUEN': {
    name: 'Precision Strike', cost: 600, damage: 180, range: 6, cooldown: 140,
    type: 'projectile', color: '#fcd34d', icon: '🎯',
    description: 'Long-range guided missile. Targets weakest armor points.',
    projectileStyle: 'sniper'
  },
  'SNOW_HUNTER': {
    name: 'Cryo Cannon', cost: 320, damage: 90, range: 4, cooldown: 100,
    type: 'projectile', color: '#cbd5e1', icon: '❄️',
    description: 'Freezing projectiles slow enemy movement speed.',
    slowFactor: 0.5,
    projectileStyle: 'ice',
    specialAbility: 'slow',
    maxHp: 120
  },
  'SKYBOX': {
    name: 'Anti-Air Platform', cost: 450, damage: 65, range: 5, cooldown: 55,
    type: 'area', color: '#0ea5e9', icon: '✈️',
    description: 'Mobile air defense unit. Explosive rockets for aerial threats.',
    projectileStyle: 'rocket'
  },
  'BRIGID': {
    name: 'Boomerang Launcher', cost: 380, damage: 55, range: 3.5, cooldown: 45,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Projectiles return after hitting targets. Double damage potential.',
    projectileStyle: 'boomerang'
  },
  'ROSA': {
    name: 'Anchoring Trap', cost: 580, damage: 110, range: 5, cooldown: 160,
    type: 'pull', color: '#fff', icon: '⚓',
    description: 'Launches anchors that immobilize heavy enemies in place.',
    stunDuration: 30,
    specialAbility: 'stun',
    maxHp: 150
  },
  'W': {
    name: 'Timed Explosive', cost: 600, damage: 200, range: 4, cooldown: 120,
    type: 'area', color: '#dc2626', icon: '💥',
    description: 'Delayed detonation grenades. Massive area damage on explosion.',
    areaRadius: 2.0,
    projectileStyle: 'grenade',
    specialAbility: 'aoe',
    maxHp: 180
  },

  // ==========================================
  // ENERGY WEAPONS & BEAMS
  // ==========================================
  'TITI': {
    name: 'Needle Launcher', cost: 300, damage: 45, range: 3.5, cooldown: 60,
    type: 'projectile', color: '#8b5cf6', icon: '💉',
    description: 'Precise needle darts. Pierces armor with high accuracy.',
    projectileStyle: 'needle'
  },
  'AKKORD': {
    name: 'Artillery Command', cost: 700, damage: 95, range: 8, cooldown: 180,
    type: 'area', color: '#f472b6', icon: '🎼',
    description: 'Calls in long-range bombardment strikes from off-map.',
    projectileStyle: 'arc'
  },
  'IFRIT': {
    name: 'Laser Cannon', cost: 750, damage: 120, range: 5, cooldown: 50,
    type: 'line', color: '#ff5722', icon: '🔥',
    description: 'Continuous laser beam burns enemies in a straight line.',
    burnDamage: 10
  },
  'MANTRA': {
    name: 'Poison Launcher', cost: 350, damage: 35, range: 4, cooldown: 50,
    type: 'projectile', color: '#14b8a6', icon: '🐍',
    description: 'Toxic projectiles deal damage over time to enemies.',
    projectileStyle: 'poison'
  },
  'CEOBE': {
    name: 'Axe Launcher', cost: 400, damage: 50, range: 3.5, cooldown: 35,
    type: 'projectile', color: '#fb923c', icon: '🪓',
    description: 'Rapidly hurls spinning blades at enemies.',
    projectileStyle: 'blade'
  },
  'GOLDENGOLOW': {
    name: 'Drone Swarm', cost: 450, damage: 20, range: 99, cooldown: 20,
    type: 'projectile', color: '#f9a8d4', icon: '⚡',
    description: 'Autonomous drones hunt targets across the entire battlefield.',
    projectileStyle: 'lightning'
  },
  'NECRASS': {
    name: 'Spawner Array', cost: 520, damage: 70, range: 3, cooldown: 80,
    type: 'summon', color: '#4c1d95', icon: '👻',
    description: 'Deploys combat drones from defeated enemy wreckage.',
  },
  'TRAGODIA': {
    name: 'Shadow Cannon', cost: 310, damage: 40, range: 3, cooldown: 55,
    type: 'projectile', color: '#7e22ce', icon: '🎭',
    description: 'Dark energy projectiles corrupt enemy systems.',
    projectileStyle: 'shadow'
  },

  // ==========================================
  // HEAVY DEFENSE & FORTIFICATIONS
  // ==========================================
  'HOSHIGUMA': {
    name: 'Rotary Blades', cost: 550, damage: 60, range: 1.5, cooldown: 30,
    type: 'aura', color: '#22c55e', icon: '🟢',
    description: 'Spinning sawblades shred all enemies in close proximity.',
    projectileStyle: 'saw'
  },
  'MUDROCK': {
    name: 'Sledgehammer Turret', cost: 900, damage: 350, range: 1.5, cooldown: 180,
    type: 'area', color: '#57534e', icon: '🔨',
    description: 'Massive area-of-effect spin attack. Crushes multiple enemies.',
    areaRadius: 2.0,
    projectileStyle: 'cannonball'
  },
  'NIAN': {
    name: 'Heat Emitter', cost: 600, damage: 80, range: 1.5, cooldown: 60,
    type: 'aura', color: '#ef4444', icon: '🏮',
    description: 'Radiant heat aura continuously damages nearby enemies.',
    burnDamage: 15,
    projectileStyle: 'fire'
  },
  'PENANCE': {
    name: 'Reflector Shield', cost: 620, damage: 140, range: 1.5, cooldown: 90,
    type: 'projectile', color: '#9f1239', icon: '⚖️',
    description: 'Deflects incoming attacks back at enemies.',
    projectileStyle: 'orb'
  },
  'YU': {
    name: 'Dragon Cannon', cost: 700, damage: 100, range: 1.5, cooldown: 70,
    type: 'aura', color: '#b91c1c', icon: '🐉',
    description: 'Mythical energy aura provides impenetrable defense.',
    projectileStyle: 'fire'
  },
  'CAIRN': {
    name: 'Shield Generator', cost: 480, damage: 50, range: 1.5, cooldown: 50,
    type: 'projectile', color: '#64748b', icon: '🛡️',
    description: 'Projects defensive barrier while launching disc projectiles.',
    projectileStyle: 'disc'
  },
  'VETOCHKI': {
    name: 'Spike Barrage', cost: 510, damage: 65, range: 1.5, cooldown: 60,
    type: 'projectile', color: '#334155', icon: '🪵',
    description: 'Fires unstoppable armor-piercing spikes.',
    projectileStyle: 'spike'
  },

  // ==========================================
  // SPECIALIZED COMBAT SYSTEMS
  // ==========================================
  'SILVERASH': {
    name: 'Sword Slash', cost: 1000, damage: 220, range: 3.5, cooldown: 70,
    type: 'area', color: '#cbd5e1', icon: '🗡️',
    description: 'Wide-area blade attack cuts through multiple enemies.',
    projectileStyle: 'blade'
  },
  'SURTR': {
    name: 'Beam Overload', cost: 900, damage: 400, range: 2.5, cooldown: 40,
    type: 'beam', color: '#f59e0b', icon: '👿',
    description: 'Massive energy beam. Damage exponentially increases over time.',
    beamRamp: 2.0
  },
  'THORNS': {
    name: 'Toxin Sprayer', cost: 550, damage: 70, range: 3, cooldown: 45,
    type: 'projectile', color: '#d97706', icon: '🌵',
    description: 'Poisonous projectiles deal continuous damage over time.',
    burnDamage: 10,
    projectileStyle: 'poison'
  },
  'BLAZE': {
    name: 'Chain Saw', cost: 600, damage: 110, range: 2, cooldown: 20,
    type: 'aura', color: '#ea580c', icon: '🔥',
    description: 'Continuous area damage. Constantly shreds enemies nearby.',
    projectileStyle: 'fire'
  },
  'VARKARIS': {
    name: 'Multi-Target System', cost: 450, damage: 90, range: 1.5, cooldown: 50,
    type: 'area', color: '#94a3b8', icon: '🐮',
    description: 'Fires simultaneously at multiple enemies in range.',
    projectileStyle: 'bullet'
  },
  'NASTI': {
    name: 'Drill Cannon', cost: 400, damage: 60, range: 1.5, cooldown: 55,
    type: 'projectile', color: '#475569', icon: '🔧',
    description: 'Rotating drill projectiles pierce through armor.',
    projectileStyle: 'needle'
  },
  'HADIYA': {
    name: 'Arrow Volley', cost: 380, damage: 55, range: 1.5, cooldown: 45,
    type: 'projectile', color: '#a8a29e', icon: '⚔️',
    description: 'Rapid arrow fire strikes enemies with precision.',
    projectileStyle: 'arrow'
  },

  // ==========================================
  // SUPPORT & CONTROL SYSTEMS
  // ==========================================
  'ANGELINA': {
    name: 'Gravity Field', cost: 400, damage: 25, range: 4, cooldown: 20,
    type: 'projectile', color: '#818cf8', icon: '💫',
    description: 'Projectiles create gravity wells that slow enemy movement.',
    slowFactor: 0.7,
    projectileStyle: 'vortex'
  },
  'GLADIITR': {
    name: 'Vortex Launcher', cost: 500, damage: 80, range: 3.5, cooldown: 90,
    type: 'pull', color: '#1e3a8a', icon: '⚓',
    description: 'Pulls distant enemies closer into combat range.',
    pullStrength: 1.5,
    projectileStyle: 'vortex',
    specialAbility: 'pull',
    maxHp: 140
  },
  'WEEDY': {
    name: 'Ice Cannon', cost: 450, damage: 60, range: 3, cooldown: 100,
    type: 'pull', color: '#2dd4bf', icon: '🌊',
    description: 'Freezing blasts push enemies backward while slowing them.',
    pullStrength: -2.0,
    projectileStyle: 'ice'
  },
  'PHANTOM': {
    name: 'Kunai Thrower', cost: 300, damage: 80, range: 2, cooldown: 40,
    type: 'projectile', color: '#111827', icon: '🐱',
    description: 'Fast-reloading stealth weapons for quick strikes.',
    projectileStyle: 'kunai'
  },
  'SURFER': {
    name: 'Water Strike', cost: 250, damage: 45, range: 1.5, cooldown: 30,
    type: 'projectile', color: '#0ea5e9', icon: '🏄‍♀️',
    description: 'Rapid water projectiles with freezing effects.',
    projectileStyle: 'ice'
  },
  'PRAMANIX': {
    name: 'Weakening Field', cost: 350, damage: 30, range: 3.5, cooldown: 60,
    type: 'aura', color: '#fff', icon: '🔔',
    description: 'Aura reduces enemy defensive capabilities.',
    projectileStyle: 'holy'
  },
  'ASTGENNE': {
    name: 'Star Shooter', cost: 380, damage: 40, range: 3, cooldown: 50,
    type: 'projectile', color: '#facc15', icon: '🌟',
    description: 'Starlight projectiles track and strike enemies.',
    projectileStyle: 'star'
  },
  'SUZURAN': {
    name: 'Slow Field', cost: 500, damage: 10, range: 4, cooldown: 10,
    type: 'aura', color: '#fef08a', icon: '🦊',
    description: 'Massive area slow effect. Significantly reduces enemy speed.',
    slowFactor: 0.4,
    projectileStyle: 'fire',
    specialAbility: 'slow',
    maxHp: 130
  },

  // ==========================================
  // ADVANCED WEAPON SYSTEMS
  // ==========================================
  'TOGAWA': {
    name: 'Neural Beam', cost: 420, damage: 95, range: 3, cooldown: 60,
    type: 'beam', color: '#4c1d95', icon: '🎹',
    description: 'Psionic energy beam drains enemy health over time.',
    beamRamp: 0.6
  },
  'UMIRI': {
    name: 'Sonic Blast', cost: 380, damage: 110, range: 1.5, cooldown: 45,
    type: 'aura', color: '#be185d', icon: '🎸',
    description: 'Continuous sonic shockwaves damage nearby enemies.',
  },
  'MISUMI': {
    name: 'Support Drone', cost: 300, damage: 0, range: 3, cooldown: 60,
    type: 'aura', color: '#fcd34d', icon: '🎤',
    description: 'Heals and buffs nearby defenses (Concept).',
  },
  'WAKABA': {
    name: 'Puppet Striker', cost: 400, damage: 85, range: 1.5, cooldown: 40,
    type: 'projectile', color: '#10b981', icon: '🥒',
    description: 'Remote-controlled projectiles strike with precision.',
  },
  'YUTENJI': {
    name: 'Shockwave Drums', cost: 450, damage: 130, range: 1.5, cooldown: 80,
    type: 'area', color: '#fca5a5', icon: '🥁',
    description: 'Ground-pounding area attacks shake multiple enemies.',
  },

  // ==========================================
  // SPECIALIZED DEFENSE TOOLS
  // ==========================================
  'PERFUMER': { name: 'Medic Station', cost: 200, damage: 10, range: 3, cooldown: 60, type: 'projectile', color: '#bef264', icon: '💚', description: 'Heals nearby structures (Concept).' },
  'HARUKA': { name: 'Command Relay', cost: 220, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#a5f3fc', icon: '🌊', description: 'Routes commands to other defense systems.' },
  'KICHISEI': { name: 'Scatter Gun', cost: 480, damage: 60, range: 2.5, cooldown: 80, type: 'spread', color: '#fdba74', icon: '🐕', description: 'Fires wide spread of projectiles at multiple angles.' },
  'MATSUKIRI': { name: 'Tactical Rifle', cost: 350, damage: 45, range: 1.5, cooldown: 50, type: 'projectile', color: '#94a3b8', icon: '🐺', description: 'Precision strikes with tactical targeting.' },
  'RAIDIAN': { name: 'Drone Controller', cost: 300, damage: 35, range: 3, cooldown: 55, type: 'summon', color: '#e2e8f0', icon: '🤖', description: 'Deploys combat drones to engage enemies.' },
  'LEIZI': { name: 'Chain Lightning', cost: 580, damage: 70, range: 3.5, cooldown: 65, type: 'projectile', color: '#fcd34d', icon: '⚡', description: 'Electricity chains between multiple enemies.' },
  'RECORD_KEEPER': { name: 'Log System', cost: 200, damage: 15, range: 3, cooldown: 70, type: 'projectile', color: '#fff', icon: '📝', description: 'Records and tracks enemy movements.' },
  'TIPPI': { name: 'Scout Drone', cost: 360, damage: 50, range: 3, cooldown: 50, type: 'projectile', color: '#86efac', icon: '🐦', description: 'Aerial reconnaissance unit with combat capability.' },
  'MISS_CHRISTINE': { name: 'Elegant Cannon', cost: 280, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#f472b6', icon: '🐈', description: 'Graceful but deadly precision shots.' },
  'SANKTA': { name: 'Heavy Defender', cost: 600, damage: 80, range: 1.5, cooldown: 50, type: 'projectile', color: '#fca5a5', icon: '🥛', description: 'Heavy-caliber rounds for close-range defense.' },
  'GRACEBEARER': { name: 'Standard Gun', cost: 550, damage: 90, range: 1.5, cooldown: 60, type: 'projectile', color: '#fbbf24', icon: '⚔️', description: 'Reliable standard-issue weapon system.' },
  'CONFESS_47': { name: 'Robot Sentry', cost: 100, damage: 20, range: 1.5, cooldown: 30, type: 'projectile', color: '#94a3b8', icon: '🤖', description: 'Automated sentry turret with basic targeting.' },
  'MON3TR': { name: 'Combat Mech', cost: 400, damage: 200, range: 2, cooldown: 60, type: 'projectile', color: '#10b981', icon: '👾', description: 'Deployable mech unit with high damage output.' },
  'ALANNA': { name: 'Weapon Forge', cost: 350, damage: 50, range: 1.5, cooldown: 55, type: 'projectile', color: '#d6d3d1', icon: '🛠️', description: 'Manufactures and launches custom projectiles.' },
  'WINDSCOOT': { name: 'Wind Cutter', cost: 400, damage: 80, range: 1.5, cooldown: 40, type: 'projectile', color: '#bae6fd', icon: '🌬️', description: 'Air pressure projectiles slice through enemies.' },
  'WULFENITE': { name: 'Trap System', cost: 320, damage: 40, range: 3, cooldown: 45, type: 'projectile', color: '#fde047', icon: '🪤', description: 'Deploys hidden traps that trigger on enemy contact.' },
  'ENTELECHIA': { name: 'Reaper Cannon', cost: 600, damage: 100, range: 1.5, cooldown: 60, type: 'area', color: '#1e293b', icon: '🌾', description: 'Area damage cannon that harvests enemy health.' },
  'NOWELL': { name: 'Medic Unit', cost: 250, damage: 20, range: 3, cooldown: 60, type: 'projectile', color: '#bfdbfe', icon: '⚕️', description: 'Medical support unit with defensive capabilities.' },
  'XINGZHU': { name: 'Support Tower', cost: 300, damage: 30, range: 3, cooldown: 55, type: 'projectile', color: '#fca5a5', icon: '🥢', description: 'Provides support fire for nearby defenses.' },
  'TECNO': { name: 'Tech Summoner', cost: 350, damage: 40, range: 3, cooldown: 50, type: 'summon', color: '#a5f3fc', icon: '💻', description: 'Summons technological constructs to fight.' },
  'ROSE_SALT': { name: 'Multi-Healer', cost: 280, damage: 15, range: 3, cooldown: 60, type: 'projectile', color: '#fbcfe8', icon: '🧂', description: 'Heals multiple structures simultaneously.' },
};

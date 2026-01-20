// src/engine/data.ts
import type { TowerStats } from './types';

export interface EnemyType {
    name: string;
    hp: number;
    speed: number;
    reward: number;
    color: string;
    icon: string;
    abilities?: string[]; // Special abilities
    abilityCooldown?: number; // Cooldown in ticks
    isBoss?: boolean; // Mark as boss type
    description?: string; // Clash Royale-style description
    minWave?: number; // Minimum wave to spawn (for difficulty scaling)
    moneyBonus?: number; // Extra money bonus multiplier for bosses
}

export const ENEMY_TYPES: EnemyType[] = [
    // Basic Enemies (Fast & Weak)
    { name: "Bug", hp: 30, speed: 1.0, reward: 15, color: "#f87171", icon: "🐛" },
    { name: "Spider", hp: 25, speed: 1.3, reward: 12, color: "#dc2626", icon: "🕷️", abilities: ['camouflage'] },
    { name: "Mite", hp: 20, speed: 1.5, reward: 10, color: "#ef4444", icon: "🪲" },
    { name: "Fly", hp: 15, speed: 1.8, reward: 8, color: "#f97316", icon: "🪰", abilities: ['fly'] },
    
    // Balanced Enemies
    { name: "Glitch", hp: 80, speed: 0.7, reward: 25, color: "#c084fc", icon: "👾" },
    { name: "Drone", hp: 75, speed: 0.8, reward: 22, color: "#a855f7", icon: "🤖", abilities: ['fly'] },
    { name: "Hacker", hp: 85, speed: 0.65, reward: 28, color: "#9333ea", icon: "👤", abilities: ['deactivate_towers'], abilityCooldown: 300 },
    { name: "Crawler", hp: 70, speed: 0.75, reward: 20, color: "#7c3aed", icon: "🕸️" },
    
    // Tank Enemies
    { name: "Virus", hp: 200, speed: 0.4, reward: 50, color: "#4ade80", icon: "🦠" },
    { name: "Malware", hp: 220, speed: 0.35, reward: 55, color: "#22c55e", icon: "🪳", abilities: ['shield'] },
    { name: "Tank", hp: 250, speed: 0.3, reward: 60, color: "#16a34a", icon: "🛡️", abilities: ['damage_reflect'] },
    { name: "Brute", hp: 300, speed: 0.25, reward: 70, color: "#15803d", icon: "💪", abilities: ['regenerate'] },
    { name: "Guardian", hp: 350, speed: 0.2, reward: 80, color: "#166534", icon: "🛡️", abilities: ['shield', 'heal_allies'], abilityCooldown: 200 },
    
    // Fast Enemies
    { name: "Worm", hp: 60, speed: 1.2, reward: 20, color: "#f472b6", icon: "🪱" },
    { name: "Snake", hp: 55, speed: 1.4, reward: 18, color: "#ec4899", icon: "🐍", abilities: ['poison_aura'] },
    { name: "Swift", hp: 50, speed: 1.6, reward: 16, color: "#db2777", icon: "⚡", abilities: ['charge'] },
    { name: "Ghost", hp: 45, speed: 1.5, reward: 14, color: "#be185d", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 400 },
    
    // Special Ability Enemies
    { name: "Teleporter", hp: 100, speed: 0.6, reward: 30, color: "#6366f1", icon: "🌀", abilities: ['teleport'], abilityCooldown: 250 },
    { name: "Healer", hp: 90, speed: 0.65, reward: 28, color: "#8b5cf6", icon: "💚", abilities: ['heal_allies'], abilityCooldown: 150 },
    { name: "Saboteur", hp: 120, speed: 0.5, reward: 35, color: "#ef4444", icon: "🔧", abilities: ['deactivate_towers'], abilityCooldown: 300 },
    { name: "Summoner", hp: 150, speed: 0.45, reward: 40, color: "#a855f7", icon: "🔮", abilities: ['spawn_minions'], abilityCooldown: 500 },
    { name: "Berserker", hp: 180, speed: 0.8, reward: 45, color: "#dc2626", icon: "😡", abilities: ['berserk'] },
    { name: "Freezer", hp: 110, speed: 0.55, reward: 32, color: "#06b6d4", icon: "❄️", abilities: ['freeze_aura'] },
    { name: "Bomber", hp: 70, speed: 0.7, reward: 25, color: "#f59e0b", icon: "💣", abilities: ['explode'] },
    { name: "Splitter", hp: 130, speed: 0.5, reward: 38, color: "#10b981", icon: "🔀", abilities: ['split'] },
    { name: "Burrower", hp: 95, speed: 0.6, reward: 27, color: "#78716c", icon: "🕳️", abilities: ['burrow'] },
    { name: "Retreater", hp: 85, speed: 1.0, reward: 23, color: "#64748b", icon: "🏃", abilities: ['retreat'] },
    { name: "Stunner", hp: 105, speed: 0.58, reward: 30, color: "#facc15", icon: "⚡", abilities: ['stun_attack'], abilityCooldown: 350 },
    
    // Boss-like Enemies (Higher HP)
    { name: "Trojan", hp: 400, speed: 0.3, reward: 100, color: "#fbbf24", icon: "🐴" },
    { name: "Titan", hp: 500, speed: 0.25, reward: 120, color: "#f59e0b", icon: "👹", isBoss: true, abilities: ['shield', 'charge'] },
    { name: "Behemoth", hp: 600, speed: 0.2, reward: 140, color: "#dc2626", icon: "👺", isBoss: true, abilities: ['regenerate', 'berserk'] },
    { name: "Warlord", hp: 450, speed: 0.28, reward: 110, color: "#7c2d12", icon: "⚔️", isBoss: true, abilities: ['damage_reflect', 'heal_allies'], abilityCooldown: 200 },
    
    // Advanced Enemies
    { name: "Necromancer", hp: 320, speed: 0.35, reward: 85, color: "#581c87", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 400 },
    { name: "Phantom", hp: 140, speed: 0.9, reward: 42, color: "#1e293b", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 300 },
    { name: "Archmage", hp: 280, speed: 0.4, reward: 75, color: "#3b82f6", icon: "🧙", abilities: ['deactivate_towers', 'poison_aura'], abilityCooldown: 350 },
    { name: "Golem", hp: 550, speed: 0.15, reward: 130, color: "#78716c", icon: "🗿", isBoss: true, abilities: ['shield', 'damage_reflect'], moneyBonus: 3.0 },
    { name: "Dragon", hp: 700, speed: 0.18, reward: 160, color: "#dc2626", icon: "🐉", isBoss: true, abilities: ['fly', 'poison_aura', 'charge'], moneyBonus: 3.0 },
    { name: "Kraken", hp: 650, speed: 0.22, reward: 150, color: "#0ea5e9", icon: "🐙", isBoss: true, abilities: ['split', 'freeze_aura'], moneyBonus: 3.0 },
    { name: "Hydra", hp: 580, speed: 0.26, reward: 135, color: "#10b981", icon: "🐲", isBoss: true, abilities: ['split', 'regenerate'], moneyBonus: 3.0 },
    { name: "Colossus", hp: 800, speed: 0.12, reward: 180, color: "#475569", icon: "🗽", isBoss: true, abilities: ['shield', 'stun_attack', 'heal_allies'], abilityCooldown: 250, moneyBonus: 3.5 },
    { name: "Tyrant", hp: 750, speed: 0.16, reward: 170, color: "#991b1b", icon: "👑", isBoss: true, abilities: ['berserk', 'damage_reflect', 'charge'], moneyBonus: 3.5 },
    { name: "Demon", hp: 680, speed: 0.2, reward: 155, color: "#7c2d12", icon: "😈", isBoss: true, abilities: ['teleport', 'poison_aura', 'explode'], moneyBonus: 3.0 },
    
    // Elite Enemies
    { name: "Assassin", hp: 160, speed: 1.1, reward: 48, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 400 },
    { name: "Paladin", hp: 420, speed: 0.32, reward: 105, color: "#fbbf24", icon: "⚔️", abilities: ['shield', 'heal_allies'], abilityCooldown: 180 },
    { name: "Vampire", hp: 380, speed: 0.38, reward: 95, color: "#be123c", icon: "🧛", abilities: ['regenerate', 'teleport'], abilityCooldown: 320 },
    { name: "Shaman", hp: 260, speed: 0.42, reward: 70, color: "#9333ea", icon: "🔮", abilities: ['spawn_minions', 'freeze_aura', 'poison_aura'], abilityCooldown: 450 },
    { name: "Wraith", hp: 200, speed: 0.85, reward: 52, color: "#6366f1", icon: "👤", abilities: ['invisible', 'fly', 'teleport'], abilityCooldown: 350 },
    { name: "Revenant", hp: 440, speed: 0.3, reward: 108, color: "#4338ca", icon: "💀", isBoss: true, abilities: ['spawn_minions', 'regenerate', 'damage_reflect'], moneyBonus: 3.5 },
    { name: "Leviathan", hp: 720, speed: 0.14, reward: 165, color: "#0c4a6e", icon: "🌊", isBoss: true, abilities: ['split', 'freeze_aura', 'charge'], moneyBonus: 4.0 },
    { name: "Phoenix", hp: 600, speed: 0.5, reward: 145, color: "#ea580c", icon: "🔥", isBoss: true, abilities: ['fly', 'regenerate', 'explode'], moneyBonus: 3.5 },
    { name: "Cerberus", hp: 620, speed: 0.24, reward: 148, color: "#1f2937", icon: "🐕", isBoss: true, abilities: ['split', 'charge', 'stun_attack'], moneyBonus: 3.5 },
    { name: "Manticore", hp: 640, speed: 0.21, reward: 152, color: "#78350f", icon: "🦂", isBoss: true, abilities: ['fly', 'poison_aura', 'teleport'], abilityCooldown: 400, moneyBonus: 3.5 },
    
    // Special Bosses
    { name: "Overlord", hp: 900, speed: 0.1, reward: 200, color: "#1e1e1e", icon: "👑", isBoss: true, abilities: ['deactivate_towers', 'spawn_minions', 'shield', 'heal_allies'], abilityCooldown: 180, moneyBonus: 5.0 },
    { name: "Cthulhu", hp: 850, speed: 0.13, reward: 190, color: "#0f172a", icon: "🐙", isBoss: true, abilities: ['teleport', 'split', 'poison_aura', 'stun_attack'], abilityCooldown: 220, moneyBonus: 5.0 },
    { name: "Archon", hp: 920, speed: 0.11, reward: 205, color: "#581c87", icon: "👤", isBoss: true, abilities: ['invisible', 'teleport', 'damage_reflect', 'heal_allies'], abilityCooldown: 200, moneyBonus: 5.0 },
    { name: "Abomination", hp: 880, speed: 0.14, reward: 195, color: "#7c2d12", icon: "👹", isBoss: true, abilities: ['split', 'regenerate', 'berserk', 'explode'], moneyBonus: 4.5 },
    { name: "World Eater", hp: 1000, speed: 0.08, reward: 220, color: "#000000", icon: "🌑", isBoss: true, abilities: ['fly', 'teleport', 'shield', 'damage_reflect', 'heal_allies'], abilityCooldown: 150, moneyBonus: 6.0 },
    
    // ==========================================
    // NEW ENEMIES (20 new enemies with abilities)
    // ==========================================
    { name: "Sapper", hp: 180, speed: 0.4, reward: 45, color: "#f97316", icon: "🔨", abilities: ['attack_towers'], abilityCooldown: 200, minWave: 3 },
    { name: "Siege Engine", hp: 450, speed: 0.2, reward: 110, color: "#78716c", icon: "⚙️", abilities: ['attack_towers', 'shield'], abilityCooldown: 300, minWave: 8 },
    { name: "Corruptor", hp: 220, speed: 0.5, reward: 55, color: "#7c3aed", icon: "💜", abilities: ['slow_towers', 'poison_aura'], abilityCooldown: 250, minWave: 5 },
    { name: "Frost Wraith", hp: 190, speed: 0.6, reward: 48, color: "#06b6d4", icon: "🧊", abilities: ['freeze_aura', 'invisible'], abilityCooldown: 350, minWave: 6 },
    { name: "Plague Bearer", hp: 160, speed: 0.7, reward: 40, color: "#14b8a6", icon: "🦠", abilities: ['poison_aura', 'spawn_minions'], abilityCooldown: 400, minWave: 4 },
    { name: "Shock Trooper", hp: 140, speed: 0.9, reward: 35, color: "#facc15", icon: "⚡", abilities: ['stun_attack', 'charge'], abilityCooldown: 280, minWave: 3 },
    { name: "Armored Crawler", hp: 380, speed: 0.25, reward: 95, color: "#475569", icon: "🦂", abilities: ['shield', 'damage_reflect'], minWave: 7 },
    { name: "Void Walker", hp: 200, speed: 0.55, reward: 50, color: "#1e293b", icon: "🌌", abilities: ['teleport', 'invisible'], abilityCooldown: 320, minWave: 5 },
    { name: "Crystal Golem", hp: 420, speed: 0.22, reward: 105, color: "#a78bfa", icon: "💎", abilities: ['shield', 'damage_reflect', 'regenerate'], minWave: 9 },
    { name: "Shadow Assassin", hp: 120, speed: 1.0, reward: 30, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 380, minWave: 4 },
    { name: "Molten Core", hp: 500, speed: 0.18, reward: 125, color: "#ea580c", icon: "🌋", abilities: ['explode', 'poison_aura', 'regenerate'], minWave: 10 },
    { name: "Storm Caller", hp: 280, speed: 0.45, reward: 70, color: "#3b82f6", icon: "⛈️", abilities: ['stun_attack', 'deactivate_towers'], abilityCooldown: 300, minWave: 6 },
    { name: "Bone Collector", hp: 320, speed: 0.35, reward: 80, color: "#f3f4f6", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 450, minWave: 7 },
    { name: "Toxic Spitter", hp: 150, speed: 0.8, reward: 38, color: "#10b981", icon: "🐍", abilities: ['poison_aura', 'split'], abilityCooldown: 350, minWave: 4 },
    { name: "Frost Giant", hp: 550, speed: 0.15, reward: 140, color: "#bfdbfe", icon: "🧊", isBoss: true, abilities: ['freeze_aura', 'shield', 'stun_attack'], abilityCooldown: 280, minWave: 12, moneyBonus: 3.0 },
    { name: "Chaos Spawn", hp: 240, speed: 0.5, reward: 60, color: "#dc2626", icon: "🌀", abilities: ['teleport', 'split', 'berserk'], abilityCooldown: 400, minWave: 6 },
    { name: "Iron Maiden", hp: 400, speed: 0.18, reward: 100, color: "#64748b", icon: "⚔️", abilities: ['attack_towers', 'damage_reflect'], abilityCooldown: 250, minWave: 8 }, // Slower
    { name: "Necrotic Plague", hp: 180, speed: 0.65, reward: 45, color: "#7c2d12", icon: "🦠", abilities: ['poison_aura', 'regenerate', 'spawn_minions'], abilityCooldown: 500, minWave: 5 },
    { name: "Void Reaper", hp: 350, speed: 0.3, reward: 88, color: "#000000", icon: "🌑", abilities: ['invisible', 'teleport', 'damage_reflect'], abilityCooldown: 360, minWave: 8 },
    { name: "Titanium Behemoth", hp: 650, speed: 0.08, reward: 165, color: "#94a3b8", icon: "🗿", isBoss: true, abilities: ['attack_towers', 'shield', 'damage_reflect', 'regenerate'], abilityCooldown: 200, minWave: 15, moneyBonus: 4.0 }, // Much slower
];

export interface Theme {
  name: string;
  nameZh?: string; // Traditional Chinese name
  description?: string; // English description of environmental effects
  descriptionZh?: string; // Traditional Chinese description
  bg: string;
  grid: string;
  path: string;
  obstacle: string;
  obstacleColor: string;
  // Environmental Effects
  towerCooldownMultiplier?: number; // 1.0 = normal, >1.0 = slower, <1.0 = faster
  towerRangeMultiplier?: number; // 1.0 = normal
  towerDamageMultiplier?: number; // 1.0 = normal
  enemySpeedMultiplier?: number; // 1.0 = normal, >1.0 = faster, <1.0 = slower
  enemyHpMultiplier?: number; // 1.0 = normal
  moneyBonus?: number; // Additional money per kill (0 = no bonus)
}

// 20+ Themes with Special Environmental Effects
export const THEMES: Theme[] = [
  { 
    name: 'Cyber City', 
    bg: 'bg-slate-900', 
    grid: 'border-cyan-900/30', 
    path: 'bg-cyan-900/20', 
    obstacle: '🧱',
    obstacleColor: '#0891b2',
    // Tech advantage: Faster towers
    towerCooldownMultiplier: 0.9
  },
  { 
    name: 'Frosty Tundra', 
    bg: 'bg-cyan-950', 
    grid: 'border-cyan-800/30', 
    path: 'bg-sky-900/30', 
    obstacle: '❄️',
    obstacleColor: '#0ea5e9',
    // Cold slows towers and enemies
    towerCooldownMultiplier: 1.3,
    enemySpeedMultiplier: 0.7
  },
  { 
    name: 'Forest Ruin', 
    bg: 'bg-emerald-950', 
    grid: 'border-emerald-800/30', 
    path: 'bg-stone-800/40', 
    obstacle: '🌲',
    obstacleColor: '#059669',
    // Nature bonus: More money
    moneyBonus: 2
  },
  { 
    name: 'Desert Storm', 
    bg: 'bg-amber-950', 
    grid: 'border-amber-800/30', 
    path: 'bg-yellow-900/30', 
    obstacle: '🌵',
    obstacleColor: '#d97706',
    // Heat reduces range but increases damage
    towerRangeMultiplier: 0.85,
    towerDamageMultiplier: 1.15,
    enemySpeedMultiplier: 1.2
  },
  { 
    name: 'Mars Base', 
    bg: 'bg-orange-950', 
    grid: 'border-orange-900/30', 
    path: 'bg-red-900/20', 
    obstacle: '🪨',
    obstacleColor: '#7c2d12',
    // Low gravity: Faster projectiles but lower damage
    towerCooldownMultiplier: 0.95,
    towerDamageMultiplier: 0.9
  },
  { 
    name: 'Deep Space', 
    bg: 'bg-indigo-950', 
    grid: 'border-indigo-800/30', 
    path: 'bg-violet-900/20', 
    obstacle: '☄️',
    obstacleColor: '#4c1d95',
    // Zero gravity: Slower everything
    towerCooldownMultiplier: 1.2,
    enemySpeedMultiplier: 0.8
  },
  { 
    name: 'Volcanic Lava', 
    bg: 'bg-red-950', 
    grid: 'border-red-900/30', 
    path: 'bg-orange-900/40', 
    obstacle: '🌋',
    obstacleColor: '#dc2626',
    // Extreme heat: High damage but slow towers
    towerDamageMultiplier: 1.25,
    towerCooldownMultiplier: 1.4,
    enemyHpMultiplier: 0.85
  },
  { 
    name: 'Arctic Wasteland', 
    bg: 'bg-blue-950', 
    grid: 'border-blue-700/30', 
    path: 'bg-cyan-800/30', 
    obstacle: '🧊',
    obstacleColor: '#0284c7',
    // Extreme cold: Very slow towers, slow enemies
    towerCooldownMultiplier: 1.5,
    enemySpeedMultiplier: 0.6,
    towerRangeMultiplier: 0.9
  },
  { 
    name: 'Toxic Swamp', 
    bg: 'bg-green-950', 
    grid: 'border-green-800/30', 
    path: 'bg-lime-900/40', 
    obstacle: '🪷',
    obstacleColor: '#65a30d',
    // Poison: Enemies take extra damage, slower
    enemySpeedMultiplier: 0.8,
    towerDamageMultiplier: 1.1,
    moneyBonus: 1
  },
  { 
    name: 'Crystal Cavern', 
    bg: 'bg-purple-950', 
    grid: 'border-purple-800/30', 
    path: 'bg-violet-800/30', 
    obstacle: '💎',
    obstacleColor: '#7c3aed',
    // Crystals amplify: Better range and damage
    towerRangeMultiplier: 1.15,
    towerDamageMultiplier: 1.1
  },
  { 
    name: 'Stormy Wasteland', 
    bg: 'bg-gray-900', 
    grid: 'border-gray-700/30', 
    path: 'bg-gray-800/40', 
    obstacle: '⚡',
    obstacleColor: '#facc15',
    // Lightning storms: Random effects
    towerCooldownMultiplier: 1.1,
    enemySpeedMultiplier: 1.1,
    moneyBonus: 3
  },
  { 
    name: 'Jungle Temple', 
    bg: 'bg-emerald-900', 
    grid: 'border-green-700/30', 
    path: 'bg-yellow-800/30', 
    obstacle: '🏛️',
    obstacleColor: '#16a34a',
    // Ancient power: Balanced boost
    towerRangeMultiplier: 1.1,
    towerDamageMultiplier: 1.1,
    towerCooldownMultiplier: 0.95
  },
  { 
    name: 'Underwater Depths', 
    bg: 'bg-teal-950', 
    grid: 'border-teal-800/30', 
    path: 'bg-cyan-700/30', 
    obstacle: '🐚',
    obstacleColor: '#14b8a6',
    // Water resistance: Slower everything
    towerCooldownMultiplier: 1.3,
    enemySpeedMultiplier: 0.75,
    towerRangeMultiplier: 0.85
  },
  { 
    name: 'Molten Core', 
    bg: 'bg-rose-950', 
    grid: 'border-rose-900/30', 
    path: 'bg-red-800/40', 
    obstacle: '🔥',
    obstacleColor: '#ef4444',
    // Extreme heat: Damage boost, very slow towers
    towerDamageMultiplier: 1.3,
    towerCooldownMultiplier: 1.6,
    enemyHpMultiplier: 0.8
  },
  { 
    name: 'Cloud City', 
    bg: 'bg-sky-950', 
    grid: 'border-sky-700/30', 
    path: 'bg-blue-600/30', 
    obstacle: '☁️',
    obstacleColor: '#0ea5e9',
    // High altitude: Better range
    towerRangeMultiplier: 1.2,
    towerDamageMultiplier: 0.95
  },
  { 
    name: 'Shadow Realm', 
    bg: 'bg-zinc-950', 
    grid: 'border-zinc-700/30', 
    path: 'bg-gray-700/30', 
    obstacle: '👁️',
    obstacleColor: '#52525b',
    // Darkness: Reduced range, faster towers
    towerRangeMultiplier: 0.8,
    towerCooldownMultiplier: 0.85,
    enemySpeedMultiplier: 1.15
  },
  { 
    name: 'Neon Night', 
    bg: 'bg-indigo-950', 
    grid: 'border-purple-700/30', 
    path: 'bg-pink-700/30', 
    obstacle: '💡',
    obstacleColor: '#a855f7',
    // Neon power: Faster everything
    towerCooldownMultiplier: 0.8,
    enemySpeedMultiplier: 1.2
  },
  { 
    name: 'Aurora Fields', 
    bg: 'bg-violet-950', 
    grid: 'border-violet-700/30', 
    path: 'bg-fuchsia-700/30', 
    obstacle: '🌌',
    obstacleColor: '#9333ea',
    // Aurora magic: Balanced boost
    towerRangeMultiplier: 1.1,
    towerDamageMultiplier: 1.1,
    moneyBonus: 2
  },
  { 
    name: 'Rusty Factory', 
    bg: 'bg-orange-950', 
    grid: 'border-amber-700/30', 
    path: 'bg-yellow-800/30', 
    obstacle: '⚙️',
    obstacleColor: '#f59e0b',
    // Rust slows: Slower towers, weaker enemies
    towerCooldownMultiplier: 1.2,
    enemyHpMultiplier: 0.9,
    enemySpeedMultiplier: 0.9
  },
  { 
    name: 'Mystic Garden', 
    bg: 'bg-green-950', 
    grid: 'border-emerald-700/30', 
    path: 'bg-teal-700/30', 
    obstacle: '🌺',
    obstacleColor: '#10b981',
    // Nature blessing: Healing bonus
    towerRangeMultiplier: 1.05,
    towerDamageMultiplier: 1.05,
    moneyBonus: 1
  },
  { 
    name: 'Quantum Void', 
    bg: 'bg-slate-950', 
    grid: 'border-gray-700/30', 
    path: 'bg-indigo-700/30', 
    obstacle: '🌀',
    obstacleColor: '#6366f1',
    // Quantum effects: Random everything
    towerCooldownMultiplier: 1.1,
    towerRangeMultiplier: 1.1,
    towerDamageMultiplier: 1.1,
    enemySpeedMultiplier: 1.1,
    moneyBonus: 5
  },
  { 
    name: 'Cursed Graveyard', 
    bg: 'bg-zinc-900', 
    grid: 'border-neutral-700/30', 
    path: 'bg-gray-600/30', 
    obstacle: '🪦',
    obstacleColor: '#52525b',
    // Undead curse: Weaker towers, stronger enemies
    towerDamageMultiplier: 0.9,
    enemyHpMultiplier: 1.2,
    moneyBonus: 3
  },
  { 
    name: 'Solar Flare', 
    bg: 'bg-yellow-950', 
    grid: 'border-yellow-700/30', 
    path: 'bg-amber-700/30', 
    obstacle: '☀️',
    obstacleColor: '#facc15',
    // Solar power: Fast towers, fast enemies
    towerCooldownMultiplier: 0.85,
    enemySpeedMultiplier: 1.25,
    towerDamageMultiplier: 1.15
  },
  { 
    name: 'Abandoned Mine', 
    bg: 'bg-stone-950', 
    grid: 'border-stone-700/30', 
    path: 'bg-slate-700/30', 
    obstacle: '⛏️',
    obstacleColor: '#78716c',
    // Mining bonus: More money
    moneyBonus: 4,
    towerRangeMultiplier: 0.95
  },
  { 
    name: 'Heavenly Clouds', 
    bg: 'bg-blue-50', 
    grid: 'border-sky-200/30', 
    path: 'bg-cyan-200/30', 
    obstacle: '✨',
    obstacleColor: '#38bdf8',
    // Heavenly blessing: All bonuses
    towerRangeMultiplier: 1.15,
    towerDamageMultiplier: 1.15,
    towerCooldownMultiplier: 0.9,
    moneyBonus: 3
  }
];

export const TOWERS: Record<string, TowerStats> = {
  // ==========================================
  // BASIC INFANTRY & LIGHT WEAPONS
  // ==========================================
  'ARCHER': {
    name: 'Auto-Rifle Turret', cost: 50, damage: 8, range: 2.6, cooldown: 50,
    type: 'projectile', color: '#fbbf24', icon: '🔫',
    description: 'Rapid-fire bullets. Fast and reliable for basic defense.',
    projectileStyle: 'dot'
  },
  'CANNON': {
    name: 'Mortar Cannon', cost: 120, damage: 29, range: 3.1, cooldown: 100,
    type: 'area', color: '#1e293b', icon: '💣',
    description: 'Explosive shells deal area damage to groups of enemies.',
    areaRadius: 1.5,
    projectileStyle: 'arc'
  },
  'WIZARD': {
    name: 'EMP Blaster', cost: 200, damage: 23, range: 2.4, cooldown: 60,
    type: 'area', color: '#8b5cf6', icon: '🌀',
    description: 'Electromagnetic pulse disables multiple targets at once.',
    areaRadius: 2.0,
    projectileStyle: 'plasma'
  },
  'MORTAR': {
    name: 'Artillery Battery', cost: 350, damage: 81, range: 4.5, cooldown: 200,
    type: 'area', color: '#475569', icon: '🎯',
    description: 'Long-range heavy shells. Massive damage but slow reload.',
    areaRadius: 2.5,
    projectileStyle: 'arc'
  },
  'AIR_DEFENSE': {
    name: 'SAM Launcher', cost: 180, damage: 55, range: 3.6, cooldown: 40,
    type: 'projectile', color: '#ef4444', icon: '🚀',
    description: 'Surface-to-air missiles with high single-target damage.',
    projectileStyle: 'missile'
  },
  'TESLA': {
    name: 'Shock Generator', cost: 250, damage: 62, range: 1.9, cooldown: 55,
    type: 'projectile', color: '#facc15', icon: '⚡',
    description: 'Hidden until enemies approach. Instant electric discharge.',
    projectileStyle: 'lightning'
  },
  'X_BOW': {
    name: 'Gatling Gun', cost: 500, damage: 6, range: 5.7, cooldown: 6,
    type: 'projectile', color: '#ec4899', icon: '⚡',
    description: 'Extremely high rate of fire. Tears through enemies with a hail of bullets.',
    projectileSpeed: 0.25,
    projectileStyle: 'arrow_classic'
  },
  'INFERNO': {
    name: 'Flamethrower', cost: 600, damage: 4, range: 3.6, cooldown: 5,
    type: 'beam', color: '#ef4444', icon: '🌋',
    description: 'Continuous flame beam. Damage increases the longer it burns.',
    beamRamp: 0.8
  },
  'EAGLE': {
    name: 'Orbital Strike', cost: 1000, damage: 232, range: 80.2, cooldown: 350,
    type: 'area', color: '#fff', icon: '🛰️',
    description: 'Satellite-guided missile strikes anywhere on the battlefield.',
    areaRadius: 3,
    projectileStyle: 'arc',
    specialAbility: 'aoe',
    maxHp: 250
  },
  'SCATTERSHOT': {
    name: 'Shotgun Turret', cost: 550, damage: 31, range: 2.4, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '💥',
    description: 'Fires multiple pellets in a spread pattern. Hits multiple targets.',
    multiTarget: 5,
    projectileStyle: 'shotgun'
  },
  'MONOLITH': {
    name: 'Railgun', cost: 1500, damage: 387, range: 4.0, cooldown: 150,
    type: 'projectile', color: '#020617', icon: '⚫',
    description: 'Electromagnetic projectile pierces through enemies with burn effect.',
    burnDamage: 20,
    projectileStyle: 'bolt',
    specialAbility: 'aoe',
    areaRadius: 1.0,
    maxHp: 300
  },
  'SPELL_TOWER': {
    name: 'Command Center', cost: 300, damage: 0, range: 2.4, cooldown: 1000,
    type: 'aura', color: '#db2777', icon: '📡',
    description: 'Provides tactical support and coordination (Coming Soon).',
    projectileStyle: 'magic'
  },
  'BUILDER': {
    name: 'Repair Station', cost: 2000, damage: 16, range: 1.6, cooldown: 30,
    type: 'projectile', color: '#a3e635', icon: '🔨',
    description: 'Maintains and repairs nearby structures. Can defend itself.',
    projectileStyle: 'crystal'
  },

  // ==========================================
  // MISSILE SYSTEMS & GUIDED WEAPONS
  // ==========================================
  'EXUSIAI': {
    name: 'Multi-Missile System', cost: 550, damage: 11, range: 3.2, cooldown: 8,
    type: 'projectile', color: '#ef4444', icon: '🚀',
    description: 'Rapid-fire missile barrage. Overwhelms enemies with volume.',
    projectileSpeed: 0.9,
    projectileStyle: 'energy'
  },
  'SCHWARZ': {
    name: 'Anti-Tank Rifle', cost: 650, damage: 310, range: 2.4, cooldown: 150,
    type: 'projectile', color: '#1e1e1e', icon: '🎯',
    description: 'High-penetration sniper round. Devastating single-shot damage.',
    projectileStyle: 'sniper'
  },
  'LEMUEN': {
    name: 'Precision Strike', cost: 600, damage: 139, range: 4.9, cooldown: 140,
    type: 'projectile', color: '#fcd34d', icon: '🎯',
    description: 'Long-range guided missile. Targets weakest armor points.',
    projectileStyle: 'sniper'
  },
  'SNOW_HUNTER': {
    name: 'Cryo Cannon', cost: 320, damage: 70, range: 3.2, cooldown: 100,
    type: 'projectile', color: '#cbd5e1', icon: '❄️',
    description: 'Freezing projectiles slow enemy movement speed.',
    slowFactor: 0.5,
    projectileStyle: 'ice',
    specialAbility: 'slow',
    maxHp: 120
  },
  'SKYBOX': {
    name: 'Anti-Air Platform', cost: 450, damage: 50, range: 4.0, cooldown: 55,
    type: 'area', color: '#0ea5e9', icon: '✈️',
    description: 'Mobile air defense unit. Explosive rockets for aerial threats.',
    projectileStyle: 'rocket'
  },
  'BRIGID': {
    name: 'Boomerang Launcher', cost: 380, damage: 42, range: 2.8, cooldown: 45,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Projectiles return after hitting targets. Double damage potential.',
    projectileStyle: 'boomerang'
  },
  'ROSA': {
    name: 'Anchoring Trap', cost: 580, damage: 85, range: 4.0, cooldown: 160,
    type: 'pull', color: '#fff', icon: '⚓',
    description: 'Launches anchors that immobilize heavy enemies in place.',
    stunDuration: 30,
    specialAbility: 'stun',
    maxHp: 150
  },
  'W': {
    name: 'Timed Explosive', cost: 600, damage: 155, range: 3.2, cooldown: 120,
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
    name: 'Needle Launcher', cost: 300, damage: 35, range: 2.8, cooldown: 60,
    type: 'projectile', color: '#8b5cf6', icon: '💉',
    description: 'Precise needle darts. Pierces armor with high accuracy.',
    projectileStyle: 'needle'
  },
  'AKKORD': {
    name: 'Artillery Command', cost: 700, damage: 74, range: 6.5, cooldown: 180,
    type: 'area', color: '#f472b6', icon: '🎼',
    description: 'Calls in long-range bombardment strikes from off-map.',
    projectileStyle: 'arc'
  },
  'IFRIT': {
    name: 'Laser Cannon', cost: 750, damage: 93, range: 4.0, cooldown: 50,
    type: 'line', color: '#ff5722', icon: '🔴',
    description: 'Continuous laser beam burns enemies in a straight line.',
    burnDamage: 10
  },
  'MANTRA': {
    name: 'Poison Launcher', cost: 350, damage: 27, range: 3.2, cooldown: 50,
    type: 'projectile', color: '#14b8a6', icon: '🐍',
    description: 'Toxic projectiles deal damage over time to enemies.',
    projectileStyle: 'acid'
  },
  'CEOBE': {
    name: 'Axe Launcher', cost: 400, damage: 39, range: 2.8, cooldown: 35,
    type: 'projectile', color: '#fb923c', icon: '🪓',
    description: 'Rapidly hurls spinning blades at enemies.',
    projectileStyle: 'blade'
  },
  'GOLDENGOLOW': {
    name: 'Drone Swarm', cost: 450, damage: 16, range: 80.2, cooldown: 20,
    type: 'projectile', color: '#f9a8d4', icon: '🛸',
    description: 'Autonomous drones hunt targets across the entire battlefield.',
    projectileStyle: 'lightning'
  },
  'NECRASS': {
    name: 'Spawner Array', cost: 520, damage: 55, range: 2.4, cooldown: 80,
    type: 'summon', color: '#4c1d95', icon: '👻',
    description: 'Deploys combat drones from defeated enemy wreckage.',
  },
  'TRAGODIA': {
    name: 'Shadow Cannon', cost: 310, damage: 31, range: 2.4, cooldown: 55,
    type: 'projectile', color: '#7e22ce', icon: '🎭',
    description: 'Dark energy projectiles corrupt enemy systems.',
    projectileStyle: 'shadow'
  },

  // ==========================================
  // HEAVY DEFENSE & FORTIFICATIONS
  // ==========================================
  'HOSHIGUMA': {
    name: 'Rotary Blades', cost: 550, damage: 47, range: 1.3, cooldown: 30,
    type: 'aura', color: '#22c55e', icon: '🟢',
    description: 'Spinning sawblades shred all enemies in close proximity.',
    projectileStyle: 'saw'
  },
  'MUDROCK': {
    name: 'Sledgehammer Turret', cost: 900, damage: 271, range: 1.3, cooldown: 180,
    type: 'area', color: '#57534e', icon: '🔨',
    description: 'Massive area-of-effect spin attack. Crushes multiple enemies.',
    areaRadius: 2.0,
    projectileStyle: 'cannonball'
  },
  'NIAN': {
    name: 'Heat Emitter', cost: 600, damage: 62, range: 1.3, cooldown: 60,
    type: 'aura', color: '#ef4444', icon: '🏮',
    description: 'Radiant heat aura continuously damages nearby enemies.',
    burnDamage: 15,
    projectileStyle: 'fire'
  },
  'PENANCE': {
    name: 'Reflector Shield', cost: 620, damage: 108, range: 1.3, cooldown: 90,
    type: 'projectile', color: '#9f1239', icon: '⚖️',
    description: 'Deflects incoming attacks back at enemies.',
    projectileStyle: 'orb'
  },
  'YU': {
    name: 'Dragon Cannon', cost: 700, damage: 77, range: 1.3, cooldown: 70,
    type: 'aura', color: '#b91c1c', icon: '🐉',
    description: 'Mythical energy aura provides impenetrable defense.',
    projectileStyle: 'magic'
  },
  'CAIRN': {
    name: 'Shield Generator', cost: 480, damage: 39, range: 1.3, cooldown: 50,
    type: 'projectile', color: '#64748b', icon: '🛡️',
    description: 'Projects defensive barrier while launching disc projectiles.',
    projectileStyle: 'disc'
  },
  'VETOCHKI': {
    name: 'Spike Barrage', cost: 510, damage: 50, range: 1.3, cooldown: 60,
    type: 'projectile', color: '#334155', icon: '🪵',
    description: 'Fires unstoppable armor-piercing spikes.',
    projectileStyle: 'spike'
  },

  // ==========================================
  // SPECIALIZED COMBAT SYSTEMS
  // ==========================================
  'SILVERASH': {
    name: 'Sword Slash', cost: 1000, damage: 171, range: 2.8, cooldown: 70,
    type: 'area', color: '#cbd5e1', icon: '🗡️',
    description: 'Wide-area blade attack cuts through multiple enemies.',
    projectileStyle: 'blade'
  },
  'SURTR': {
    name: 'Beam Overload', cost: 900, damage: 310, range: 2.0, cooldown: 40,
    type: 'beam', color: '#f59e0b', icon: '👿',
    description: 'Massive energy beam. Damage exponentially increases over time.',
    beamRamp: 2.0
  },
  'THORNS': {
    name: 'Toxin Sprayer', cost: 550, damage: 55, range: 2.4, cooldown: 45,
    type: 'projectile', color: '#d97706', icon: '🌵',
    description: 'Poisonous projectiles deal continuous damage over time.',
    burnDamage: 10,
    projectileStyle: 'poison'
  },
  'BLAZE': {
    name: 'Chain Saw', cost: 600, damage: 85, range: 1.6, cooldown: 20,
    type: 'aura', color: '#ea580c', icon: '⚙️',
    description: 'Continuous area damage. Constantly shreds enemies nearby.',
    projectileStyle: 'saw'
  },
  'VARKARIS': {
    name: 'Multi-Target System', cost: 450, damage: 70, range: 1.3, cooldown: 50,
    type: 'area', color: '#94a3b8', icon: '🐮',
    description: 'Fires simultaneously at multiple enemies in range.',
    projectileStyle: 'dart'
  },
  'NASTI': {
    name: 'Drill Cannon', cost: 400, damage: 47, range: 1.3, cooldown: 55,
    type: 'projectile', color: '#475569', icon: '🔩',
    description: 'Rotating drill projectiles pierce through armor.',
    projectileStyle: 'needle'
  },
  'HADIYA': {
    name: 'Arrow Volley', cost: 380, damage: 42, range: 1.3, cooldown: 45,
    type: 'projectile', color: '#a8a29e', icon: '🏹',
    description: 'Rapid arrow fire strikes enemies with precision.',
    projectileStyle: 'shuriken'
  },

  // ==========================================
  // SUPPORT & CONTROL SYSTEMS
  // ==========================================
  'ANGELINA': {
    name: 'Gravity Field', cost: 400, damage: 19, range: 3.2, cooldown: 20,
    type: 'projectile', color: '#818cf8', icon: '💫',
    description: 'Projectiles create gravity wells that slow enemy movement.',
    slowFactor: 0.7,
    projectileStyle: 'vortex'
  },
  'GLADIITR': {
    name: 'Vortex Launcher', cost: 500, damage: 62, range: 2.8, cooldown: 90,
    type: 'pull', color: '#1e3a8a', icon: '⚓',
    description: 'Pulls distant enemies closer into combat range.',
    pullStrength: 1.5,
    projectileStyle: 'vortex',
    specialAbility: 'pull',
    maxHp: 140
  },
  'WEEDY': {
    name: 'Ice Cannon', cost: 450, damage: 47, range: 2.4, cooldown: 100,
    type: 'pull', color: '#2dd4bf', icon: '🌊',
    description: 'Freezing blasts push enemies backward while slowing them.',
    pullStrength: -2.0,
    projectileStyle: 'ice'
  },
  'PHANTOM': {
    name: 'Kunai Thrower', cost: 300, damage: 62, range: 1.6, cooldown: 40,
    type: 'projectile', color: '#111827', icon: '🐱',
    description: 'Fast-reloading stealth weapons for quick strikes.',
    projectileStyle: 'kunai'
  },
  'SURFER': {
    name: 'Water Strike', cost: 250, damage: 35, range: 1.3, cooldown: 30,
    type: 'projectile', color: '#0ea5e9', icon: '🏄‍♀️',
    description: 'Rapid water projectiles with freezing effects.',
    projectileStyle: 'ice'
  },
  'PRAMANIX': {
    name: 'Weakening Field', cost: 350, damage: 23, range: 2.8, cooldown: 60,
    type: 'aura', color: '#fff', icon: '🔔',
    description: 'Aura reduces enemy defensive capabilities.',
    projectileStyle: 'holy'
  },
  'ASTGENNE': {
    name: 'Star Shooter', cost: 380, damage: 31, range: 2.4, cooldown: 50,
    type: 'projectile', color: '#facc15', icon: '🌟',
    description: 'Starlight projectiles track and strike enemies.',
    projectileStyle: 'bloomerang'
  },
  'SUZURAN': {
    name: 'Slow Field', cost: 500, damage: 8, range: 3.2, cooldown: 10,
    type: 'aura', color: '#fef08a', icon: '🦊',
    description: 'Massive area slow effect. Significantly reduces enemy speed.',
    slowFactor: 0.4,
    projectileStyle: 'holy',
    specialAbility: 'slow',
    maxHp: 130
  },

  // ==========================================
  // ADVANCED WEAPON SYSTEMS
  // ==========================================
  'TOGAWA': {
    name: 'Neural Beam', cost: 420, damage: 74, range: 2.4, cooldown: 60,
    type: 'beam', color: '#4c1d95', icon: '🎹',
    description: 'Psionic energy beam drains enemy health over time.',
    beamRamp: 0.6
  },
  'UMIRI': {
    name: 'Sonic Blast', cost: 380, damage: 85, range: 1.3, cooldown: 45,
    type: 'aura', color: '#be185d', icon: '🎸',
    description: 'Continuous sonic shockwaves damage nearby enemies.',
  },
  'MISUMI': {
    name: 'Support Drone', cost: 300, damage: 0, range: 2.4, cooldown: 60,
    type: 'aura', color: '#fcd34d', icon: '🎤',
    description: 'Heals and buffs nearby defenses (Concept).',
  },
  'WAKABA': {
    name: 'Puppet Striker', cost: 400, damage: 66, range: 1.3, cooldown: 40,
    type: 'projectile', color: '#10b981', icon: '🥒',
    description: 'Remote-controlled projectiles strike with precision.',
  },
  'YUTENJI': {
    name: 'Shockwave Drums', cost: 450, damage: 100, range: 1.3, cooldown: 80,
    type: 'area', color: '#fca5a5', icon: '🥁',
    description: 'Ground-pounding area attacks shake multiple enemies.',
  },

  // ==========================================
  // SPECIALIZED DEFENSE TOOLS
  // ==========================================
  'PERFUMER': { name: 'Medic Station', cost: 200, damage: 8, range: 2.4, cooldown: 60, type: 'projectile', color: '#bef264', icon: '💚', description: 'Heals nearby structures (Concept).', projectileStyle: 'holy' },
  'HARUKA': { name: 'Command Relay', cost: 220, damage: 16, range: 2.4, cooldown: 60, type: 'projectile', color: '#a5f3fc', icon: '🌊', description: 'Routes commands to other defense systems.', projectileStyle: 'star' },
  'KICHISEI': { name: 'Scatter Gun', cost: 480, damage: 47, range: 2.0, cooldown: 80, type: 'spread', color: '#fdba74', icon: '🐕', description: 'Fires wide spread of projectiles at multiple angles.', multiTarget: 7, projectileStyle: 'shotgun' },
  'MATSUKIRI': { name: 'Tactical Rifle', cost: 350, damage: 35, range: 1.3, cooldown: 50, type: 'projectile', color: '#94a3b8', icon: '🐺', description: 'Precision strikes with tactical targeting.', projectileStyle: 'spear' },
  'RAIDIAN': { name: 'Drone Controller', cost: 300, damage: 27, range: 2.4, cooldown: 55, type: 'summon', color: '#e2e8f0', icon: '🛠️', description: 'Deploys combat drones to engage enemies.', projectileStyle: 'disc' },
  'LEIZI': { name: 'Chain Lightning', cost: 580, damage: 55, range: 2.8, cooldown: 65, type: 'projectile', color: '#fcd34d', icon: '⚡', description: 'Electricity chains between multiple enemies.', projectileStyle: 'lightning' },
  'RECORD_KEEPER': { name: 'Log System', cost: 200, damage: 11, range: 2.4, cooldown: 70, type: 'projectile', color: '#fff', icon: '📝', description: 'Records and tracks enemy movements.', projectileStyle: 'void' },
  'TIPPI': { name: 'Scout Drone', cost: 360, damage: 39, range: 2.4, cooldown: 50, type: 'projectile', color: '#86efac', icon: '🐦', description: 'Aerial reconnaissance unit with combat capability.', projectileStyle: 'energy' },
  'MISS_CHRISTINE': { name: 'Elegant Cannon', cost: 280, damage: 31, range: 2.4, cooldown: 45, type: 'projectile', color: '#f472b6', icon: '🐈', description: 'Graceful but deadly precision shots.', projectileStyle: 'crystal' },
  'SANKTA': { name: 'Heavy Defender', cost: 600, damage: 62, range: 1.3, cooldown: 50, type: 'projectile', color: '#fca5a5', icon: '🥛', description: 'Heavy-caliber rounds for close-range defense.', projectileStyle: 'cannonball' },
  'GRACEBEARER': { name: 'Standard Gun', cost: 550, damage: 70, range: 1.3, cooldown: 60, type: 'projectile', color: '#fbbf24', icon: '🎖️', description: 'Reliable standard-issue weapon system.', projectileStyle: 'plasma' },
  'CONFESS_47': { name: 'Robot Sentry', cost: 100, damage: 16, range: 1.3, cooldown: 30, type: 'projectile', color: '#94a3b8', icon: '🤖', description: 'Automated sentry turret with basic targeting.', projectileStyle: 'bullet' },
  'MON3TR': { name: 'Combat Mech', cost: 400, damage: 155, range: 1.6, cooldown: 60, type: 'projectile', color: '#10b981', icon: '👾', description: 'Deployable mech unit with high damage output.', projectileStyle: 'rocket' },
  'ALANNA': { name: 'Weapon Forge', cost: 350, damage: 39, range: 1.3, cooldown: 55, type: 'projectile', color: '#d6d3d1', icon: '🛠️', description: 'Manufactures and launches custom projectiles.', projectileStyle: 'dark' },
  'WINDSCOOT': { name: 'Wind Cutter', cost: 400, damage: 62, range: 1.3, cooldown: 40, type: 'projectile', color: '#bae6fd', icon: '🌬️', description: 'Air pressure projectiles slice through enemies.', projectileStyle: 'blade' },
  'WULFENITE': { name: 'Trap System', cost: 320, damage: 31, range: 2.4, cooldown: 45, type: 'projectile', color: '#fde047', icon: '🪤', description: 'Deploys hidden traps that trigger on enemy contact.', projectileStyle: 'spike' },
  'ENTELECHIA': { name: 'Reaper Cannon', cost: 600, damage: 77, range: 1.3, cooldown: 60, type: 'area', color: '#1e293b', icon: '🌾', description: 'Area damage cannon that harvests enemy health.', projectileStyle: 'void' },
  'NOWELL': { name: 'Medic Unit', cost: 250, damage: 16, range: 2.4, cooldown: 60, type: 'projectile', color: '#bfdbfe', icon: '⚕️', description: 'Medical support unit with defensive capabilities.', projectileStyle: 'holy' },
  'XINGZHU': { name: 'Support Tower', cost: 300, damage: 23, range: 2.4, cooldown: 55, type: 'projectile', color: '#fca5a5', icon: '🥢', description: 'Provides support fire for nearby defenses.', projectileStyle: 'star' },
  'TECNO': { name: 'Tech Summoner', cost: 350, damage: 31, range: 2.4, cooldown: 50, type: 'summon', color: '#a5f3fc', icon: '💻', description: 'Summons technological constructs to fight.' },
  'ROSE_SALT': { name: 'Multi-Healer', cost: 280, damage: 0, range: 2.4, cooldown: 60, type: 'aura', color: '#fbcfe8', icon: '🧂', description: 'Heals multiple structures simultaneously.' },
  
  // ==========================================
  // NEW SUPPORT & BUFF TOWERS
  // ==========================================
  'SPEED_BOOSTER': { name: 'Speed Enhancer', cost: 400, damage: 0, range: 2.8, cooldown: 120, type: 'aura', color: '#fbbf24', icon: '⚡', description: 'Increases attack speed of nearby towers by 30%.' },
  'DAMAGE_AMPLIFIER': { name: 'Damage Amplifier', cost: 500, damage: 0, range: 2.6, cooldown: 150, type: 'aura', color: '#ef4444', icon: '💥', description: 'Boosts damage of nearby towers by 50%.' },
  'FROST_ENHANCER': { name: 'Frost Enhancer', cost: 450, damage: 0, range: 2.4, cooldown: 140, type: 'aura', color: '#bfdbfe', icon: '❄️', description: 'Grants nearby towers freeze effect on attacks.' },
  'VENOM_ENHANCER': { name: 'Venom Enhancer', cost: 450, damage: 0, range: 2.4, cooldown: 140, type: 'aura', color: '#14b8a6', icon: '☠️', description: 'Grants nearby towers poison effect on attacks.' },
  'MINE_LAYER': { name: 'Mine Layer', cost: 600, damage: 50, range: 3.0, cooldown: 200, type: 'projectile', color: '#f59e0b', icon: '💣', description: 'Plants explosive mines on the enemy route. Max 3 mines per level.' },
};

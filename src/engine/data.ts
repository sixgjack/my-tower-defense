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
    movementType?: 'ground' | 'air';
    immunities?: Array<'physical' | 'fire' | 'ice' | 'electric' | 'poison' | 'arcane' | 'explosive'>;
}

export const ENEMY_TYPES: EnemyType[] = [
    // Basic Enemies (Fast & Weak) - Rewards reduced by ~35%
    { name: "Bug", hp: 30, speed: 1.0, reward: 10, color: "#f87171", icon: "🐛", description: "A mindless pest spawned from corrupt code. Weak alone, but travels in swarms that overwhelm unprepared defenses." },
    { name: "Spider", hp: 25, speed: 1.3, reward: 8, color: "#dc2626", icon: "🕷️", abilities: ['camouflage'], description: "Spins invisible webs to mask its approach. Hard to spot until it has already slipped past your outer towers." },
    { name: "Mite", hp: 20, speed: 1.5, reward: 7, color: "#ef4444", icon: "🪲", description: "Microscopic and relentless. Its tiny frame lets it dart through gaps in coverage at unnerving speed." },
    { name: "Fly", hp: 15, speed: 1.8, reward: 5, color: "#f97316", icon: "🦋", abilities: ['fly'], movementType: 'air', description: "An airborne nuisance that bypasses ground-level defenses entirely. Fast and fragile — do not let it slip through." },

    // Balanced Enemies
    { name: "Glitch", hp: 80, speed: 0.7, reward: 16, color: "#c084fc", icon: "👾", description: "A fragment of corrupted data. Erratic movement patterns make it difficult to target reliably." },
    { name: "Drone", hp: 75, speed: 0.8, reward: 14, color: "#a855f7", icon: "🤖", abilities: ['fly'], movementType: 'air', description: "An aerial reconnaissance unit that flies over terrain obstacles and scouts ahead of larger threats." },
    { name: "Hacker", hp: 85, speed: 0.65, reward: 18, color: "#9333ea", icon: "👤", abilities: ['deactivate_towers'], abilityCooldown: 300, description: "Infiltrates and disables your towers remotely. If left unchecked, it can neutralize entire sections of your defense grid." },
    { name: "Crawler", hp: 70, speed: 0.75, reward: 13, color: "#7c3aed", icon: "🕸️", description: "Methodically advances through any terrain. Manageable alone, but dangerous when part of a coordinated push." },

    // Tank Enemies
    { name: "Virus", hp: 200, speed: 0.4, reward: 32, color: "#4ade80", icon: "🦠", description: "A self-replicating threat that absorbs enormous punishment. Slow but nearly unstoppable once it gets close." },
    { name: "Malware", hp: 220, speed: 0.35, reward: 36, color: "#22c55e", icon: "🪳", abilities: ['shield'], description: "Wrapped in a digital barrier that blocks the first burst of damage. Crack the shield before the real fight begins." },
    { name: "Tank", hp: 250, speed: 0.3, reward: 39, color: "#16a34a", icon: "🛡️", abilities: ['damage_reflect'], description: "Reflects a portion of every hit back at your towers. Beware — heavy damage dealers may end up hurting themselves." },
    { name: "Brute", hp: 300, speed: 0.25, reward: 45, color: "#15803d", icon: "💪", abilities: ['regenerate'], description: "Regenerates health continuously as it marches. Only concentrated burst damage can bring this monster down for good." },
    { name: "Guardian", hp: 350, speed: 0.2, reward: 52, color: "#166534", icon: "🛡️", abilities: ['shield', 'heal_allies'], abilityCooldown: 200, description: "Shields itself and mends nearby allies mid-battle. Destroy it first to collapse the enemy formation around it." },

    // Fast Enemies
    { name: "Worm", hp: 60, speed: 1.2, reward: 13, color: "#f472b6", icon: "🪱", description: "Slithers at surprising speed for its size. A squirming menace that loves to slip through neglected corridors." },
    { name: "Snake", hp: 55, speed: 1.4, reward: 12, color: "#ec4899", icon: "🐍", abilities: ['poison_aura'], description: "Exudes a toxic aura that corrodes nearby tower systems over time. Keep your fire concentrated or pay the price." },
    { name: "Swift", hp: 50, speed: 1.6, reward: 10, color: "#db2777", icon: "⚡", abilities: ['charge'], description: "Charges forward in short bursts of extreme speed. Blink and you will miss it clearing your entire kill zone." },
    { name: "Ghost", hp: 45, speed: 1.5, reward: 9, color: "#be185d", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 400, description: "Vanishes and reappears mid-path using short-range teleports. Towers can lose track of it between volleys." },

    // Special Ability Enemies
    { name: "Teleporter", hp: 100, speed: 0.6, reward: 20, color: "#6366f1", icon: "🌀", abilities: ['teleport'], abilityCooldown: 250, description: "Skips large sections of the path in an instant. Always assume it is farther ahead than your towers are targeting." },
    { name: "Healer", hp: 90, speed: 0.65, reward: 18, color: "#8b5cf6", icon: "💚", abilities: ['heal_allies'], abilityCooldown: 150, description: "Continuously restores health to nearby allies as they advance. Eliminate it first to stop the bleeding." },
    { name: "Saboteur", hp: 120, speed: 0.5, reward: 23, color: "#ef4444", icon: "🔧", abilities: ['deactivate_towers'], abilityCooldown: 300, description: "Carries EMP charges that shut down adjacent towers on contact. Your defenses go dark wherever it walks." },
    { name: "Summoner", hp: 150, speed: 0.45, reward: 26, color: "#a855f7", icon: "🔮", abilities: ['spawn_minions'], abilityCooldown: 500, description: "Conjures waves of minions mid-march. Each spawn is a fresh leak threatening your base while you fight the original." },
    { name: "Berserker", hp: 180, speed: 0.8, reward: 29, color: "#dc2626", icon: "😡", abilities: ['berserk'], description: "Enrages as it takes damage — the more you hurt it, the faster it moves. Burst it down before it goes ballistic." },
    { name: "Freezer", hp: 110, speed: 0.55, reward: 21, color: "#06b6d4", icon: "❄️", abilities: ['freeze_aura'], description: "Projects a frozen aura that slows nearby towers' attack speed to a crawl. Packs of these will grind your defense to a halt." },
    { name: "Bomber", hp: 70, speed: 0.7, reward: 16, color: "#f59e0b", icon: "💣", abilities: ['explode'], description: "Detonates in a massive explosion on death that damages adjacent towers. Be careful where you finish it off." },
    { name: "Splitter", hp: 130, speed: 0.5, reward: 25, color: "#10b981", icon: "🔀", abilities: ['split'], description: "Divides into two smaller versions when destroyed. Eliminate the halves quickly or face an exponential cascade." },
    { name: "Burrower", hp: 95, speed: 0.6, reward: 18, color: "#78716c", icon: "🕳️", abilities: ['burrow'], description: "Digs underground to avoid all tower fire for several seconds, then re-emerges closer to your base." },
    { name: "Retreater", hp: 85, speed: 1.0, reward: 15, color: "#64748b", icon: "🏃", abilities: ['retreat'], description: "Sprints back toward spawn when heavily wounded, forcing you to spend extra shots. A frustrating time-waster." },
    { name: "Stunner", hp: 105, speed: 0.58, reward: 20, color: "#facc15", icon: "⚡", abilities: ['stun_attack'], abilityCooldown: 350, description: "Unleashes electric pulses that stun nearby towers mid-volley. Times its bursts to strike during critical wave moments." },

    // Boss-like Enemies (Higher HP) - Rewards reduced by ~35%
    { name: "Trojan", hp: 400, speed: 0.3, reward: 65, color: "#fbbf24", icon: "🐴", description: "Disguised as a harmless package, it carries devastating payloads deep into your base. A high-health infiltrator with no mercy." },
    { name: "Titan", hp: 500, speed: 0.25, reward: 78, color: "#f59e0b", icon: "👹", isBoss: true, abilities: ['shield', 'charge'], description: "An armored giant that shields itself and charges when threatened. Bring your heaviest firepower to the front lines." },
    { name: "Behemoth", hp: 600, speed: 0.2, reward: 91, color: "#dc2626", icon: "👺", isBoss: true, abilities: ['regenerate', 'berserk'], description: "Endlessly regenerates and grows more savage as its health drops. The angrier it gets, the more unstoppable it becomes." },
    { name: "Warlord", hp: 450, speed: 0.28, reward: 72, color: "#7c2d12", icon: "⚔️", isBoss: true, abilities: ['damage_reflect', 'heal_allies'], abilityCooldown: 200, description: "A battlefield commander who reflects every strike and heals surrounding troops. Legends say it has never lost a siege." },

    // Advanced Enemies
    { name: "Necromancer", hp: 320, speed: 0.35, reward: 55, color: "#581c87", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 400, description: "Raises fallen enemies as undead minions and keeps the living topped off with dark energy. Defeat it before the horde snowballs." },
    { name: "Phantom", hp: 140, speed: 0.9, reward: 27, color: "#1e293b", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 300, description: "A ghostly speedster that flickers between visibility and teleports through volleys. Nearly impossible to pin down." },
    { name: "Archmage", hp: 280, speed: 0.4, reward: 49, color: "#3b82f6", icon: "🧙", abilities: ['deactivate_towers', 'poison_aura'], abilityCooldown: 350, description: "Combines tower-disabling magic with a deadly poison cloud. One of the most dangerous single targets you will ever face." },
    { name: "Golem", hp: 550, speed: 0.15, reward: 85, color: "#78716c", icon: "🗿", isBoss: true, abilities: ['shield', 'damage_reflect'], moneyBonus: 3.0, description: "An ancient stone colossus with an impenetrable shield and total damage reflection. Only sustained magic fire can chip it down." },
    { name: "Dragon", hp: 700, speed: 0.18, reward: 104, color: "#dc2626", icon: "🐉", isBoss: true, abilities: ['fly', 'poison_aura', 'charge'], movementType: 'air', immunities: ['fire'], moneyBonus: 3.0, description: "Soars above terrain, poisoning everything it passes and charging at full fury when wounded. A living, flying catastrophe." },
    { name: "Kraken", hp: 650, speed: 0.22, reward: 98, color: "#0ea5e9", icon: "🐙", isBoss: true, abilities: ['split', 'freeze_aura'], moneyBonus: 3.0, description: "A deep-sea titan that splits into smaller beasts and freezes every tower in its icy wake. Destroy all tentacles at once." },
    { name: "Hydra", hp: 580, speed: 0.26, reward: 88, color: "#10b981", icon: "🐲", isBoss: true, abilities: ['split', 'regenerate'], moneyBonus: 3.0, description: "Every time you cut it down, two heads grow back. Eliminate all fragments simultaneously or face an endless resurrection." },
    { name: "Colossus", hp: 800, speed: 0.12, reward: 117, color: "#475569", icon: "🗽", isBoss: true, abilities: ['shield', 'stun_attack', 'heal_allies'], abilityCooldown: 250, moneyBonus: 3.5, description: "The largest entity ever deployed. Shields itself, stuns attackers, and heals on the move. A true juggernaut of war." },
    { name: "Tyrant", hp: 750, speed: 0.16, reward: 111, color: "#991b1b", icon: "👑", isBoss: true, abilities: ['berserk', 'damage_reflect', 'charge'], moneyBonus: 3.5, description: "A rampaging warlord clad in reflecting armor who grows unhinged at low health and charges with terrifying force." },
    { name: "Demon", hp: 680, speed: 0.2, reward: 101, color: "#7c2d12", icon: "😈", isBoss: true, abilities: ['teleport', 'poison_aura', 'explode'], moneyBonus: 3.0, description: "Teleports across the battlefield, poisons the ground it touches, and explodes violently on death. Hell itself given form." },

    // Elite Enemies
    { name: "Assassin", hp: 160, speed: 1.1, reward: 31, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 400, description: "Invisible, teleporting, and capable of stunning towers mid-volley. If you can see it, you are already behind." },
    { name: "Paladin", hp: 420, speed: 0.32, reward: 68, color: "#fbbf24", icon: "⚔️", abilities: ['shield', 'heal_allies'], abilityCooldown: 180, description: "A holy warrior with an unbreakable shield and the power to mend allies mid-battle. Kill the healer first, always." },
    { name: "Vampire", hp: 380, speed: 0.38, reward: 62, color: "#be123c", icon: "🧛", abilities: ['regenerate', 'teleport'], abilityCooldown: 320, description: "Regenerates wounds and teleports away when cornered. Persistent and nearly impossible to permanently bring down." },
    { name: "Shaman", hp: 260, speed: 0.42, reward: 46, color: "#9333ea", icon: "🔮", abilities: ['spawn_minions', 'freeze_aura', 'poison_aura'], abilityCooldown: 450, description: "Summons minion hordes, slows your towers with ice, and fills the air with poison. A multi-threat on two legs." },
    { name: "Wraith", hp: 200, speed: 0.85, reward: 34, color: "#6366f1", icon: "👤", abilities: ['invisible', 'fly', 'teleport'], abilityCooldown: 350, description: "Flies invisibly and teleports at will. Your towers will fire into empty air while it slips past completely unnoticed." },
    { name: "Revenant", hp: 440, speed: 0.3, reward: 70, color: "#4338ca", icon: "💀", isBoss: true, abilities: ['spawn_minions', 'regenerate', 'damage_reflect'], moneyBonus: 3.5, description: "Refuses to stay dead — spawns undead reinforcements, reflects all damage, and heals itself. Each engagement feels like the first." },
    { name: "Leviathan", hp: 720, speed: 0.14, reward: 107, color: "#0c4a6e", icon: "🌊", isBoss: true, abilities: ['split', 'freeze_aura', 'charge'], moneyBonus: 4.0, description: "An ocean god that splits into hordes of lesser beasts, freezes every tower in range, and charges when enraged." },
    { name: "Phoenix", hp: 600, speed: 0.5, reward: 94, color: "#ea580c", icon: "🔥", isBoss: true, abilities: ['fly', 'regenerate', 'explode'], moneyBonus: 3.5, description: "Burns away damage with regenerative fire, flies through aerial corridors, and detonates catastrophically on death." },
    { name: "Cerberus", hp: 620, speed: 0.24, reward: 96, color: "#1f2937", icon: "🐕", isBoss: true, abilities: ['split', 'charge', 'stun_attack'], moneyBonus: 3.5, description: "A three-headed hound that splits into separate beasts, charges relentlessly, and stuns towers with each savage bite." },
    { name: "Manticore", hp: 640, speed: 0.21, reward: 99, color: "#78350f", icon: "🦂", isBoss: true, abilities: ['fly', 'poison_aura', 'teleport'], abilityCooldown: 400, moneyBonus: 3.5, description: "Swoops in from above, teleports unpredictably to avoid locks, and drips lethal venom on everything below. Beware the tail." },

    // Special Bosses
    { name: "Overlord", hp: 900, speed: 0.1, reward: 130, color: "#1e1e1e", icon: "👑", isBoss: true, abilities: ['deactivate_towers', 'spawn_minions', 'shield', 'heal_allies'], abilityCooldown: 180, moneyBonus: 5.0, description: "The supreme commander. Disables towers, deploys endless armies, shields itself, and heals everything nearby. Prepare everything you have." },
    { name: "Cthulhu", hp: 850, speed: 0.13, reward: 124, color: "#0f172a", icon: "🐙", isBoss: true, abilities: ['teleport', 'split', 'poison_aura', 'stun_attack'], abilityCooldown: 220, moneyBonus: 5.0, description: "An elder god of chaos. Teleports without warning, splits into cosmic horrors, and paralyzes towers with psychic venom." },
    { name: "Archon", hp: 920, speed: 0.11, reward: 133, color: "#581c87", icon: "👤", isBoss: true, abilities: ['invisible', 'teleport', 'damage_reflect', 'heal_allies'], abilityCooldown: 200, moneyBonus: 5.0, description: "An invisible, reflective, self-healing demigod. Strikes unseen and emerges perfectly unharmed from every engagement." },
    { name: "Abomination", hp: 880, speed: 0.14, reward: 127, color: "#7c2d12", icon: "👹", isBoss: true, abilities: ['split', 'regenerate', 'berserk', 'explode'], moneyBonus: 4.5, description: "A living catastrophe — it splits, regenerates, enrages at low health, then explodes taking everything with it. There is no safe approach." },
    { name: "World Eater", hp: 1000, speed: 0.08, reward: 143, color: "#000000", icon: "🌑", isBoss: true, abilities: ['fly', 'teleport', 'shield', 'damage_reflect', 'heal_allies'], abilityCooldown: 150, moneyBonus: 6.0, description: "The end of all defenses. Flies, teleports, shields every hit, reflects damage, and heals continuously. Victory here is barely possible." },

    // ==========================================
    // NEW ENEMIES (20 new enemies with abilities) - Rewards reduced by ~35%
    // ==========================================
    { name: "Sapper", hp: 180, speed: 0.4, reward: 29, color: "#f97316", icon: "🔨", abilities: ['attack_towers'], abilityCooldown: 200, minWave: 3, description: "Carries demolition charges that destroy tower structures directly. Leave it alone and your defenses will crumble from within." },
    { name: "Siege Engine", hp: 450, speed: 0.2, reward: 72, color: "#78716c", icon: "⚙️", abilities: ['attack_towers', 'shield'], abilityCooldown: 300, minWave: 8, description: "A massive armored war machine with a forward shield that systematically demolishes towers on contact. Built for one purpose." },
    { name: "Corruptor", hp: 220, speed: 0.5, reward: 36, color: "#7c3aed", icon: "💜", abilities: ['slow_towers', 'poison_aura'], abilityCooldown: 250, minWave: 5, description: "Infects towers with a digital plague that degrades their firing rate. Its poisonous signal lingers long after it passes." },
    { name: "Frost Wraith", hp: 190, speed: 0.6, reward: 31, color: "#06b6d4", icon: "🧊", abilities: ['freeze_aura', 'invisible'], immunities: ['ice'], abilityCooldown: 350, minWave: 6, description: "An invisible ice specter that flash-freezes the ground it walks on, slowing every nearby tower's attack speed to nothing." },
    { name: "Plague Bearer", hp: 160, speed: 0.7, reward: 26, color: "#14b8a6", icon: "🦠", abilities: ['poison_aura', 'spawn_minions'], abilityCooldown: 400, minWave: 4, description: "Oozes contagion that spawns additional enemies even as it marches. Two threats wrapped in one revolting package." },
    { name: "Shock Trooper", hp: 140, speed: 0.9, reward: 23, color: "#facc15", icon: "⚡", abilities: ['stun_attack', 'charge'], abilityCooldown: 280, minWave: 3, description: "Dashes forward then releases a burst of electricity that stuns nearby towers. Fast, aggressive, and electrifying." },
    { name: "Armored Crawler", hp: 380, speed: 0.25, reward: 62, color: "#475569", icon: "🦂", abilities: ['shield', 'damage_reflect'], minWave: 7, description: "Layered titanium plating shields it and reflects all incoming damage. Only sustained, heavy fire can wear it down." },
    { name: "Void Walker", hp: 200, speed: 0.55, reward: 33, color: "#1e293b", icon: "🌌", abilities: ['teleport', 'invisible'], abilityCooldown: 320, minWave: 5, description: "Slips between dimensions to teleport and vanish from tower lock-ons. Only area-of-effect fire has any chance of catching it." },
    { name: "Crystal Golem", hp: 420, speed: 0.22, reward: 68, color: "#a78bfa", icon: "💎", abilities: ['shield', 'damage_reflect', 'regenerate'], immunities: ['arcane'], minWave: 9, description: "A crystalline titan whose facets regenerate, reflect damage, and project an energy shield. Magic fire is the only real answer." },
    { name: "Shadow Assassin", hp: 120, speed: 1.0, reward: 20, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 380, minWave: 4, description: "Invisible by default, it teleports to dodge incoming shots and stuns towers on arrival. Do not let it reach the base." },
    { name: "Molten Core", hp: 500, speed: 0.18, reward: 81, color: "#ea580c", icon: "🌋", abilities: ['explode', 'poison_aura', 'regenerate'], immunities: ['fire'], minWave: 10, description: "A walking volcano that poisons its surroundings, slowly rebuilds its own health, and erupts violently on death." },
    { name: "Storm Caller", hp: 280, speed: 0.45, reward: 46, color: "#3b82f6", icon: "⛈️", abilities: ['stun_attack', 'deactivate_towers'], abilityCooldown: 300, minWave: 6, description: "Summons thunderbolts that stun your towers and cause cascading electrical failures across your entire defense grid." },
    { name: "Bone Collector", hp: 320, speed: 0.35, reward: 52, color: "#f3f4f6", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 450, minWave: 7, description: "Raises skeletal minions from fallen enemies and heals its growing army with necromantic energy. Shut it down fast." },
    { name: "Toxic Spitter", hp: 150, speed: 0.8, reward: 25, color: "#10b981", icon: "🐍", abilities: ['poison_aura', 'split'], immunities: ['poison'], abilityCooldown: 350, minWave: 4, description: "Sprays a splitting pool of venom that divides into more threats when destroyed. One becomes many in a matter of seconds." },
    { name: "Frost Giant", hp: 550, speed: 0.15, reward: 91, color: "#bfdbfe", icon: "🧊", isBoss: true, abilities: ['freeze_aura', 'shield', 'stun_attack'], abilityCooldown: 280, minWave: 12, moneyBonus: 3.0, description: "A colossal glacier in humanoid form. Freezes every tower in range, absorbs damage behind a shield, and stuns with each step." },
    { name: "Chaos Spawn", hp: 240, speed: 0.5, reward: 39, color: "#dc2626", icon: "🌀", abilities: ['teleport', 'split', 'berserk'], abilityCooldown: 400, minWave: 6, description: "Writhes with unstable energy — teleports randomly, shatters into fragments on death, and rages violently at low health." },
    { name: "Iron Maiden", hp: 400, speed: 0.18, reward: 65, color: "#64748b", icon: "⚔️", abilities: ['attack_towers', 'damage_reflect'], abilityCooldown: 250, minWave: 8, description: "Walks straight through tower structures, destroying them on contact and punishing every attack with lethal reflected damage." },
    { name: "Necrotic Plague", hp: 180, speed: 0.65, reward: 29, color: "#7c2d12", icon: "🦠", abilities: ['poison_aura', 'regenerate', 'spawn_minions'], abilityCooldown: 500, minWave: 5, description: "An undead pestilence that regenerates endlessly, spawns new units from the rot it leaves behind, and poisons the path ahead." },
    { name: "Void Reaper", hp: 350, speed: 0.3, reward: 57, color: "#000000", icon: "🌑", abilities: ['invisible', 'teleport', 'damage_reflect'], abilityCooldown: 360, minWave: 8, description: "Appears from nowhere, reflects all incoming damage back at your towers, then vanishes before they can reacquire it." },
    { name: "Titanium Behemoth", hp: 650, speed: 0.08, reward: 107, color: "#94a3b8", icon: "🗿", isBoss: true, abilities: ['attack_towers', 'shield', 'damage_reflect', 'regenerate'], abilityCooldown: 200, minWave: 15, moneyBonus: 4.0, description: "The most durable threat ever deployed. Destroys towers on contact, shields all damage, reflects every hit, and endlessly regenerates. Good luck." },

    // ==========================================
    // NEW ENEMIES WITH SPECIAL ABILITIES (v2)
    // ==========================================
    // CC Immune enemies - cannot be slowed, frozen, or stunned
    { name: "Juggernaut", hp: 480, speed: 0.35, reward: 78, color: "#374151", icon: "🦾", abilities: ['cc_immune', 'charge'], minWave: 10, description: 'Immune to crowd control effects. Charges through slow fields and stun attacks without pause.' },
    { name: "Unstoppable Force", hp: 600, speed: 0.28, reward: 98, color: "#1f2937", icon: "💪", isBoss: true, abilities: ['cc_immune', 'berserk', 'regenerate'], minWave: 15, moneyBonus: 3.5, description: 'Cannot be slowed or stunned. Regenerates and rages harder as it takes damage.' },
    { name: "Phase Shifter", hp: 200, speed: 0.8, reward: 33, color: "#8b5cf6", icon: "🔮", abilities: ['cc_immune', 'teleport', 'invisible'], abilityCooldown: 300, minWave: 8, description: 'Phases through all effects. Teleports and turns invisible, immune to all crowd control.' },

    // Area Disable enemies - disable towers in 2x2 area
    { name: "EMP Drone", hp: 150, speed: 0.6, reward: 25, color: "#3b82f6", icon: "📡", abilities: ['area_disable', 'fly'], movementType: 'air', immunities: ['electric'], abilityCooldown: 400, minWave: 6, description: 'Broadcasts a disabling pulse that shuts down all towers in a wide radius. Cannot be harmed by electricity.' },
    { name: "Pulse Bomber", hp: 280, speed: 0.4, reward: 46, color: "#6366f1", icon: "💫", abilities: ['area_disable', 'explode'], abilityCooldown: 500, minWave: 9, description: 'Creates an EMP pulse that disables nearby towers, then detonates in a final catastrophic explosion.' },

    // Speed Aura enemies - speed up nearby allies
    { name: "War Drummer", hp: 180, speed: 0.5, reward: 29, color: "#f59e0b", icon: "🥁", abilities: ['speed_aura', 'berserk'], abilityCooldown: 200, minWave: 5, description: 'Beats a war rhythm that speeds up all nearby allies. Enrages itself when threatened.' },
    { name: "Rally Banner", hp: 220, speed: 0.35, reward: 36, color: "#fbbf24", icon: "🚩", abilities: ['speed_aura', 'heal_allies'], abilityCooldown: 250, minWave: 7, description: 'Carries a banner that inspires allies to march faster and recover their wounds mid-battle.' },

    // Shield Allies enemies - give shield to nearby allies
    { name: "Guardian Angel", hp: 200, speed: 0.45, reward: 33, color: "#60a5fa", icon: "👼", abilities: ['shield_allies', 'fly', 'heal_allies'], abilityCooldown: 350, minWave: 6, description: 'Flies above allies, projecting protective shields and healing the most wounded nearby.' },
    { name: "Fortress", hp: 400, speed: 0.2, reward: 65, color: "#475569", icon: "🏰", abilities: ['shield_allies', 'shield', 'damage_reflect'], abilityCooldown: 400, minWave: 10, description: 'A mobile bulwark that shields nearby allies, protects itself, and reflects all incoming damage.' },

    // Combined special abilities
    { name: "Warlord Commander", hp: 350, speed: 0.38, reward: 57, color: "#dc2626", icon: "👑", isBoss: true, abilities: ['speed_aura', 'shield_allies', 'deactivate_towers'], abilityCooldown: 280, minWave: 12, moneyBonus: 3.0, description: 'A supreme commander that accelerates its army, shields allies, and remotely disables your defense grid.' },
    { name: "Nexus Lord", hp: 700, speed: 0.15, reward: 115, color: "#4c1d95", icon: "🌟", isBoss: true, abilities: ['cc_immune', 'area_disable', 'shield_allies', 'teleport'], abilityCooldown: 350, minWave: 20, moneyBonus: 5.0, description: 'The master of control immunity. Teleports freely, disables towers, and shields its entire army from harm.' },
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
  // 8 BASIC TOWERS (Unlocked by default)
  // ==========================================
  'BASIC_RIFLE': {
    name: 'Auto-Rifle', cost: 50, damage: 8, range: 2.5, cooldown: 50,
    type: 'projectile', color: '#fbbf24', icon: '🔫',
    targetMode: 'ground', element: 'physical',
    description: 'Basic rapid-fire turret. Reliable single-target damage with moderate range. Perfect for early game defense.',
    projectileStyle: 'bullet',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.95, projectileSpeed: 1.05 }
  },
  'BASIC_CANNON': {
    name: 'Mortar', cost: 120, damage: 35, range: 3.5, cooldown: 120,
    type: 'area', color: '#1e293b', icon: '💣',
    targetMode: 'ground', element: 'explosive',
    description: 'Explosive area damage. Shells arc over obstacles, dealing splash damage to groups. Slow but devastating.',
    areaRadius: 1.8,
    projectileStyle: 'arc',
    upgradeStats: { damage: 1.25, range: 1.08, cooldown: 0.92, areaRadius: 1.15 }
  },
  'BASIC_SNIPER': {
    name: 'Sniper Rifle', cost: 180, damage: 120, range: 5.0, cooldown: 180,
    type: 'projectile', color: '#ef4444', icon: '🎯',
    targetMode: 'both', element: 'physical',
    description: 'Long-range precision shots. Extreme single-target damage but very slow reload. Pierces through enemies.',
    projectileStyle: 'sniper',
    upgradeStats: { damage: 1.3, range: 1.12, cooldown: 0.88, penetration: 1.2 }
  },
  'BASIC_SHOTGUN': {
    name: 'Shotgun', cost: 150, damage: 25, range: 2.0, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '💥',
    targetMode: 'ground', element: 'physical',
    description: 'Fires 5 pellets in a wide spread. Hits multiple enemies at close range. High burst damage.',
    multiTarget: 5,
    projectileStyle: 'shotgun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.93, multiTarget: 1.1 }
  },
  'BASIC_FREEZE': {
    name: 'Cryo Turret', cost: 200, damage: 15, range: 3.0, cooldown: 80,
    type: 'projectile', color: '#60a5fa', icon: '❄️',
    targetMode: 'both', element: 'ice',
    description: 'Freezing projectiles slow enemies by 50%. No damage over time, pure crowd control.',
    slowFactor: 0.5,
    projectileStyle: 'ice',
    specialAbility: 'slow',
    upgradeStats: { damage: 1.15, range: 1.1, cooldown: 0.92, slowFactor: 1.1 }
  },
  'BASIC_BURN': {
    name: 'Flamethrower', cost: 250, damage: 4, range: 1.5, cooldown: 40,
    type: 'aura', color: '#ef4444', icon: '🌋',
    targetMode: 'ground', element: 'fire',
    description: 'Passive 3x3 flame zone. Enemies passing through suffer burning damage over time.',
    burnDamage: 4,
    upgradeStats: { damage: 1.08, range: 1.04, cooldown: 0.96, burnDamage: 1.08 }
  },
  'BASIC_STUN': {
    name: 'Stun Cannon', cost: 220, damage: 40, range: 2.8, cooldown: 100,
    type: 'projectile', color: '#facc15', icon: '⚡',
    targetMode: 'both', element: 'electric',
    description: 'Electric projectiles stun enemies for 1.5 seconds. Stops enemy movement and abilities.',
    stunDuration: 90,
    projectileStyle: 'lightning',
    specialAbility: 'stun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, stunDuration: 1.15 }
  },
  'BASIC_HEAL': {
    name: 'Medic Station', cost: 300, damage: 0, range: 2.5, cooldown: 60,
    type: 'aura', color: '#10b981', icon: '💚',
    description: 'Heals nearby towers for 20 HP per tick. No damage output, pure support. Essential for tower survival.',
    upgradeStats: { range: 1.12, cooldown: 0.9, healAmount: 1.25 }
  },

  // ==========================================
  // SPECIALIZED DAMAGE TOWERS (22 more)
  // ==========================================
  
  // Multi-target & Chain
  'CHAIN_LIGHTNING': {
    name: 'Chain Lightning', cost: 400, damage: 45, range: 3.5, cooldown: 70,
    type: 'projectile', color: '#fcd34d', icon: '⚡',
    targetMode: 'both', element: 'electric',
    description: 'Lightning chains between 3-5 enemies. Each chain deals full damage. Excellent against groups.',
    projectileStyle: 'lightning',
    multiTarget: 4,
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, multiTarget: 1.1 }
  },
  'PENETRATOR': {
    name: 'Railgun', cost: 600, damage: 150, range: 4.5, cooldown: 120,
    type: 'projectile', color: '#020617', icon: '⚫',
    targetMode: 'both', element: 'physical',
    description: 'Piercing projectile travels through ALL enemies in a line. Damage decreases by 20% per enemy hit.',
    projectileStyle: 'bolt',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.9, penetration: 1.2 }
  },
  'GATLING': {
    name: 'Gatling Gun', cost: 500, damage: 4, range: 4.0, cooldown: 4,
    type: 'projectile', color: '#ec4899', icon: '⚡',
    description: 'Extremely fast attack rate (4ms cooldown). Low damage per shot but overwhelming DPS. Long range.',
    projectileSpeed: 0.3,
    projectileStyle: 'arrow_classic',
    upgradeStats: { damage: 1.15, range: 1.08, cooldown: 0.97, projectileSpeed: 1.05 }
  },
  
  // Area Damage
  'ARTILLERY': {
    name: 'Artillery', cost: 450, damage: 90, range: 6.0, cooldown: 200,
    type: 'area', color: '#475569', icon: '🎯',
    description: 'Long-range bombardment. Massive area damage (2.5 radius). Very slow but devastating.',
    areaRadius: 2.5,
    projectileStyle: 'arc',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, areaRadius: 1.1 }
  },
  'EXPLOSIVE': {
    name: 'Grenade Launcher', cost: 350, damage: 60, range: 3.0, cooldown: 100,
    type: 'area', color: '#dc2626', icon: '💥',
    description: 'Timed grenades explode on impact. 2.0 radius splash damage. Good for clustered enemies.',
    areaRadius: 2.0,
    projectileStyle: 'grenade',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.9, areaRadius: 1.12 }
  },
  
  // Beam & Continuous
  'LASER_BEAM': {
    name: 'Laser Cannon', cost: 550, damage: 12, range: 4.0, cooldown: 5,
    type: 'beam', color: '#ff5722', icon: '🔴',
    targetMode: 'both', element: 'fire',
    description: 'Continuous laser beam. Damage ramps up 0.8x per second. Burns enemies in a straight line.',
    beamRamp: 0.8,
    burnDamage: 2,
    upgradeStats: { damage: 1.1, range: 1.08, cooldown: 0.95, beamRamp: 1.1, burnDamage: 1.06 }
  },
  'INFERNO': {
    name: 'Inferno Tower', cost: 700, damage: 3, range: 3.0, cooldown: 3,
    type: 'beam', color: '#ea580c', icon: '👿',
    description: 'Extreme damage ramp (2.0x per second). Starts weak but becomes devastating. Short range.',
    beamRamp: 2.0,
    upgradeStats: { damage: 1.05, range: 1.1, cooldown: 0.98, beamRamp: 1.2 }
  },
  
  // Status Effects
  'POISON_TOWER': {
    name: 'Toxin Launcher', cost: 320, damage: 20, range: 3.0, cooldown: 60,
    type: 'projectile', color: '#14b8a6', icon: '🐍',
    targetMode: 'ground', element: 'poison',
    description: 'Poison projectiles deal 15 damage per second for 3 seconds. Stacks up to 3 times.',
    burnDamage: 15,
    projectileStyle: 'acid',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, burnDamage: 1.2 }
  },
  'SLOW_FIELD': {
    name: 'Slow Field', cost: 400, damage: 5, range: 3.5, cooldown: 15,
    type: 'aura', color: '#fef08a', icon: '🦊',
    description: 'Aura slows all enemies by 60%. Minimal damage, maximum crowd control. Large area.',
    slowFactor: 0.4,
    specialAbility: 'slow',
    upgradeStats: { damage: 1.1, range: 1.12, cooldown: 0.93, slowFactor: 1.1 }
  },
  'STUN_TOWER': {
    name: 'Stun Turret', cost: 380, damage: 30, range: 3.2, cooldown: 90,
    type: 'projectile', color: '#facc15', icon: '⚡',
    description: 'Stuns enemies for 2 seconds. Completely stops movement and abilities. Moderate damage.',
    stunDuration: 120,
    projectileStyle: 'lightning',
    specialAbility: 'stun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, stunDuration: 1.2 }
  },
  
  // Positioning & Control
  'VORTEX': {
    name: 'Vortex Launcher', cost: 500, damage: 50, range: 3.5, cooldown: 100,
    type: 'pull', color: '#1e3a8a', icon: '⚓',
    description: 'Pulls enemies 1.5 tiles closer. Repositions enemies for better targeting. Moderate damage.',
    pullStrength: 1.5,
    projectileStyle: 'vortex',
    specialAbility: 'pull',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, pullStrength: 1.15 }
  },
  'PUSHER': {
    name: 'Ice Blast', cost: 450, damage: 35, range: 2.8, cooldown: 80,
    type: 'pull', color: '#2dd4bf', icon: '🌊',
    description: 'Pushes enemies 2.0 tiles backward. Slows by 40%. Repositions enemies away from base.',
    pullStrength: -2.0,
    slowFactor: 0.6,
    projectileStyle: 'ice',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, pullStrength: 1.1, slowFactor: 1.1 }
  },
  
  // Support Towers
  'DAMAGE_BUFF': {
    name: 'Damage Amplifier', cost: 600, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#ef4444', icon: '💥',
    description: 'Aura increases nearby tower damage by 50%. No direct damage. Pure support.',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'SPEED_BUFF': {
    name: 'Speed Enhancer', cost: 550, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#fbbf24', icon: '⚡',
    description: 'Aura increases nearby tower attack speed by 30%. Reduces cooldown of all towers in range.',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'RANGE_BUFF': {
    name: 'Range Extender', cost: 500, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#3b82f6', icon: '📡',
    description: 'Aura increases nearby tower range by 25%. Extends reach of all towers in radius.',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'HEALER': {
    name: 'Repair Station', cost: 400, damage: 0, range: 2.5, cooldown: 50,
    type: 'aura', color: '#10b981', icon: '🔨',
    description: 'Heals nearby towers for 30 HP per tick. Keeps towers alive longer. Essential support.',
    upgradeStats: { range: 1.12, cooldown: 0.9, healAmount: 1.25 }
  },
  
  // Special Mechanics
  'BOOMERANG': {
    name: 'Boomerang', cost: 420, damage: 55, range: 3.0, cooldown: 50,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Projectile returns after hitting target. Can hit same enemy twice. Double damage potential.',
    projectileStyle: 'boomerang',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.92 }
  },
  'MINE_LAYER': {
    name: 'Mine Layer', cost: 500, damage: 80, range: 3.5, cooldown: 180,
    type: 'projectile', color: '#f59e0b', icon: '💣',
    description: 'Plants mines on path. Mines explode when enemies step on them. Max 3 mines. No direct attack.',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, maxMines: 1.2 }
  },
  'ORBITAL': {
    name: 'Orbital Strike', cost: 1000, damage: 300, range: 80.0, cooldown: 400,
    type: 'area', color: '#fff', icon: '🛰️',
    description: 'Strikes anywhere on map. 3.0 radius explosion. Very slow but global range.',
    areaRadius: 3.0,
    projectileStyle: 'arc',
    specialAbility: 'aoe',
    maxHp: 300,
    upgradeStats: { damage: 1.35, cooldown: 0.85, areaRadius: 1.1 }
  },
  
  // Unique Abilities
  'EXECUTIONER': {
    name: 'Executioner', cost: 800, damage: 200, range: 3.5, cooldown: 150,
    type: 'projectile', color: '#1e293b', icon: '🌾',
    description: 'Deals 3x damage to enemies below 30% HP. Executes weakened enemies instantly.',
    projectileStyle: 'void',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, executeThreshold: 1.05 }
  },
  'BANKER': {
    name: 'Money Printer', cost: 600, damage: 0, range: 0, cooldown: 300,
    type: 'farm', color: '#10b981', icon: '💰',
    description: 'Generates money over time. 50 gold per cycle. No combat ability. Pure economy.',
    upgradeStats: { moneyPerCycle: 1.2, cooldown: 0.9 }
  },
  'WEAKEN': {
    name: 'Weakening Field', cost: 450, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#fff', icon: '🔔',
    description: 'Aura reduces enemy armor by 30%. No damage, but makes enemies take more damage from other towers.',
    upgradeStats: { range: 1.12, debuffAmount: 1.1 }
  },
  'SUMMONER': {
    name: 'Drone Spawner', cost: 650, damage: 40, range: 2.5, cooldown: 120,
    type: 'summon', color: '#4c1d95', icon: '👻',
    description: 'Spawns combat drones from defeated enemies. Drones attack nearby enemies. Self-sustaining.',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, droneCount: 1.15 }
  }
};

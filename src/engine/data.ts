import type { TowerStats, OperatorClass } from './types';

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
    { name: "Bug", hp: 30, speed: 1.0, reward: 10, color: "#f87171", icon: "🐛", description: "Arrives in swarms and dies in swarms. Embarrassing to lose lives to, yet it happens." },
    { name: "Spider", hp: 25, speed: 1.3, reward: 8, color: "#dc2626", icon: "🕷️", abilities: ['camouflage'], description: "Cloaked on approach. If your towers cannot see it, they cannot stop it." },
    { name: "Mite", hp: 20, speed: 1.5, reward: 7, color: "#ef4444", icon: "🪲", description: "Tiny, fast, and infuriating. Your coverage gaps are its personal highway." },
    { name: "Fly", hp: 15, speed: 1.8, reward: 5, color: "#f97316", icon: "🦋", abilities: ['fly'], movementType: 'air', description: "Air unit. Bypasses all ground defenses. You built anti-air towers, right?" },

    // Balanced Enemies
    { name: "Glitch", hp: 80, speed: 0.7, reward: 16, color: "#c084fc", icon: "👾", description: "Erratic movement makes it hard to track. It knows this and it is smug about it." },
    { name: "Drone", hp: 75, speed: 0.8, reward: 14, color: "#a855f7", icon: "🤖", abilities: ['fly'], movementType: 'air', description: "Aerial unit that ignores ground obstacles. Terrain means nothing at altitude." },
    { name: "Hacker", hp: 85, speed: 0.65, reward: 18, color: "#9333ea", icon: "👤", abilities: ['deactivate_towers'], abilityCooldown: 300, description: "Remotely disables your towers on a cooldown. The threat you cannot see coming is always the worst one." },
    { name: "Crawler", hp: 70, speed: 0.75, reward: 13, color: "#7c3aed", icon: "🕸️", description: "Steady advance through anything. Manageable alone, dangerous in coordinated groups." },

    // Tank Enemies
    { name: "Virus", hp: 200, speed: 0.4, reward: 32, color: "#4ade80", icon: "🦠", description: "Absorbs enormous punishment before going down. Do not let it get close to the base." },
    { name: "Malware", hp: 220, speed: 0.35, reward: 36, color: "#22c55e", icon: "🪳", abilities: ['shield'], description: "A damage-absorbing shield blocks the first burst. Break the shield or waste your ammunition." },
    { name: "Tank", hp: 250, speed: 0.3, reward: 39, color: "#16a34a", icon: "🛡️", abilities: ['damage_reflect'], description: "Reflects a portion of every hit back at attackers. High-damage towers can literally hurt themselves here." },
    { name: "Brute", hp: 300, speed: 0.25, reward: 45, color: "#15803d", icon: "💪", abilities: ['regenerate'], description: "Regenerates health continuously while marching. Only sustained burst fire can outpace its recovery." },
    { name: "Guardian", hp: 350, speed: 0.2, reward: 52, color: "#166534", icon: "🛡️", abilities: ['shield', 'heal_allies'], abilityCooldown: 200, description: "Shields itself and heals nearby allies mid-battle. Kill it first to unravel the whole formation." },

    // Fast Enemies
    { name: "Worm", hp: 60, speed: 1.2, reward: 13, color: "#f472b6", icon: "🪱", description: "Fast for its size. Loves neglected corridors and exposed flanks." },
    { name: "Snake", hp: 55, speed: 1.4, reward: 12, color: "#ec4899", icon: "🐍", abilities: ['poison_aura'], description: "Toxic aura corrodes nearby tower systems over time. Keep concentrated fire on it." },
    { name: "Swift", hp: 50, speed: 1.6, reward: 10, color: "#db2777", icon: "⚡", abilities: ['charge'], description: "Charge ability launches it forward in a burst of speed. Blink and it has cleared your kill zone." },
    { name: "Ghost", hp: 45, speed: 1.5, reward: 9, color: "#be185d", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 400, description: "Vanishes and teleports mid-path. Your towers lose target lock between volleys." },

    // Special Ability Enemies
    { name: "Teleporter", hp: 100, speed: 0.6, reward: 20, color: "#6366f1", icon: "🌀", abilities: ['teleport'], abilityCooldown: 250, description: "Skips large sections of the path. Always assume it is farther ahead than you think." },
    { name: "Healer", hp: 90, speed: 0.65, reward: 18, color: "#8b5cf6", icon: "💚", abilities: ['heal_allies'], abilityCooldown: 150, description: "Continuously restores allies as they advance. Eliminate the healer before anything else." },
    { name: "Saboteur", hp: 120, speed: 0.5, reward: 23, color: "#ef4444", icon: "🔧", abilities: ['deactivate_towers'], abilityCooldown: 300, description: "Shuts down adjacent towers on contact. Your defenses go dark wherever it walks." },
    { name: "Summoner", hp: 150, speed: 0.45, reward: 26, color: "#a855f7", icon: "🔮", abilities: ['spawn_minions'], abilityCooldown: 500, description: "Spawns minions mid-march. Fight the original or drown in the copies. Your choice." },
    { name: "Berserker", hp: 180, speed: 0.8, reward: 29, color: "#dc2626", icon: "😡", abilities: ['berserk'], description: "Moves faster the more damage it takes. The worst time to stop shooting is when it starts to rage." },
    { name: "Freezer", hp: 110, speed: 0.55, reward: 21, color: "#06b6d4", icon: "❄️", abilities: ['freeze_aura'], description: "Slows nearby tower attack speed with a frost aura. Groups of these will grind your defense to a halt." },
    { name: "Bomber", hp: 70, speed: 0.7, reward: 16, color: "#f59e0b", icon: "💣", abilities: ['explode'], description: "Detonates on death in a tower-damaging explosion. Choose your kill zone carefully." },
    { name: "Splitter", hp: 130, speed: 0.5, reward: 25, color: "#10b981", icon: "🔀", abilities: ['split'], description: "Splits into two upon death. Eliminate the halves immediately or watch the numbers multiply." },
    { name: "Burrower", hp: 95, speed: 0.6, reward: 18, color: "#78716c", icon: "🕳️", abilities: ['burrow'], description: "Digs underground to dodge all tower fire, then re-emerges closer to your base." },
    { name: "Retreater", hp: 85, speed: 1.0, reward: 15, color: "#64748b", icon: "🏃", abilities: ['retreat'], description: "Sprints back toward spawn when critically wounded. Forces extra shots and wastes your time." },
    { name: "Stunner", hp: 105, speed: 0.58, reward: 20, color: "#facc15", icon: "⚡", abilities: ['stun_attack'], abilityCooldown: 350, description: "Unleashes electric pulses that stun nearby towers mid-volley. Times its bursts to maximize disruption." },

    // Boss-like Enemies (Higher HP) - Rewards reduced by ~35%
    { name: "Trojan", hp: 400, speed: 0.3, reward: 65, color: "#fbbf24", icon: "🐴", description: "High-health infiltrator disguised as harmless cargo. By the time you recognize it, it is already inside." },
    { name: "Titan", hp: 500, speed: 0.25, reward: 78, color: "#f59e0b", icon: "👹", isBoss: true, abilities: ['shield', 'charge'], description: "Armored giant with a shield and a charge attack. Bring your heaviest firepower." },
    { name: "Behemoth", hp: 600, speed: 0.2, reward: 91, color: "#dc2626", icon: "👺", isBoss: true, abilities: ['regenerate', 'berserk'], description: "Regenerates and accelerates as its health drops. The more you wound it, the more dangerous it becomes." },
    { name: "Warlord", hp: 450, speed: 0.28, reward: 72, color: "#7c2d12", icon: "⚔️", isBoss: true, abilities: ['damage_reflect', 'heal_allies'], abilityCooldown: 200, description: "Reflects incoming damage and heals surrounding units. Legends say it has never lost a siege." },

    // Advanced Enemies
    { name: "Necromancer", hp: 320, speed: 0.35, reward: 55, color: "#581c87", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 400, description: "Raises fallen enemies as undead and heals the living. Shut it down before the horde snowballs." },
    { name: "Phantom", hp: 140, speed: 0.9, reward: 27, color: "#1e293b", icon: "👻", abilities: ['invisible', 'teleport'], abilityCooldown: 300, description: "Flickers between visible and invisible, teleports through volleys. Nearly impossible to pin down." },
    { name: "Archmage", hp: 280, speed: 0.4, reward: 49, color: "#3b82f6", icon: "🧙", abilities: ['deactivate_towers', 'poison_aura'], abilityCooldown: 350, description: "Combines tower-disabling magic with a lingering poison cloud. One of the deadliest single targets you will face." },
    { name: "Golem", hp: 550, speed: 0.15, reward: 85, color: "#78716c", icon: "🗿", isBoss: true, abilities: ['shield', 'damage_reflect'], moneyBonus: 3.0, description: "Regenerates, reflects damage, and hides behind an energy shield. Magic fire is the only real answer." },
    { name: "Dragon", hp: 700, speed: 0.18, reward: 104, color: "#dc2626", icon: "🐉", isBoss: true, abilities: ['fly', 'poison_aura', 'charge'], movementType: 'air', immunities: ['fire'], moneyBonus: 3.0, description: "Flies over terrain, poisons everything below, charges at low health. A living catastrophe." },
    { name: "Kraken", hp: 650, speed: 0.22, reward: 98, color: "#0ea5e9", icon: "🐙", isBoss: true, abilities: ['split', 'freeze_aura'], moneyBonus: 3.0, description: "Splits into smaller beasts and freezes every tower in its icy wake. Destroy all parts simultaneously." },
    { name: "Hydra", hp: 580, speed: 0.26, reward: 88, color: "#10b981", icon: "🐲", isBoss: true, abilities: ['split', 'regenerate'], moneyBonus: 3.0, description: "Two heads grow back for every one you cut down. Kill all fragments at once or it never ends." },
    { name: "Colossus", hp: 800, speed: 0.12, reward: 117, color: "#475569", icon: "🗽", isBoss: true, abilities: ['shield', 'stun_attack', 'heal_allies'], abilityCooldown: 250, moneyBonus: 3.5, description: "Shields itself, stuns attackers, and heals on the move. The largest threat ever deployed." },
    { name: "Tyrant", hp: 750, speed: 0.16, reward: 111, color: "#991b1b", icon: "👑", isBoss: true, abilities: ['berserk', 'damage_reflect', 'charge'], moneyBonus: 3.5, description: "Reflects all strikes and rages uncontrollably at low health. Dangerous from the first step to the last." },
    { name: "Demon", hp: 680, speed: 0.2, reward: 101, color: "#7c2d12", icon: "😈", isBoss: true, abilities: ['teleport', 'poison_aura', 'explode'], moneyBonus: 3.0, description: "Teleports across the battlefield, poisons the ground, and explodes violently on death. Hell given form." },

    // Elite Enemies
    { name: "Assassin", hp: 160, speed: 1.1, reward: 31, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 400, description: "Invisible, teleporting, tower-stunning, and extremely fast. If you can see it, you are already behind." },
    { name: "Paladin", hp: 420, speed: 0.32, reward: 68, color: "#fbbf24", icon: "⚔️", abilities: ['shield', 'heal_allies'], abilityCooldown: 180, description: "Unbreakable shield and ally healing on a short cooldown. Kill the healer first. Always." },
    { name: "Vampire", hp: 380, speed: 0.38, reward: 62, color: "#be123c", icon: "🧛", abilities: ['regenerate', 'teleport'], abilityCooldown: 320, description: "Regenerates and teleports away when cornered. Persistent and nearly impossible to permanently eliminate." },
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
    { name: "Siege Engine", hp: 450, speed: 0.2, reward: 72, color: "#78716c", icon: "⚙️", abilities: ['attack_towers', 'shield'], abilityCooldown: 300, minWave: 8, description: "Armored war machine that demolishes towers on contact. Built for one purpose. It is very good at that purpose." },
    { name: "Corruptor", hp: 220, speed: 0.5, reward: 36, color: "#7c3aed", icon: "💜", abilities: ['slow_towers', 'poison_aura'], abilityCooldown: 250, minWave: 5, description: "Infects towers with a digital plague that degrades firing rate. Its signal lingers long after it passes." },
    { name: "Frost Wraith", hp: 190, speed: 0.6, reward: 31, color: "#06b6d4", icon: "🧊", abilities: ['freeze_aura', 'invisible'], immunities: ['ice'], abilityCooldown: 350, minWave: 6, description: "Invisible ice specter that slows every nearby tower's attack speed to nothing. You cannot shoot what you cannot see." },
    { name: "Plague Bearer", hp: 160, speed: 0.7, reward: 26, color: "#14b8a6", icon: "🦠", abilities: ['poison_aura', 'spawn_minions'], abilityCooldown: 400, minWave: 4, description: "Spawns additional enemies as it marches forward. Two threats in one revolting package." },
    { name: "Shock Trooper", hp: 140, speed: 0.9, reward: 23, color: "#facc15", icon: "⚡", abilities: ['stun_attack', 'charge'], abilityCooldown: 280, minWave: 3, description: "Dashes forward and unleashes a stun burst. Fast, aggressive, and always strikes first." },
    { name: "Armored Crawler", hp: 380, speed: 0.25, reward: 62, color: "#475569", icon: "🦂", abilities: ['shield', 'damage_reflect'], minWave: 7, description: "Titanium plating reflects all incoming damage. Only sustained, concentrated fire wears it down." },
    { name: "Void Walker", hp: 200, speed: 0.55, reward: 33, color: "#1e293b", icon: "🌌", abilities: ['teleport', 'invisible'], abilityCooldown: 320, minWave: 5, description: "Teleports and turns invisible. Only area-of-effect towers can reliably catch it." },
    { name: "Crystal Golem", hp: 420, speed: 0.22, reward: 68, color: "#a78bfa", icon: "💎", abilities: ['shield', 'damage_reflect', 'regenerate'], immunities: ['arcane'], minWave: 9, description: "Regenerates, reflects damage, and projects an energy shield. Magic damage is your only option." },
    { name: "Shadow Assassin", hp: 120, speed: 1.0, reward: 20, color: "#111827", icon: "🗡️", abilities: ['invisible', 'teleport', 'stun_attack'], abilityCooldown: 380, minWave: 4, description: "Invisible by default, teleports to dodge shots, stuns towers on arrival. Priority target." },
    { name: "Molten Core", hp: 500, speed: 0.18, reward: 81, color: "#ea580c", icon: "🌋", abilities: ['explode', 'poison_aura', 'regenerate'], immunities: ['fire'], minWave: 10, description: "Poisons its surroundings, slowly heals itself, and erupts violently on death. Do not let it reach the base." },
    { name: "Storm Caller", hp: 280, speed: 0.45, reward: 46, color: "#3b82f6", icon: "⛈️", abilities: ['stun_attack', 'deactivate_towers'], abilityCooldown: 300, minWave: 6, description: "Summons lightning that stuns your towers and cascades electrical failures across your grid." },
    { name: "Bone Collector", hp: 320, speed: 0.35, reward: 52, color: "#f3f4f6", icon: "💀", abilities: ['spawn_minions', 'heal_allies'], abilityCooldown: 450, minWave: 7, description: "Raises skeletal minions from fallen enemies. Defeat it before the army becomes unmanageable." },
    { name: "Toxic Spitter", hp: 150, speed: 0.8, reward: 25, color: "#10b981", icon: "🐍", abilities: ['poison_aura', 'split'], immunities: ['poison'], abilityCooldown: 350, minWave: 4, description: "Sprays venom pools that split into more threats on death. One becomes many in seconds." },
    { name: "Frost Giant", hp: 550, speed: 0.15, reward: 91, color: "#bfdbfe", icon: "🧊", isBoss: true, abilities: ['freeze_aura', 'shield', 'stun_attack'], abilityCooldown: 280, minWave: 12, moneyBonus: 3.0, description: "A colossal glacier that freezes towers, absorbs damage, and stuns with each step." },
    { name: "Chaos Spawn", hp: 240, speed: 0.5, reward: 39, color: "#dc2626", icon: "🌀", abilities: ['teleport', 'split', 'berserk'], abilityCooldown: 400, minWave: 6, description: "Teleports randomly, shatters into fragments on death, and rages violently at low health." },
    { name: "Iron Maiden", hp: 400, speed: 0.18, reward: 65, color: "#64748b", icon: "⚔️", abilities: ['attack_towers', 'damage_reflect'], abilityCooldown: 250, minWave: 8, description: "Destroys towers on contact and returns every hit as lethal reflected damage." },
    { name: "Necrotic Plague", hp: 180, speed: 0.65, reward: 29, color: "#7c2d12", icon: "🦠", abilities: ['poison_aura', 'regenerate', 'spawn_minions'], abilityCooldown: 500, minWave: 5, description: "Regenerates endlessly, spawns units from the rot it leaves behind, and poisons the path ahead." },
    { name: "Void Reaper", hp: 350, speed: 0.3, reward: 57, color: "#000000", icon: "🌑", abilities: ['invisible', 'teleport', 'damage_reflect'], abilityCooldown: 360, minWave: 8, description: "Appears from nowhere, reflects all damage, then vanishes before towers can reacquire it." },
    { name: "Titanium Behemoth", hp: 650, speed: 0.08, reward: 107, color: "#94a3b8", icon: "🗿", isBoss: true, abilities: ['attack_towers', 'shield', 'damage_reflect', 'regenerate'], abilityCooldown: 200, minWave: 15, moneyBonus: 4.0, description: "Destroys towers on contact, shields all damage, reflects every hit, and endlessly regenerates. Good luck." },

    // ==========================================
    // NEW ENEMIES WITH SPECIAL ABILITIES (v2)
    // ==========================================
    // CC Immune enemies - cannot be slowed, frozen, or stunned
    { name: "Juggernaut", hp: 480, speed: 0.35, reward: 78, color: "#374151", icon: "🦾", abilities: ['cc_immune', 'charge'], minWave: 10, description: 'Immune to all crowd control. Your slow fields and stun cannons do absolutely nothing to this one.' },
    { name: "Unstoppable Force", hp: 600, speed: 0.28, reward: 98, color: "#1f2937", icon: "💪", isBoss: true, abilities: ['cc_immune', 'berserk', 'regenerate'], minWave: 15, moneyBonus: 3.5, description: 'CC immune, regenerating, and raging harder as it takes damage. Concentrated burst fire only.' },
    { name: "Phase Shifter", hp: 200, speed: 0.8, reward: 33, color: "#8b5cf6", icon: "🔮", abilities: ['cc_immune', 'teleport', 'invisible'], abilityCooldown: 300, minWave: 8, description: 'Phases through every crowd-control effect. Teleports and vanishes at will. Good luck.' },

    // Area Disable enemies - disable towers in 2x2 area
    { name: "EMP Drone", hp: 150, speed: 0.6, reward: 25, color: "#3b82f6", icon: "📡", abilities: ['area_disable', 'fly'], movementType: 'air', immunities: ['electric'], abilityCooldown: 400, minWave: 6, description: 'Aerial EMP unit that disables all towers in a wide radius on a cooldown. Air defenses required.' },
    { name: "Pulse Bomber", hp: 280, speed: 0.4, reward: 46, color: "#6366f1", icon: "💫", abilities: ['area_disable', 'explode'], abilityCooldown: 500, minWave: 9, description: 'Disables nearby towers with an EMP pulse, then detonates in a catastrophic explosion.' },

    // Speed Aura enemies - speed up nearby allies
    { name: "War Drummer", hp: 180, speed: 0.5, reward: 29, color: "#f59e0b", icon: "🥁", abilities: ['speed_aura', 'berserk'], abilityCooldown: 200, minWave: 5, description: 'Beats a war rhythm that accelerates every nearby ally. Kill the drummer before the horde sprints.' },
    { name: "Rally Banner", hp: 220, speed: 0.35, reward: 36, color: "#fbbf24", icon: "🚩", abilities: ['speed_aura', 'heal_allies'], abilityCooldown: 250, minWave: 7, description: 'Speeds up allies and heals the wounded while marching. The march never slows as long as it lives.' },

    // Shield Allies enemies - give shield to nearby allies
    { name: "Guardian Angel", hp: 200, speed: 0.45, reward: 33, color: "#60a5fa", icon: "👼", abilities: ['shield_allies', 'fly', 'heal_allies'], abilityCooldown: 350, minWave: 6, description: 'Flies above the formation, projecting shields and healing the most wounded nearby.' },
    { name: "Fortress", hp: 400, speed: 0.2, reward: 65, color: "#475569", icon: "🏰", abilities: ['shield_allies', 'shield', 'damage_reflect'], abilityCooldown: 400, minWave: 10, description: 'A mobile wall that shields allies, protects itself, and reflects all incoming damage.' },

    // Combined special abilities
    { name: "Warlord Commander", hp: 350, speed: 0.38, reward: 57, color: "#dc2626", icon: "👑", isBoss: true, abilities: ['speed_aura', 'shield_allies', 'deactivate_towers'], abilityCooldown: 280, minWave: 12, moneyBonus: 3.0, description: 'Accelerates its army, shields allies, and remotely disables your entire defense grid.' },
    { name: "Nexus Lord", hp: 700, speed: 0.15, reward: 115, color: "#4c1d95", icon: "🌟", isBoss: true, abilities: ['cc_immune', 'area_disable', 'shield_allies', 'teleport'], abilityCooldown: 350, minWave: 20, moneyBonus: 5.0, description: 'Teleports freely, disables towers, and shields its army. The final boss of coordination.' },
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
    description: 'Reliable rapid-fire tower. Not flashy, not special — just always there when you need it most.',
    nameZh: '速射砲台',
    descriptionZh: '基礎速射型砲台，子彈如傾盆大雨。可靠耐用，是每位指揮官的初始依靠。雖單次傷害不高，但持續輸出驚人，任何波次的第一道防線。',
    quote: '「彈雨不停，敵人休想通過！」',
    projectileStyle: 'bullet',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.95, projectileSpeed: 1.05 }
  },
  'BASIC_CANNON': {
    name: 'Mortar', cost: 120, damage: 35, range: 3.5, cooldown: 120,
    type: 'area', color: '#1e293b', icon: '💣',
    targetMode: 'ground', element: 'explosive',
    description: 'Lobs explosive shells in a high arc. Clustered enemies deeply regret standing so close together.',
    nameZh: '迫擊砲台',
    descriptionZh: '拋物線砲擊，彈著範圍內的敵人無一倖免。裝填雖慢，但一旦命中，威力震天撼地。敵人密集時最為致命。',
    quote: '「轟！爆！散！一切都是灰燼！」',
    areaRadius: 1.8,
    projectileStyle: 'arc',
    upgradeStats: { damage: 1.25, range: 1.08, cooldown: 0.92, areaRadius: 1.15 }
  },
  'BASIC_SNIPER': {
    name: 'Sniper Rifle', cost: 180, damage: 120, range: 5.0, cooldown: 180,
    type: 'projectile', color: '#ef4444', icon: '🎯',
    targetMode: 'both', element: 'physical',
    description: 'Extreme range, devastating single shots. Enemies never see it coming — and then they don\'t see anything.',
    nameZh: '狙擊砲台',
    descriptionZh: '千里之外取敵首級。超遠射程加上恐怖的單次傷害，空中地面目標皆可精準狙擊。裝填甚慢，但一彈就是大傷。',
    quote: '「一彈定乾坤。」',
    projectileStyle: 'sniper',
    upgradeStats: { damage: 1.3, range: 1.12, cooldown: 0.88, penetration: 1.2 }
  },
  'BASIC_SHOTGUN': {
    name: 'Shotgun', cost: 150, damage: 25, range: 2.0, cooldown: 90,
    type: 'spread', color: '#d97706', icon: '💥',
    targetMode: 'ground', element: 'physical',
    description: 'Five pellets per blast at close range. Enemies that clump together die together.',
    nameZh: '霰彈砲台',
    descriptionZh: '一槍五彈，近距離爆炸式全面覆蓋。對成群聚集的敵人有奇效，子彈散布廣泛，讓每個角落都充滿彈孔。',
    quote: '「就是要把你們全打散！」',
    multiTarget: 5,
    projectileStyle: 'shotgun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.93, multiTarget: 1.1 }
  },
  'BASIC_FREEZE': {
    name: 'Cryo Turret', cost: 200, damage: 15, range: 3.0, cooldown: 80,
    type: 'projectile', color: '#60a5fa', icon: '❄️',
    targetMode: 'both', element: 'ice',
    description: 'Chills enemies to half speed on impact. No damage, pure crowd control — your other towers thank you.',
    nameZh: '冰凍砲台',
    descriptionZh: '發射冰晶彈，命中即凍。敵人速度瞬間降至一半，讓其他砲台輕鬆補刀。空地通殺，是絕佳的輔助型砲台。',
    quote: '「凍結一切，讓時間為我服務。」',
    slowFactor: 0.5,
    projectileStyle: 'ice',
    specialAbility: 'slow',
    upgradeStats: { damage: 1.15, range: 1.1, cooldown: 0.92, slowFactor: 1.1 }
  },
  'BASIC_BURN': {
    name: 'Flamethrower', cost: 250, damage: 4, range: 1.5, cooldown: 40,
    type: 'aura', color: '#ef4444', icon: '🌋',
    targetMode: 'ground', element: 'fire',
    description: 'Maintains a permanent 3x3 fire zone. Place at path chokepoints and watch them walk straight into it.',
    nameZh: '火焰域塔',
    descriptionZh: '在周圍建立持續燃燒的火焰地帶，所有踏入範圍的敵人都將持續受到灼燒傷害。放置在路徑關鍵節點上，威力倍增。',
    quote: '「大地在我腳下燃燒！」',
    burnDamage: 4,
    upgradeStats: { damage: 1.08, range: 1.04, cooldown: 0.96, burnDamage: 1.08 }
  },
  'BASIC_STUN': {
    name: 'Stun Cannon', cost: 220, damage: 40, range: 2.8, cooldown: 100,
    type: 'projectile', color: '#facc15', icon: '⚡',
    targetMode: 'both', element: 'electric',
    description: 'High-voltage bursts paralyze enemies mid-step for 1.5 seconds. Bosses are not immune. They wish they were.',
    nameZh: '電擊砲台',
    descriptionZh: '電流炮彈命中後使敵人完全癱瘓長達1.5秒，技能同步停用。電弧穿透效果驚人，BOSS也難逃一擊。',
    quote: '「噼啪作響，雷霆萬鈞！」',
    stunDuration: 90,
    projectileStyle: 'lightning',
    specialAbility: 'stun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, stunDuration: 1.15 }
  },
  'BASIC_HEAL': {
    name: 'Medic Station', cost: 300, damage: 0, range: 2.5, cooldown: 60,
    type: 'aura', color: '#10b981', icon: '💚',
    description: 'Zero damage. Quietly heals every nearby tower. The most important tower nobody builds until it is too late.',
    nameZh: '修復醫療站',
    descriptionZh: '默默守護身旁砲台，持續為範圍內所有友方砲台恢復耐久。雖無攻擊能力，卻是讓陣線屹立不倒的關鍵支柱。',
    quote: '「我治癒，你殺敵，相輔相成！」',
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
    description: 'Lightning chains through 3-5 enemies dealing full damage each hop. Pack them tightly. Watch the fireworks.',
    nameZh: '鏈式閃電',
    descriptionZh: '閃電在3至5個敵人之間跳躍傳遞，每次跳躍皆造成全額傷害。敵人越密集效果越恐怖，是對付密集波次的惡夢。',
    quote: '「電一個，劈一串！」',
    projectileStyle: 'lightning',
    multiTarget: 4,
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, multiTarget: 1.1 }
  },
  'PENETRATOR': {
    name: 'Railgun', cost: 600, damage: 150, range: 4.5, cooldown: 120,
    type: 'projectile', color: '#020617', icon: '⚫',
    targetMode: 'both', element: 'physical',
    description: 'One slug travels through every enemy in a straight line. Whatever was in the way is no longer in the way.',
    nameZh: '磁軌炮',
    descriptionZh: '磁軌加速的穿甲彈，以接近光速貫穿整排敵人。每穿過一個目標傷害微降，但面對縱向排列的敵人是災難性的存在。',
    quote: '「任何防禦，在我面前都是紙。」',
    projectileStyle: 'bolt',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.9, penetration: 1.2 }
  },
  'GATLING': {
    name: 'Gatling Gun', cost: 500, damage: 4, range: 4.0, cooldown: 4,
    type: 'projectile', color: '#ec4899', icon: '⚡',
    description: 'Fires 250 rounds per second. The enemy has no time to regenerate, heal, or reconsider their life choices.',
    nameZh: '加特林機槍',
    descriptionZh: '每4毫秒發射一顆子彈，持續不間斷的彈幕讓敵人永無喘息。單次傷害低，但累積DPS令人震驚，射程廣闊無比。',
    quote: '「打！打！打！永遠不停地打！」',
    projectileSpeed: 0.3,
    projectileStyle: 'arrow_classic',
    upgradeStats: { damage: 1.15, range: 1.08, cooldown: 0.97, projectileSpeed: 1.05 }
  },
  
  // Area Damage
  'ARTILLERY': {
    name: 'Artillery', cost: 450, damage: 90, range: 6.0, cooldown: 200,
    type: 'area', color: '#475569', icon: '🎯',
    description: 'Long-range bombardment with a massive blast radius. Half the map is always within its kill zone.',
    nameZh: '重型榴彈砲',
    descriptionZh: '超遠射程的重型炮擊，爆炸半徑達2.5格，地圖幾乎無死角覆蓋。裝填緩慢，但每次落點皆帶來大面積毀滅性打擊。',
    quote: '「炮聲響起，大地震顫！」',
    areaRadius: 2.5,
    projectileStyle: 'arc',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, areaRadius: 1.1 }
  },
  'EXPLOSIVE': {
    name: 'Grenade Launcher', cost: 350, damage: 60, range: 3.0, cooldown: 100,
    type: 'area', color: '#dc2626', icon: '💥',
    description: 'Bouncing grenades with 2-tile splash. Dense enemy formations are its favorite meal.',
    nameZh: '手榴彈發射器',
    descriptionZh: '拋射延時手榴彈，落地後爆炸。2格爆炸半徑對密集敵群有奇效，連環爆炸時讓敵方陣型瞬間潰散。',
    quote: '「轟炸吧！讓他們在烈焰中消散！」',
    areaRadius: 2.0,
    projectileStyle: 'grenade',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.9, areaRadius: 1.12 }
  },
  
  // Beam & Continuous
  'LASER_BEAM': {
    name: 'Laser Cannon', cost: 550, damage: 12, range: 4.0, cooldown: 5,
    type: 'beam', color: '#ff5722', icon: '🔴',
    targetMode: 'both', element: 'fire',
    description: 'Continuous beam that ramps up over time. Starts weak. Give it three seconds. You will see.',
    nameZh: '鐳射炮',
    descriptionZh: '持續照射的高能鐳射，傷害隨時間指數級增長。開始時微弱，持續聚焦後威力爆炸，灼燒效果讓敵人持續受損。',
    quote: '「光是最鋒利的刀！」',
    beamRamp: 0.8,
    burnDamage: 2,
    upgradeStats: { damage: 1.1, range: 1.08, cooldown: 0.95, beamRamp: 1.1, burnDamage: 1.06 }
  },
  'INFERNO': {
    name: 'Inferno Tower', cost: 700, damage: 3, range: 3.0, cooldown: 3,
    type: 'beam', color: '#ea580c', icon: '👿',
    description: 'Damage doubles every second it stays locked on. Your enemies only make this mistake once.',
    nameZh: '地獄業火塔',
    descriptionZh: '末日熔爐化身砲台，傷害倍增速率高達每秒2倍。初期看似無害，鎖定後卻化為吞噬萬物的業火。近距離無法阻擋。',
    quote: '「讓地獄的烈火將汝吞噬！」',
    beamRamp: 2.0,
    upgradeStats: { damage: 1.05, range: 1.1, cooldown: 0.98, beamRamp: 1.2 }
  },
  
  // Status Effects
  'POISON_TOWER': {
    name: 'Toxin Launcher', cost: 320, damage: 20, range: 3.0, cooldown: 60,
    type: 'projectile', color: '#14b8a6', icon: '🐍',
    targetMode: 'ground', element: 'poison',
    description: 'Applies stacking poison that eats through even the toughest targets. Slow. Inevitable. Unstoppable.',
    nameZh: '毒素發射器',
    descriptionZh: '毒液彈命中後持續侵蝕，每秒造成15點毒傷，疊加上限三層。對高血量目標緩慢磨耗，毒素一旦附體，不死不休。',
    quote: '「毒液入骨，無藥可解。」',
    burnDamage: 15,
    projectileStyle: 'acid',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, burnDamage: 1.2 }
  },
  'SLOW_FIELD': {
    name: 'Slow Field', cost: 400, damage: 5, range: 3.5, cooldown: 15,
    type: 'aura', color: '#fef08a', icon: '🦊',
    description: 'Aura that drags everything in range to a crawl. A gravity well of misery for all who enter.',
    nameZh: '緩速磁場塔',
    descriptionZh: '在寬廣範圍內建立減速磁場，所有敵人速度降至原本40%。傷害雖低，但能為友軍砲台提供充裕的攻擊視窗，戰術核心。',
    quote: '「慢下來，讓我的戰友好好款待你！」',
    slowFactor: 0.4,
    specialAbility: 'slow',
    upgradeStats: { damage: 1.1, range: 1.12, cooldown: 0.93, slowFactor: 1.1 }
  },
  'STUN_TOWER': {
    name: 'Stun Turret', cost: 380, damage: 30, range: 3.2, cooldown: 90,
    type: 'projectile', color: '#facc15', icon: '⚡',
    description: 'Short-range area stun every 3 seconds. Highly effective in choke points. Highly annoying to walk through.',
    nameZh: '電磁癱瘓塔',
    descriptionZh: '發射高強度電磁波，命中後令敵人完全靜止長達2秒，技能同步封鎖。敵人能力越強，越怕這一招的完全壓制。',
    quote: '「動！你給我動一動！動不了了吧！」',
    stunDuration: 120,
    projectileStyle: 'lightning',
    specialAbility: 'stun',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, stunDuration: 1.2 }
  },
  
  // Positioning & Control
  'VORTEX': {
    name: 'Vortex Launcher', cost: 500, damage: 50, range: 3.5, cooldown: 100,
    type: 'pull', color: '#1e3a8a', icon: '⚓',
    description: 'Pulls enemies toward its center while dealing damage. Your firing lanes love this tower. Enemies hate it.',
    nameZh: '漩渦牽引炮',
    descriptionZh: '發射重力漩渦彈，命中後將敵人強制向砲台方向牽引1.5格。巧妙搭配其他砲台的射程，讓敵人永遠在交火圈內。',
    quote: '「過來，到我的射程裡來！」',
    pullStrength: 1.5,
    projectileStyle: 'vortex',
    specialAbility: 'pull',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, pullStrength: 1.15 }
  },
  'PUSHER': {
    name: 'Ice Blast', cost: 450, damage: 35, range: 2.8, cooldown: 80,
    type: 'pull', color: '#2dd4bf', icon: '🌊',
    description: 'Fires a pressure blast that shoves enemies backward. Teleporters will not save you from physics.',
    nameZh: '冰爆後推炮',
    descriptionZh: '強力冰爆衝擊將敵人向後推開2格並附帶減速效果。能將突破防線的敵人強行推回，為後方防禦爭取寶貴時間。',
    quote: '「退！退回去！你到底從哪裡來的！」',
    pullStrength: -2.0,
    slowFactor: 0.6,
    projectileStyle: 'ice',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.92, pullStrength: 1.1, slowFactor: 1.1 }
  },
  
  // Support Towers
  'DAMAGE_BUFF': {
    name: 'Damage Amplifier', cost: 600, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#ef4444', icon: '💥',
    description: 'Amplifies nearby tower attack damage by 50%. Has no ego despite being responsible for most of the carnage.',
    nameZh: '傷害增幅光環',
    descriptionZh: '釋放增幅光環，範圍內所有砲台傷害提升50%。本身不具攻擊力，但一旦部署在高密度火力區，整個陣線的殺傷力翻天覆地。',
    quote: '「有我在，大家都能打得更猛！」',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'SPEED_BUFF': {
    name: 'Speed Enhancer', cost: 550, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#fbbf24', icon: '⚡',
    description: 'Accelerates nearby tower fire rate by 40%. Makes your slow towers feel fast and your fast towers feel terrifying.',
    nameZh: '攻速加速光環',
    descriptionZh: '釋放時間加速光環，縮短範圍內所有砲台30%的射擊冷卻時間。配合快速砲台，可達到讓敵人應接不暇的彈幕密度。',
    quote: '「快！快！快！射速是生存之道！」',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'RANGE_BUFF': {
    name: 'Range Extender', cost: 500, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#3b82f6', icon: '📡',
    description: 'Extends nearby tower range by 35%. Coverage gaps are this tower\'s personal enemy.',
    nameZh: '射程延伸光環',
    descriptionZh: '信號放大光環延伸範圍內所有砲台25%的攻擊射程。讓後排狙擊手能提前開火，讓近距塔化身中程主力。',
    quote: '「夠遠嗎？有我在，還要更遠！」',
    upgradeStats: { range: 1.12, buffAmount: 1.1 }
  },
  'HEALER': {
    name: 'Repair Station', cost: 400, damage: 0, range: 2.5, cooldown: 50,
    type: 'aura', color: '#10b981', icon: '🔨',
    description: 'Continuously repairs nearby towers. The silent hero of every defense that survives late game.',
    nameZh: '強力修復站',
    descriptionZh: '隨時為附近砲台提供每回合30HP的高速修復，戰場持久力遠超普通醫療站。有它在，最前線陣地堅不可摧。',
    quote: '「只要我在，你們就能繼續戰鬥！」',
    upgradeStats: { range: 1.12, cooldown: 0.9, healAmount: 1.25 }
  },
  
  // Special Mechanics
  'BOOMERANG': {
    name: 'Boomerang', cost: 420, damage: 55, range: 3.0, cooldown: 50,
    type: 'projectile', color: '#f0abfc', icon: '🪃',
    description: 'Spinning boomerang pierces through entire rows of enemies on the way out and back. Two passes, one shot.',
    nameZh: '迴旋鏢砲台',
    descriptionZh: '投擲可回收的迴旋鏢，去程打一次，回程再打一次，同一目標可受到雙倍傷害。出奇不意的攻擊路徑讓敵人防不勝防。',
    quote: '「走，要打你；回，還是打你！」',
    projectileStyle: 'boomerang',
    upgradeStats: { damage: 1.25, range: 1.1, cooldown: 0.92 }
  },
  'MINE_LAYER': {
    name: 'Mine Layer', cost: 500, damage: 80, range: 3.5, cooldown: 180,
    type: 'projectile', color: '#f59e0b', icon: '💣',
    description: 'Drops proximity mines that explode on contact. Enemies never hear the beep. Until they do.',
    nameZh: '地雷佈設者',
    descriptionZh: '在敵人路徑上悄悄埋設致命地雷，踩中立即爆炸，傷害驚人。最多同時維持3顆地雷，是最被動卻最致命的伏擊手。',
    quote: '「嘿嘿，你踩到了！」',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, maxMines: 1.2 }
  },
  'ORBITAL': {
    name: 'Orbital Strike', cost: 1000, damage: 300, range: 80.0, cooldown: 400,
    type: 'area', color: '#fff', icon: '🛰️',
    description: 'Calls in orbital strikes from orbit. The enemy cannot dodge what they cannot see coming from space.',
    nameZh: '軌道離子炮',
    descriptionZh: '從太空軌道鎖定任意位置，發動毀滅性的離子炮轟擊，波及半徑達3格。冷卻漫長，但這一擊足以決定戰場勝負。',
    quote: '「來自星辰之力，降臨你們之間！」',
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
    description: 'Deals triple damage to any target below 30% health. It does not finish fights. It ends them.',
    nameZh: '處刑者',
    descriptionZh: '專門獵殺殘血敵人的終結者。對生命值低於30%的敵人造成三倍傷害，或直接秒殺。別讓任何敵人帶傷逃脫！',
    quote: '「你的終結，由我親手送來！」',
    projectileStyle: 'void',
    upgradeStats: { damage: 1.3, range: 1.1, cooldown: 0.88, executeThreshold: 1.05 }
  },
  'BANKER': {
    name: 'Money Printer', cost: 600, damage: 0, range: 0, cooldown: 300,
    type: 'farm', color: '#10b981', icon: '💰',
    description: 'Generates passive income every few seconds. Money spent on this tower pays for every other tower eventually.',
    nameZh: '貨幣製造機',
    descriptionZh: '默默運作的財富引擎，每個周期產生50金幣，不費一兵一卒。毫無戰鬥能力，卻是支撐整條防線升級費用的無聲英雄。',
    quote: '「錢滾錢，才是真正的王道！」',
    upgradeStats: { moneyPerCycle: 1.2, cooldown: 0.9 }
  },
  'WEAKEN': {
    name: 'Weakening Field', cost: 450, damage: 0, range: 3.0, cooldown: 0,
    type: 'aura', color: '#fff', icon: '🔔',
    description: 'Reduces nearby enemy armor, amplifying all incoming damage by 30%. More fragile enemies, same amount of firepower.',
    nameZh: '弱化詛咒塔',
    descriptionZh: '釋放使敵人護甲降低30%的詛咒磁場。自身無傷害，但讓範圍內每個敵人都更容易被友軍擊殺，隱藏攻擊收益極高。',
    quote: '「護甲？在我的詛咒前，都是紙！」',
    upgradeStats: { range: 1.12, debuffAmount: 1.1 }
  },
  'SUMMONER': {
    name: 'Drone Spawner', cost: 650, damage: 40, range: 2.5, cooldown: 120,
    type: 'summon', color: '#4c1d95', icon: '👻',
    description: 'Spawns allied combat units to fight alongside your towers. Quantity has a quality all its own.',
    nameZh: '無人機召喚師',
    descriptionZh: '從擊殺的敵人殘骸中召喚戰鬥無人機，讓其對附近敵人展開攻擊。自我維持的戰鬥循環，敵人越多，無人機越多。',
    quote: '「以你的死亡，召喚更多的殺戮！」',
    upgradeStats: { damage: 1.2, range: 1.1, cooldown: 0.9, droneCount: 1.15 }
  }
};

// Arknights operator class assignments (added after TOWERS declaration)
const _AK: Record<string, { operatorClass: OperatorClass; blockCount: number; def: number; canDeployOnPath?: boolean; maxHp?: number; dpCost?: number }> = {
  BASIC_RIFLE:    { operatorClass: 'guard',     blockCount: 1, def: 45,  canDeployOnPath: true, maxHp: 180, dpCost: 10 },
  GATLING:        { operatorClass: 'guard',     blockCount: 1, def: 55,  canDeployOnPath: true, maxHp: 200, dpCost: 12 },
  EXECUTIONER:    { operatorClass: 'guard',     blockCount: 1, def: 60,  canDeployOnPath: true, maxHp: 220, dpCost: 14 },
  BASIC_SHOTGUN:  { operatorClass: 'guard',     blockCount: 2, def: 40,  canDeployOnPath: true, maxHp: 160, dpCost: 12 },
  BOOMERANG:      { operatorClass: 'guard',     blockCount: 1, def: 35,  canDeployOnPath: true, maxHp: 150, dpCost: 10 },
  BASIC_STUN:     { operatorClass: 'defender',  blockCount: 2, def: 90,  canDeployOnPath: true, maxHp: 320, dpCost: 16 },
  STUN_TOWER:     { operatorClass: 'defender',  blockCount: 3, def: 130, canDeployOnPath: true, maxHp: 480, dpCost: 20 },
  SLOW_FIELD:     { operatorClass: 'defender',  blockCount: 2, def: 70,  canDeployOnPath: true, maxHp: 280, dpCost: 15 },
  PUSHER:         { operatorClass: 'specialist',blockCount: 1, def: 30,  canDeployOnPath: true, maxHp: 180, dpCost: 10 },
  BANKER:         { operatorClass: 'vanguard',  blockCount: 1, def: 35,  canDeployOnPath: true, maxHp: 200, dpCost: 8  },
  BASIC_SNIPER:   { operatorClass: 'sniper',    blockCount: 0, def: 20  },
  PENETRATOR:     { operatorClass: 'sniper',    blockCount: 0, def: 20  },
  ORBITAL:        { operatorClass: 'sniper',    blockCount: 0, def: 18  },
  BASIC_CANNON:   { operatorClass: 'caster',    blockCount: 0, def: 15  },
  ARTILLERY:      { operatorClass: 'caster',    blockCount: 0, def: 15  },
  EXPLOSIVE:      { operatorClass: 'caster',    blockCount: 0, def: 15  },
  BASIC_BURN:     { operatorClass: 'caster',    blockCount: 0, def: 12  },
  INFERNO:        { operatorClass: 'caster',    blockCount: 0, def: 15  },
  POISON_TOWER:   { operatorClass: 'caster',    blockCount: 0, def: 12  },
  LASER_BEAM:     { operatorClass: 'caster',    blockCount: 0, def: 15  },
  CHAIN_LIGHTNING:{ operatorClass: 'caster',    blockCount: 0, def: 15  },
  WEAKEN:         { operatorClass: 'caster',    blockCount: 0, def: 15  },
  BASIC_FREEZE:   { operatorClass: 'supporter', blockCount: 0, def: 18  },
  DAMAGE_BUFF:    { operatorClass: 'supporter', blockCount: 0, def: 15  },
  SPEED_BUFF:     { operatorClass: 'supporter', blockCount: 0, def: 15  },
  RANGE_BUFF:     { operatorClass: 'supporter', blockCount: 0, def: 15  },
  MINE_LAYER:     { operatorClass: 'specialist',blockCount: 0, def: 15  },
  VORTEX:         { operatorClass: 'specialist',blockCount: 0, def: 20  },
  SUMMONER:       { operatorClass: 'specialist',blockCount: 0, def: 20  },
  BASIC_HEAL:     { operatorClass: 'medic',     blockCount: 0, def: 12  },
  HEALER:         { operatorClass: 'medic',     blockCount: 0, def: 12  },
};
Object.entries(_AK).forEach(([key, fields]) => {
  if (TOWERS[key]) {
    (TOWERS[key] as any).operatorClass = fields.operatorClass;
    (TOWERS[key] as any).blockCount = fields.blockCount;
    (TOWERS[key] as any).def = fields.def;
    if (fields.canDeployOnPath) (TOWERS[key] as any).canDeployOnPath = true;
    if (fields.maxHp !== undefined) TOWERS[key].maxHp = fields.maxHp;
    if (fields.dpCost !== undefined) (TOWERS[key] as any).dpCost = fields.dpCost;
  }
});

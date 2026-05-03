class_name TowerCatalog
extends RefCounted
## Eight basic towers from web `data.ts` (keys and core numbers).


static func towers() -> Dictionary:
	return {
		"BASIC_RIFLE": {
			"name": "Auto-Rifle",
			"cost": 50,
			"damage": 8.0,
			"range": 2.5,
			"cooldown": 50,
			"type": "projectile",
			"color": Color(0.98, 0.75, 0.14),
			"icon": "🔫",
			"projectile_style": "bullet",
		},
		"BASIC_CANNON": {
			"name": "Mortar",
			"cost": 120,
			"damage": 35.0,
			"range": 3.5,
			"cooldown": 120,
			"type": "area",
			"color": Color(0.12, 0.16, 0.23),
			"icon": "💣",
			"area_radius": 1.8,
			"projectile_style": "arc",
		},
		"BASIC_SNIPER": {
			"name": "Sniper Rifle",
			"cost": 180,
			"damage": 120.0,
			"range": 5.0,
			"cooldown": 180,
			"type": "projectile",
			"color": Color(0.93, 0.27, 0.27),
			"icon": "🎯",
			"projectile_style": "sniper",
		},
		"BASIC_SHOTGUN": {
			"name": "Shotgun",
			"cost": 150,
			"damage": 25.0,
			"range": 2.0,
			"cooldown": 90,
			"type": "spread",
			"color": Color(0.85, 0.47, 0.02),
			"icon": "💥",
			"multi_target": 5,
			"projectile_style": "shotgun",
		},
		"BASIC_FREEZE": {
			"name": "Cryo Turret",
			"cost": 200,
			"damage": 15.0,
			"range": 3.0,
			"cooldown": 80,
			"type": "projectile",
			"color": Color(0.38, 0.65, 0.98),
			"icon": "❄️",
			"slow_factor": 0.5,
			"projectile_style": "ice",
			"special": "slow",
		},
		"BASIC_BURN": {
			"name": "Flamethrower",
			"cost": 250,
			"damage": 5.0,
			"range": 3.5,
			"cooldown": 8,
			"type": "beam",
			"color": Color(0.93, 0.27, 0.27),
			"icon": "🌋",
			"beam_ramp": 0.5,
			"burn_damage": 8.0,
			"projectile_style": "fire",
		},
		"BASIC_STUN": {
			"name": "Stun Cannon",
			"cost": 220,
			"damage": 40.0,
			"range": 2.8,
			"cooldown": 100,
			"type": "projectile",
			"color": Color(0.98, 0.8, 0.08),
			"icon": "⚡",
			"stun_duration": 90,
			"projectile_style": "lightning",
			"special": "stun",
		},
		"BASIC_HEAL": {
			"name": "Medic Station",
			"cost": 300,
			"damage": 0.0,
			"range": 2.5,
			"cooldown": 60,
			"type": "aura",
			"color": Color(0.06, 0.73, 0.51),
			"icon": "💚",
		},
	}


static func is_support_tower(stats: Dictionary) -> bool:
	if stats.get("damage", 1.0) == 0.0:
		return true
	return stats.get("type", "") == "aura"

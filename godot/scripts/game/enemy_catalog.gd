class_name EnemyCatalog
extends RefCounted
## Subset of web enemies for spawning (name, hp, speed, reward, color, icon, optional flags).


static func all_types() -> Array[Dictionary]:
	return [
		{"name": "Bug", "hp": 30, "speed": 1.0, "reward": 10, "color": "#f87171", "icon": "🐛"},
		{"name": "Spider", "hp": 25, "speed": 1.3, "reward": 8, "color": "#dc2626", "icon": "🕷️"},
		{"name": "Mite", "hp": 20, "speed": 1.5, "reward": 7, "color": "#ef4444", "icon": "🪲"},
		{"name": "Fly", "hp": 15, "speed": 1.8, "reward": 5, "color": "#f97316", "icon": "🪰"},
		{"name": "Glitch", "hp": 80, "speed": 0.7, "reward": 16, "color": "#c084fc", "icon": "👾"},
		{"name": "Drone", "hp": 75, "speed": 0.8, "reward": 14, "color": "#a855f7", "icon": "🤖"},
		{"name": "Crawler", "hp": 70, "speed": 0.75, "reward": 13, "color": "#7c3aed", "icon": "🕸️"},
		{"name": "Virus", "hp": 200, "speed": 0.4, "reward": 32, "color": "#4ade80", "icon": "🦠"},
		{"name": "Worm", "hp": 60, "speed": 1.2, "reward": 13, "color": "#f472b6", "icon": "🪱"},
		{"name": "Trojan", "hp": 400, "speed": 0.3, "reward": 65, "color": "#fbbf24", "icon": "🐴"},
		{
			"name": "Titan",
			"hp": 500,
			"speed": 0.25,
			"reward": 78,
			"color": "#f59e0b",
			"icon": "👹",
			"is_boss": true,
		},
		{
			"name": "Golem",
			"hp": 550,
			"speed": 0.15,
			"reward": 85,
			"color": "#78716c",
			"icon": "🗿",
			"is_boss": true,
			"money_bonus": 3.0,
		},
	]

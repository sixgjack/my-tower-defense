class_name ThemesData
extends RefCounted
## Theme multipliers from web `THEMES` (first sectors). Colors are for Godot drawing only.

static func all() -> Array[Dictionary]:
	return [
		{
			"name": "Cyber City",
			"name_zh": "賽博城市",
			"bg": Color(0.059, 0.09, 0.165),
			"grid_line": Color(0.0, 0.55, 0.65, 0.35),
			"path": Color(0.02, 0.35, 0.42, 0.55),
			"obstacle": Color(0.02, 0.57, 0.69),
			"tower_cooldown_mult": 0.9,
		},
		{
			"name": "Frosty Tundra",
			"name_zh": "霜凍苔原",
			"bg": Color(0.04, 0.12, 0.18),
			"grid_line": Color(0.2, 0.75, 0.85, 0.25),
			"path": Color(0.1, 0.35, 0.5, 0.45),
			"obstacle": Color(0.05, 0.65, 0.9),
			"tower_cooldown_mult": 1.3,
			"enemy_speed_mult": 0.7,
		},
		{
			"name": "Forest Ruin",
			"name_zh": "森林遺跡",
			"bg": Color(0.02, 0.15, 0.08),
			"grid_line": Color(0.2, 0.65, 0.35, 0.3),
			"path": Color(0.15, 0.25, 0.18, 0.55),
			"obstacle": Color(0.02, 0.6, 0.35),
			"money_bonus": 2,
		},
		{
			"name": "Desert Storm",
			"name_zh": "沙漠風暴",
			"bg": Color(0.12, 0.08, 0.02),
			"grid_line": Color(0.8, 0.55, 0.2, 0.25),
			"path": Color(0.35, 0.25, 0.05, 0.45),
			"obstacle": Color(0.85, 0.45, 0.1),
			"tower_range_mult": 0.85,
			"tower_damage_mult": 1.15,
			"enemy_speed_mult": 1.2,
		},
		{
			"name": "Deep Space",
			"name_zh": "深空",
			"bg": Color(0.04, 0.05, 0.12),
			"grid_line": Color(0.35, 0.35, 0.75, 0.25),
			"path": Color(0.15, 0.1, 0.25, 0.45),
			"obstacle": Color(0.2, 0.1, 0.45),
			"tower_cooldown_mult": 1.2,
			"enemy_speed_mult": 0.8,
		},
		{
			"name": "Volcanic Lava",
			"name_zh": "熔岩火山",
			"bg": Color(0.12, 0.02, 0.02),
			"grid_line": Color(0.8, 0.2, 0.15, 0.25),
			"path": Color(0.45, 0.15, 0.05, 0.55),
			"obstacle": Color(0.85, 0.2, 0.15),
			"tower_damage_mult": 1.25,
			"tower_cooldown_mult": 1.4,
			"enemy_hp_mult": 0.85,
		},
	]

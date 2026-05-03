class_name NeonSession
extends Node
## Godot port of web `GameEngine.ts` — tick loop, waves, map, towers, enemies, projectiles.

signal money_changed(value: int)
signal lives_changed(value: int)
signal wave_changed(value: int)
signal notification_changed(text: String, kind: String)
signal game_over_changed(is_over: bool)

const MAX_SUPPORT_TOWERS: int = 5

var map: Array = []
var path: Array = [] ## Array of { "r": int, "c": int }
var towers: Array = []
var enemies: Array = []
var projectiles: Array = []
var float_texts: Array = [] ## { "r": int, "c": int, "text": String, "color": Color, "ttl": int }

var money: int = 500
var lives: int = 20
var wave: int = 1
var tick_count: int = 0
var is_game_over: bool = false

var wave_in_progress: bool = false
var wave_countdown: int = 180
var enemies_remaining_to_spawn: int = 0
var spawn_cooldown: int = 0
var speed_accumulator: float = 0.0
var game_speed: float = 1.0

var notification: String = ""
var notification_timer: int = 0
var notification_kind: String = "wave"

var support_tower_count: int = 0
var _next_entity_id: int = 1

var _themes: Array = []
var _tower_defs: Dictionary = {}
var _enemy_types: Array = []


func _ready() -> void:
	_themes = ThemesData.all()
	_tower_defs = TowerCatalog.towers()
	_enemy_types = EnemyCatalog.all_types()
	start_new_game()


func start_new_game() -> void:
	wave = 1
	money = 500
	lives = 20
	towers.clear()
	enemies.clear()
	projectiles.clear()
	float_texts.clear()
	support_tower_count = 0
	wave_in_progress = false
	wave_countdown = 180
	is_game_over = false
	tick_count = 0
	speed_accumulator = 0.0
	map = MapGenerator.generate_map(wave, 1.0)
	recalculate_path()
	_emit_state()


func current_theme() -> Dictionary:
	var idx: int = int(floor((wave - 1) / 10.0)) % maxi(1, _themes.size())
	return _themes[idx]


func tick() -> void:
	if is_game_over:
		return
	speed_accumulator += game_speed
	var steps: int = 0
	while speed_accumulator >= 1.0 and steps < 10:
		_tick_once()
		speed_accumulator -= 1.0
		steps += 1


func _tick_once() -> void:
	if notification_timer > 0:
		notification_timer -= 1
		if notification_timer <= 0:
			notification = ""
			notification_changed.emit("", "clear")

	tick_count += 1

	if not wave_in_progress:
		if wave_countdown > 0:
			wave_countdown -= 1
			if wave_countdown == 0:
				start_wave()

	if wave_in_progress:
		if enemies_remaining_to_spawn > 0:
			if spawn_cooldown > 0:
				spawn_cooldown -= 1
			else:
				spawn_enemy()
				enemies_remaining_to_spawn -= 1
				spawn_cooldown = maxi(10, 60 - wave)
		elif enemies.is_empty():
			end_wave()

	_update_enemies()
	_cull_dead_enemies()
	_update_towers()
	_cull_dead_enemies()
	_update_projectiles()
	_cull_dead_enemies()
	_update_float_texts()


func start_wave() -> void:
	if wave_in_progress:
		return

	if wave > 1 and (wave - 1) % 10 == 0:
		change_map()
		var t: Dictionary = current_theme()
		var sector: int = int(ceil(wave / 10.0))
		_show_notification("SECTOR %d: %s" % [sector, t.get("name", "")], "alert")
	else:
		if wave % 10 == 0:
			_show_notification("⚠️ BIG BOSS INCOMING ⚠️", "boss")
			spawn_boss_enemy(true, false)
		elif wave % 5 == 0:
			_show_notification("⚠️ MINI BOSS INCOMING ⚠️", "boss")
			spawn_boss_enemy(false, true)
		else:
			_show_notification("WAVE %d" % wave, "wave")

	var is_boss_wave: bool = (wave % 5) == 0
	if is_boss_wave:
		enemies_remaining_to_spawn = maxi(3, int(floor((5 + int(floor(wave * 1.5))) * 0.5)))
	else:
		enemies_remaining_to_spawn = 5 + int(floor(wave * 1.5))

	wave_in_progress = true


func end_wave() -> void:
	wave_in_progress = false
	wave += 1
	wave_countdown = 240
	wave_changed.emit(wave)


func change_map() -> void:
	var refund_total: int = 0
	for t in towers:
		var key: String = t["key"]
		var stats: Dictionary = _tower_defs[key]
		var cost: int = int(stats["cost"])
		var lvl: int = int(t.get("level", 1))
		refund_total += int(floor(cost * lvl * 0.3))
	if refund_total > 0:
		money += refund_total
	towers.clear()
	support_tower_count = 0
	enemies.clear()
	projectiles.clear()
	map = MapGenerator.generate_map(wave, 1.0)
	recalculate_path()
	money_changed.emit(money)


func recalculate_path() -> void:
	path.clear()
	var start: Variant = null
	for r in range(GameConstants.ROWS):
		for c in range(GameConstants.COLS):
			if map[r][c] == GameConstants.CELL_START:
				start = {"r": r, "c": c}
	if start == null:
		return
	var curr: Dictionary = start
	var visited: Dictionary = {}
	path.append(curr)
	visited["%d,%d" % [curr["r"], curr["c"]]] = true
	var found: bool = true
	var safety: int = 0
	while found and safety < 1000:
		safety += 1
		found = false
		var neighbors: Array = [
			{"r": curr["r"] - 1, "c": curr["c"]},
			{"r": curr["r"] + 1, "c": curr["c"]},
			{"r": curr["r"], "c": curr["c"] - 1},
			{"r": curr["r"], "c": curr["c"] + 1},
		]
		for n in neighbors:
			var nr: int = n["r"]
			var nc: int = n["c"]
			if nr < 0 or nr >= GameConstants.ROWS or nc < 0 or nc >= GameConstants.COLS:
				continue
			var val = map[nr][nc]
			var key_vis: String = "%d,%d" % [nr, nc]
			if visited.has(key_vis):
				continue
			if val == GameConstants.CELL_PATH or val == GameConstants.CELL_BASE:
				curr = {"r": nr, "c": nc}
				path.append(curr)
				visited[key_vis] = true
				found = true
				if val == GameConstants.CELL_BASE:
					found = false
				break


func try_build_tower(cell_r: int, cell_c: int, tower_key: String) -> bool:
	if is_game_over:
		return false
	if cell_r < 0 or cell_c < 0 or cell_r >= GameConstants.ROWS or cell_c >= GameConstants.COLS:
		return false
	var cell = map[cell_r][cell_c]
	if cell == GameConstants.CELL_START or cell == GameConstants.CELL_BASE or cell == GameConstants.CELL_OBSTACLE:
		_spawn_float_text(cell_r, cell_c, "Blocked!", Color.RED)
		return false
	if not _tower_defs.has(tower_key):
		return false
	var stats: Dictionary = _tower_defs[tower_key]
	if money < int(stats["cost"]):
		_spawn_float_text(cell_r, cell_c, "Need Funds!", Color.RED)
		return false
	if TowerCatalog.is_support_tower(stats) and support_tower_count >= MAX_SUPPORT_TOWERS:
		_spawn_float_text(cell_r, cell_c, "Max Support!", Color.RED)
		return false
	for t in towers:
		if int(t["r"]) == cell_r and int(t["c"]) == cell_c:
			_spawn_float_text(cell_r, cell_c, "Occupied!", Color.RED)
			return false

	money -= int(stats["cost"])
	var max_hp: int = int(stats.get("max_hp", 100))
	var new_tower: Dictionary = {
		"id": _alloc_id(),
		"r": cell_r,
		"c": cell_c,
		"key": tower_key,
		"cooldown": 0,
		"level": 1,
		"damage": float(stats["damage"]),
		"range": float(stats["range"]),
		"target_id": -1,
		"damage_charge": 0.0,
		"base_damage": float(stats["damage"]),
		"base_range": float(stats["range"]),
		"base_cooldown": float(stats["cooldown"]),
		"hp": max_hp,
		"max_hp": max_hp,
		"angle": 0.0,
		"last_target_id": -1,
		"beam_duration": 0,
	}
	towers.append(new_tower)
	if TowerCatalog.is_support_tower(stats):
		support_tower_count += 1
	money_changed.emit(money)
	return true


func _alloc_id() -> int:
	var id: int = _next_entity_id
	_next_entity_id += 1
	return id


func _show_notification(text: String, kind: String) -> void:
	notification = text
	notification_kind = kind
	notification_timer = 120
	notification_changed.emit(text, kind)


func _spawn_float_text(r: int, c: int, text: String, color: Color) -> void:
	float_texts.append({"r": r, "c": c, "text": text, "color": color, "ttl": 45})


func _theme_mults() -> Dictionary:
	var t: Dictionary = current_theme()
	return {
		"tower_cd": float(t.get("tower_cooldown_mult", 1.0)),
		"tower_range": float(t.get("tower_range_mult", 1.0)),
		"tower_damage": float(t.get("tower_damage_mult", 1.0)),
		"enemy_speed": float(t.get("enemy_speed_mult", 1.0)),
		"enemy_hp": float(t.get("enemy_hp_mult", 1.0)),
		"money_bonus": int(t.get("money_bonus", 0)),
	}


func spawn_enemy() -> void:
	if path.is_empty():
		return
	var diff: float = pow(1.1, wave)
	var theme_idx: int = int(floor((wave - 1) / 10.0))
	var max_types: int = 5 * (theme_idx + 1)
	var non_boss: Array = _enemy_types.filter(func(x): return not x.get("is_boss", false))
	var pool: Array = []
	for i in range(mini(max_types, non_boss.size())):
		pool.append(non_boss[i])
	if pool.is_empty():
		pool = non_boss.duplicate()
	if pool.is_empty():
		return
	var stats: Dictionary = pool[randi() % pool.size()]
	var hp: float = float(stats["hp"]) * diff
	var th: Dictionary = _theme_mults()
	hp *= th["enemy_hp"]
	var base_speed: float = 0.035 * float(stats["speed"]) * th["enemy_speed"]
	var reward: int = int(stats["reward"])
	var enemy: Dictionary = {
		"id": _alloc_id(),
		"path_index": 0,
		"progress": 0.0,
		"r": path[0]["r"],
		"c": path[0]["c"],
		"hp": hp,
		"max_hp": hp,
		"base_speed": base_speed,
		"speed_mult": 1.0,
		"icon": stats.get("icon", "?"),
		"color": _parse_color(String(stats.get("color", "#ffffff"))),
		"reward": reward,
		"scale": 1.0,
		"x_offset": 0.0,
		"y_offset": 0.0,
		"name": stats.get("name", ""),
		"boss_type": "",
		"stun_ticks": 0,
		"slow_ticks": 0,
		"slow_factor": 1.0,
	}
	enemies.append(enemy)


func spawn_boss_enemy(is_big: bool, _is_mini: bool) -> void:
	if path.is_empty():
		return
	var bosses: Array = _enemy_types.filter(func(x): return x.get("is_boss", false))
	if bosses.is_empty():
		return
	var stats: Dictionary = bosses[randi() % bosses.size()]
	var diff: float = pow(1.1, wave)
	var wave_scale: float = clampf(wave / 5.0, 0.5, 1.0)
	var mult_hp: float = (8.0 if is_big else 3.0) * wave_scale
	var hp: float = float(stats["hp"]) * mult_hp * diff
	var th: Dictionary = _theme_mults()
	hp *= th["enemy_hp"]
	var base_reward: float = float(stats["reward"]) * mult_hp
	var money_bonus: float = float(stats.get("money_bonus", 1.0))
	var reward: int = int(floor(base_reward * money_bonus))
	var boss_speed_mult: float = 0.5 if is_big else 0.7
	var base_speed: float = 0.035 * float(stats["speed"]) * boss_speed_mult * th["enemy_speed"]
	var enemy: Dictionary = {
		"id": _alloc_id(),
		"path_index": 0,
		"progress": 0.0,
		"r": path[0]["r"],
		"c": path[0]["c"],
		"hp": hp,
		"max_hp": hp,
		"base_speed": base_speed,
		"speed_mult": 1.0,
		"icon": "👹" if is_big else "👺",
		"color": _parse_color(String(stats.get("color", "#f59e0b"))),
		"reward": reward,
		"scale": 2.5 if is_big else 2.0,
		"x_offset": 0.0,
		"y_offset": 0.0,
		"name": stats.get("name", "Boss"),
		"boss_type": "big" if is_big else "mini",
		"stun_ticks": 0,
		"slow_ticks": 0,
		"slow_factor": 1.0,
	}
	enemies.append(enemy)


func _parse_color(hex: String) -> Color:
	if hex.is_valid_html_color():
		return Color(hex)
	return Color.WHITE


func _cull_dead_enemies() -> void:
	enemies = enemies.filter(func(e): return float(e.get("hp", 0.0)) > 0.0)


func _update_enemies() -> void:
	var th: Dictionary = _theme_mults()
	for enemy in enemies:
		if int(enemy.get("stun_ticks", 0)) > 0:
			enemy["stun_ticks"] = int(enemy["stun_ticks"]) - 1
		if int(enemy.get("slow_ticks", 0)) > 0:
			enemy["slow_ticks"] = int(enemy["slow_ticks"]) - 1
			if int(enemy["slow_ticks"]) <= 0:
				enemy["slow_factor"] = 1.0

		var current_speed: float = float(enemy["base_speed"]) * float(enemy.get("speed_mult", 1.0)) * th["enemy_speed"]
		if int(enemy.get("stun_ticks", 0)) > 0:
			current_speed = 0.0
		else:
			current_speed *= float(enemy.get("slow_factor", 1.0))

		enemy["progress"] = float(enemy["progress"]) + current_speed
		if float(enemy["progress"]) >= 1.0:
			enemy["path_index"] = int(enemy["path_index"]) + 1
			enemy["progress"] = 0.0
			if int(enemy["path_index"]) >= path.size() - 1:
				var dmg: int = 8 if enemy.get("boss_type", "") == "big" else (3 if enemy.get("boss_type", "") == "mini" else 1)
				lives -= dmg
				enemy["hp"] = 0.0
				lives_changed.emit(lives)
				if lives <= 0:
					is_game_over = true
					game_over_changed.emit(true)
			else:
				var cur: Dictionary = path[int(enemy["path_index"])]
				enemy["r"] = cur["r"]
				enemy["c"] = cur["c"]

		if float(enemy.get("hp", 0.0)) > 0.0 and int(enemy.get("path_index", 0)) < path.size() - 1:
			var pi: int = int(enemy["path_index"])
			var cur2: Dictionary = path[pi]
			var nxt: Dictionary = path[pi + 1]
			enemy["x_offset"] = (float(nxt["c"]) - float(cur2["c"])) * float(enemy["progress"])
			enemy["y_offset"] = (float(nxt["r"]) - float(cur2["r"])) * float(enemy["progress"])

	if lives <= 0 and not is_game_over:
		is_game_over = true
		game_over_changed.emit(true)
		_show_notification("GAME OVER", "boss")


func _update_towers() -> void:
	var th: Dictionary = _theme_mults()
	for tower in towers:
		var key: String = tower["key"]
		var stats: Dictionary = _tower_defs[key]
		if not tower.has("base_damage"):
			tower["base_damage"] = float(stats["damage"])
			tower["base_range"] = float(stats["range"])
			tower["base_cooldown"] = float(stats["cooldown"])

		var effective_damage: float = float(tower.get("damage", stats["damage"])) * th["tower_damage"]
		var effective_range: float = float(tower.get("range", stats["range"])) * th["tower_range"]
		var base_cd: float = float(tower.get("base_cooldown", stats["cooldown"]))
		var effective_cooldown: float = base_cd * th["tower_cd"]
		if int(tower.get("cooldown", 0)) > 0:
			tower["cooldown"] = int(tower["cooldown"]) - 1

		if TowerCatalog.is_support_tower(stats):
			if int(tower.get("cooldown", 0)) <= 0:
				tower["cooldown"] = int(effective_cooldown)
				for other in towers:
					if int(other["id"]) == int(tower["id"]):
						continue
					var dist: float = _dist_cells(other, tower)
					if dist <= effective_range:
						var heal_amt: int = 5 + (int(tower.get("level", 1)) - 1) * 2
						other["hp"] = mini(int(other.get("max_hp", 100)), int(other.get("hp", 100)) + heal_amt)
			continue

		var target: Dictionary = {}
		var best_d: float = INF
		for e in enemies:
			if float(e.get("hp", 0.0)) <= 0.0:
				continue
			var d: float = _dist_cells_vec(e, tower)
			if d <= effective_range and d < best_d:
				best_d = d
				target = e
		if target.is_empty():
			continue

		var tr: float = float(target["r"]) + float(target.get("y_offset", 0.0))
		var tc: float = float(target["c"]) + float(target.get("x_offset", 0.0))
		tower["angle"] = rad_to_deg(atan2(tr - float(tower["r"]), tc - float(tower["c"]))) + 90.0

		if stats.get("type", "") == "beam":
			_process_beam(tower, stats, target, effective_damage)
			continue

		if int(tower.get("cooldown", 0)) > 0:
			continue
		tower["cooldown"] = int(effective_cooldown)

		var style: String = String(stats.get("projectile_style", "dot"))
		if style == "sniper" or style == "lightning":
			_apply_damage(target, effective_damage)
			if float(target.get("hp", 0.0)) <= 0.0:
				_kill_enemy(target)
			projectiles.append({
				"id": _alloc_id(),
				"x": float(tower["c"]),
				"y": float(tower["r"]),
				"tx": tc,
				"ty": tr,
				"start_x": float(tower["c"]),
				"start_y": float(tower["r"]),
				"target_id": int(target["id"]),
				"color": stats["color"],
				"life": 10,
				"max_life": 10,
				"style": style,
				"damage": 0.0,
				"speed": 0.0,
				"progress": 0.0,
				"splash": 0.0,
			})
			_apply_fire_special(stats, target)
		elif stats.get("type", "") == "spread":
			var pellet_count: int = int(stats.get("multi_target", 5))
			var base_angle: float = atan2(tr - float(tower["r"]), tc - float(tower["c"]))
			var dist: float = sqrt(pow(tc - float(tower["c"]), 2) + pow(tr - float(tower["r"]), 2))
			var spread_deg: float = 40.0
			for i in range(pellet_count):
				var t_off: float = (float(i) / float(max(1, pellet_count - 1)) - 0.5) * deg_to_rad(spread_deg)
				var ang: float = base_angle + t_off
				var ptx: float = float(tower["c"]) + cos(ang) * dist
				var pty: float = float(tower["r"]) + sin(ang) * dist
				var pellet_damage: float = effective_damage / float(pellet_count)
				projectiles.append({
					"id": _alloc_id(),
					"x": float(tower["c"]),
					"y": float(tower["r"]),
					"tx": ptx,
					"ty": pty,
					"start_x": float(tower["c"]),
					"start_y": float(tower["r"]),
					"target_id": -1,
					"color": stats["color"],
					"life": 100,
					"max_life": 100,
					"style": "shotgun",
					"damage": pellet_damage,
					"speed": float(stats.get("projectile_speed", 0.15)),
					"progress": 0.0,
					"splash": 0.0,
				})
		else:
			projectiles.append({
				"id": _alloc_id(),
				"x": float(tower["c"]),
				"y": float(tower["r"]),
				"tx": tc,
				"ty": tr,
				"start_x": float(tower["c"]),
				"start_y": float(tower["r"]),
				"target_id": int(target["id"]),
				"color": stats["color"],
				"life": 100,
				"max_life": 100,
				"style": style,
				"damage": effective_damage,
				"speed": float(stats.get("projectile_speed", 0.12)),
				"progress": 0.0,
				"splash": float(stats.get("area_radius", 0.0)),
				"special": String(stats.get("special", "")),
				"slow_factor": float(stats.get("slow_factor", 0.5)),
			})
			_apply_fire_special(stats, target)


func _process_beam(tower: Dictionary, stats: Dictionary, target: Dictionary, effective_damage: float) -> void:
	var tid: int = int(target["id"])
	if int(tower.get("last_target_id", -1)) == tid:
		tower["damage_charge"] = mini(float(tower.get("damage_charge", 0.0)) + float(stats.get("beam_ramp", 0.3)), 5.0)
		tower["beam_duration"] = int(tower.get("beam_duration", 0)) + 1
		if int(tower.get("beam_duration", 0)) > 300:
			tower["damage_charge"] = maxf(0.0, float(tower.get("damage_charge", 0.0)) - 0.5)
			if int(tower.get("beam_duration", 0)) > 360:
				tower["beam_duration"] = 0
				tower["damage_charge"] = 0.0
	else:
		tower["damage_charge"] = 0.0
		tower["beam_duration"] = 0
	tower["last_target_id"] = tid
	var ramp: float = 1.0 + float(tower.get("damage_charge", 0.0))
	var dmg: float = effective_damage * 0.08 * ramp
	_apply_damage(target, dmg)
	if stats.get("projectile_style", "") == "fire" and float(stats.get("burn_damage", 0.0)) > 0.0:
		_apply_damage(target, float(stats["burn_damage"]) * 0.02)
	if float(target.get("hp", 0.0)) <= 0.0:
		_kill_enemy(target)


func _apply_fire_special(stats: Dictionary, target: Dictionary) -> void:
	if stats.get("special", "") == "stun" and stats.has("stun_duration"):
		target["stun_ticks"] = int(stats["stun_duration"])
	if stats.get("special", "") == "slow" and stats.has("slow_factor"):
		target["slow_ticks"] = 120
		target["slow_factor"] = float(stats["slow_factor"])


func _dist_cells(other: Dictionary, tower: Dictionary) -> float:
	return sqrt(pow(float(other["r"]) - float(tower["r"]), 2) + pow(float(other["c"]) - float(tower["c"]), 2))


func _dist_cells_vec(e: Dictionary, tower: Dictionary) -> float:
	var er: float = float(e["r"]) + float(e.get("y_offset", 0.0))
	var ec: float = float(e["c"]) + float(e.get("x_offset", 0.0))
	return sqrt(pow(er - float(tower["r"]), 2) + pow(ec - float(tower["c"]), 2))


func _apply_damage(e: Dictionary, amount: float) -> void:
	e["hp"] = float(e.get("hp", 0.0)) - amount


func _kill_enemy(e: Dictionary) -> void:
	var th: Dictionary = _theme_mults()
	var reward: int = int(e.get("reward", 0)) + th["money_bonus"]
	money += reward
	money_changed.emit(money)


func _update_projectiles() -> void:
	for p in projectiles:
		var life: int = int(p.get("life", 100))
		var style: String = String(p.get("style", ""))
		if style == "lightning" or style == "laser":
			p["life"] = life - 1
			continue

		if float(p.get("damage", 1.0)) == 0.0 or float(p.get("speed", 0.1)) <= 0.0:
			p["life"] = life - 1
			continue

		if style == "shotgun":
			p["progress"] = float(p["progress"]) + float(p["speed"])
			var sx: float = float(p["start_x"])
			var sy: float = float(p["start_y"])
			var dx: float = float(p["tx"]) - sx
			var dy: float = float(p["ty"]) - sy
			p["x"] = sx + dx * float(p["progress"])
			p["y"] = sy + dy * float(p["progress"])
			var hit_any: bool = false
			for e in enemies:
				var ex: float = float(e["c"]) + float(e.get("x_offset", 0.0))
				var ey: float = float(e["r"]) + float(e.get("y_offset", 0.0))
				var dist: float = sqrt(pow(ex - float(p["x"]), 2) + pow(ey - float(p["y"]), 2))
				if dist < 0.3 and float(p["progress"]) > 0.1:
					_apply_damage(e, float(p["damage"]))
					if float(e.get("hp", 0.0)) <= 0.0:
						_kill_enemy(e)
					p["life"] = 0
					hit_any = true
					break
			if float(p["progress"]) >= 1.0 and not hit_any:
				p["life"] = 0
		else:
			var tid: int = int(p.get("target_id", -1))
			if tid >= 0:
				var te: Dictionary = _find_enemy_by_id(tid)
				if not te.is_empty():
					p["tx"] = float(te["c"]) + float(te.get("x_offset", 0.0))
					p["ty"] = float(te["r"]) + float(te.get("y_offset", 0.0))
			p["progress"] = float(p["progress"]) + float(p["speed"])
			var sxx: float = float(p["start_x"])
			var syy: float = float(p["start_y"])
			var dxx: float = float(p["tx"]) - sxx
			var dyy: float = float(p["ty"]) - syy
			p["x"] = sxx + dxx * float(p["progress"])
			p["y"] = syy + dyy * float(p["progress"])
			if float(p["progress"]) >= 1.0:
				p["life"] = 0
				_handle_projectile_hit(p)

	projectiles = projectiles.filter(func(pr): return int(pr.get("life", 0)) > 0)


func _find_enemy_by_id(id: int) -> Dictionary:
	for e in enemies:
		if int(e["id"]) == id:
			return e
	return {}


func _handle_projectile_hit(p: Dictionary) -> void:
	var splash: float = float(p.get("splash", 0.0))
	var dmg: float = float(p.get("damage", 0.0))
	var col: Color = p.get("color", Color.WHITE)
	if splash > 0.0:
		for e in enemies:
			var ex: float = float(e["c"]) + float(e.get("x_offset", 0.0))
			var ey: float = float(e["r"]) + float(e.get("y_offset", 0.0))
			var d: float = sqrt(pow(ex - float(p["x"]), 2) + pow(ey - float(p["y"]), 2))
			if d <= splash:
				_apply_damage(e, dmg)
				if String(p.get("special", "")) == "slow":
					e["slow_ticks"] = 120
					e["slow_factor"] = float(p.get("slow_factor", 0.5))
				if float(e.get("hp", 0.0)) <= 0.0:
					_kill_enemy(e)
	else:
		var tid: int = int(p.get("target_id", -1))
		var e: Dictionary = _find_enemy_by_id(tid)
		if not e.is_empty():
			_apply_damage(e, dmg)
			if String(p.get("special", "")) == "slow":
				e["slow_ticks"] = 120
				e["slow_factor"] = float(p.get("slow_factor", 0.5))
			if String(p.get("special", "")) == "stun":
				e["stun_ticks"] = int(_tower_defs["BASIC_STUN"].get("stun_duration", 90))
			if float(e.get("hp", 0.0)) <= 0.0:
				_kill_enemy(e)


func _update_float_texts() -> void:
	for ft in float_texts:
		ft["ttl"] = int(ft["ttl"]) - 1
	float_texts = float_texts.filter(func(f): return int(f.get("ttl", 0)) > 0)


func _emit_state() -> void:
	money_changed.emit(money)
	lives_changed.emit(lives)
	wave_changed.emit(wave)

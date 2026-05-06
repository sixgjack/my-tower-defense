extends Node2D
## Draws the grid and entities; maps screen / touch to cell builds via parent `Gameplay`.
## 使用 SubViewport + Camera2D 時，觸控座標會自動對應到本地格子。

var _session: NeonSession
var _camera: Camera2D

const SPRITE_PX: int = 16
const TILE_PX_STEP: int = 6


func bind_session(session: NeonSession) -> void:
	_session = session
	_ensure_camera()


func _ensure_camera() -> void:
	if get_node_or_null("Camera2D"):
		_camera = $Camera2D
	else:
		_camera = Camera2D.new()
		_camera.name = "Camera2D"
		add_child(_camera)
	_camera.enabled = true
	_camera.make_current()


func configure_camera_for_size(container_size: Vector2) -> void:
	if _camera == null:
		return
	var cs: float = float(GameConstants.CELL_SIZE)
	var map_sz := Vector2(float(GameConstants.COLS) * cs, float(GameConstants.ROWS) * cs)
	var safe_w: float = maxf(container_size.x, 1.0)
	var safe_h: float = maxf(container_size.y, 1.0)
	var fit_zoom: float = maxf(map_sz.x / safe_w, map_sz.y / safe_h)
	var zoom_v: float = clampf(fit_zoom * 0.88, 0.20, 2.5)
	_camera.zoom = Vector2(zoom_v, zoom_v)
	_camera.position = map_sz * 0.5


func _draw() -> void:
	if _session == null:
		return
	var theme: Dictionary = _session.current_theme()
	var cs: int = GameConstants.CELL_SIZE
	var rows: int = GameConstants.ROWS
	var cols: int = GameConstants.COLS
	var map: Array = _session.map
	var grid_line: Color = theme.get("grid_line", Color(0.4, 0.5, 0.55, 0.25))
	var bg: Color = theme.get("bg", Color(0.1, 0.1, 0.15))
	var anim_tick: int = int(_session.tick_count / 8)
	var map_rect := Rect2(Vector2.ZERO, Vector2(cols * cs, rows * cs))

	draw_rect(map_rect, bg)
	if String(theme.get("ground_style", "")) == "neon_asphalt":
		_draw_neon_asphalt_ground(map_rect, cs, anim_tick)

	for r in range(rows):
		for c in range(cols):
			var rect := Rect2(Vector2(c * cs, r * cs), Vector2(cs, cs))
			var cell = map[r][c]
			var fill: Color = bg.lightened(0.04)
			if cell == GameConstants.CELL_PATH:
				fill = theme.get("path", Color(0.2, 0.3, 0.35, 0.6))
			elif cell == GameConstants.CELL_START:
				fill = Color(0.2, 0.85, 0.4, 0.45)
			elif cell == GameConstants.CELL_BASE:
				fill = Color(0.95, 0.35, 0.25, 0.55)
			elif cell == GameConstants.CELL_OBSTACLE:
				fill = theme.get("obstacle", Color(0.3, 0.3, 0.35))
			_draw_pixel_cell(rect, fill, r, c)
			draw_rect(rect, grid_line, false, 1.0)

	# Towers — draw glow pad, then sprite, then accent, then outline
	for t in _session.towers:
		var tr: int = int(t["r"])
		var tc: int = int(t["c"])
		var rect3 := Rect2(Vector2(tc * cs + 4, tr * cs + 4), Vector2(cs - 8, cs - 8))
		var key: String = String(t["key"])
		var tcol: Color = _tower_color(key)
		# Soft coloured glow pad behind tower
		draw_rect(Rect2(Vector2(tc * cs + 1, tr * cs + 1), Vector2(cs - 2, cs - 2)),
			Color(tcol.r, tcol.g, tcol.b, 0.12))
		_draw_pixel_tower(rect3, key, anim_tick + int(t.get("id", 0)))
		_draw_tower_accent(rect3, key, anim_tick)
		draw_rect(rect3, Color(1, 1, 1, 0.8), false, 1.5)

	# Enemies — draw boss aura, then sprite, then HP bar
	for e in _session.enemies:
		var px: float = float(e["c"]) + float(e.get("x_offset", 0.0))
		var py: float = float(e["r"]) + float(e.get("y_offset", 0.0))
		var center := Vector2((px + 0.5) * cs, (py + 0.5) * cs)
		var scale: float = float(e.get("scale", 1.0))
		var size_px: float = 28.0 * scale
		var enemy_rect := Rect2(center - Vector2(size_px, size_px) * 0.5, Vector2(size_px, size_px))
		var is_boss: bool = bool(e.get("is_boss", false)) or String(e.get("boss_type", "")) != ""
		if is_boss:
			_draw_boss_aura(center, size_px, e, anim_tick)
		_draw_pixel_enemy(enemy_rect, e, anim_tick + int(e.get("id", 0)))
		_draw_enemy_hp_bar(enemy_rect, e, is_boss)

	for p in _session.projectiles:
		_draw_projectile(p, cs, anim_tick)

	var fnt := ThemeDB.fallback_font
	for ft in _session.float_texts:
		var fr: int = int(ft["r"])
		var fc: int = int(ft["c"])
		var pos2 := Vector2(round(fc * cs + 4), round(fr * cs + 14))
		draw_string(fnt, pos2, String(ft.get("text", "")), HORIZONTAL_ALIGNMENT_LEFT, -1, 12, ft.get("color", Color.WHITE))


# ─── Tower drawing ─────────────────────────────────────────────────────────────

func _tower_color(key: String) -> Color:
	var defs: Dictionary = TowerCatalog.towers()
	if defs.has(key):
		return defs[key].get("color", Color.GRAY)
	return Color.GRAY


func _draw_pixel_tower(rect3: Rect2, key: String, tick: int) -> void:
	var phase: int = tick % 4
	var base: Color = _tower_color(key)
	var c1: Color = base.darkened(0.5)
	var c2: Color = base
	var c3: Color = base.lightened(0.2 + 0.05 * float(phase % 2))
	var c4: Color
	var pattern: PackedStringArray

	if key.find("RIFLE") >= 0:
		# Circular turret body, short barrel pointing right
		c4 = Color(0.28, 0.28, 0.32)
		pattern = PackedStringArray([
			"..1111..",
			".122221.",
			"12233321",
			"1234444.",
			"1234444.",
			"12233321",
			".122221.",
			"..1111..",
		])
	elif key.find("CANNON") >= 0:
		# Heavy base, upward mortar barrel
		c4 = Color(0.1, 0.12, 0.18)
		pattern = PackedStringArray([
			"...441..",
			"..44221.",
			".144321.",
			"12444321",
			"12344321",
			"12233221",
			".122221.",
			"..1111..",
		])
	elif key.find("SNIPER") >= 0:
		# Compact body, very long barrel right
		c4 = Color(0.88, 0.18, 0.18)
		pattern = PackedStringArray([
			"..1111..",
			".12221..",
			"1232221.",
			"12344444",
			"12344444",
			"1232221.",
			".12221..",
			"..1111..",
		])
	elif key.find("SHOTGUN") >= 0:
		# Wide double barrel
		c4 = Color(0.18, 0.15, 0.12)
		pattern = PackedStringArray([
			"..1111..",
			".122221.",
			"12444221",
			"14444421",
			"14444421",
			"12444221",
			".122221.",
			"..1111..",
		])
	elif key.find("FREEZE") >= 0:
		# Ice spikes on top + cryo body
		c4 = Color(0.72, 0.96, 1.0)
		pattern = PackedStringArray([
			".4.11.4.",
			"...221..",
			".144441.",
			"12244221",
			"12344321",
			"12244221",
			".12221..",
			"..1111..",
		])
	elif key.find("BURN") >= 0:
		# Flamethrower, nozzle pointing left
		c4 = Color(1.0, 0.52, 0.08)
		pattern = PackedStringArray([
			"..1111..",
			".122221.",
			"12233221",
			"4444432.",
			"4444432.",
			"12233221",
			".122221.",
			"..1111..",
		])
	elif key.find("STUN") >= 0:
		# Tesla coil with tall rod on top
		c4 = Color(1.0, 0.95, 0.28)
		pattern = PackedStringArray([
			"...44...",
			"...44...",
			"...44...",
			".144441.",
			"12244221",
			"12344321",
			".122221.",
			"..1111..",
		])
	elif key.find("HEAL") >= 0:
		# Medical cross shape
		c4 = Color(0.12, 1.0, 0.58)
		pattern = PackedStringArray([
			"..1441..",
			"..1441..",
			"11444411",
			"14444441",
			"14444441",
			"11444411",
			"..1441..",
			"..1441..",
		])
	else:
		c4 = base.lightened(0.5)
		pattern = PackedStringArray([
			"..1111..",
			".122221.",
			"12233221",
			"12344321",
			"12344321",
			"12233221",
			".122221.",
			"..1111..",
		])

	_draw_pixel_pattern(rect3, pattern, {"1": c1, "2": c2, "3": c3, "4": c4})


func _draw_tower_accent(rect3: Rect2, key: String, anim_tick: int) -> void:
	var pulse: float = 0.5 + 0.3 * sin(float(anim_tick) * 0.65)
	var center := rect3.get_center()
	var r: float = rect3.size.x

	if key.find("HEAL") >= 0:
		draw_circle(center, r * 0.18, Color(0.12, 1.0, 0.6, pulse * 0.8))
		draw_circle(center, r * 0.09, Color(0.5, 1.0, 0.8, pulse))
		var orbit_angle: float = float(anim_tick) * 0.15
		var orbit_pos := center + Vector2(cos(orbit_angle), sin(orbit_angle)) * r * 0.36
		draw_circle(orbit_pos, 2.5, Color(0.3, 1.0, 0.7, pulse))
	elif key.find("BURN") >= 0:
		var nozzle := center + Vector2(-r * 0.42, 0.0)
		draw_circle(nozzle, r * 0.18 * pulse, Color(1.0, 0.28, 0.05, 0.9))
		draw_circle(nozzle + Vector2(-2.5, -1.0), r * 0.10, Color(1.0, 0.72, 0.18, pulse))
		draw_circle(nozzle + Vector2(-5.0, 0.0), r * 0.06, Color(1.0, 0.95, 0.6, pulse * 0.7))
	elif key.find("FREEZE") >= 0:
		for i in range(3):
			var angle: float = float(i) * TAU / 3.0 + float(anim_tick) * 0.09
			var sp := center + Vector2(cos(angle), sin(angle)) * r * 0.32
			draw_circle(sp, 2.2, Color(0.72, 0.96, 1.0, pulse))
		draw_circle(center, r * 0.08, Color(0.92, 1.0, 1.0, pulse))
	elif key.find("STUN") >= 0:
		var top := center + Vector2(0.0, -r * 0.42)
		var spark_offset: float = float(anim_tick % 4) * 2.2 - 4.4
		draw_line(top, top + Vector2(spark_offset, -5.0), Color(1.0, 0.95, 0.3, pulse), 1.5)
		draw_line(top, top + Vector2(-spark_offset, -7.0), Color(1.0, 0.85, 0.2, pulse * 0.7), 1.5)
		draw_circle(top, 2.8, Color(1.0, 1.0, 0.5, pulse))
	elif key.find("SNIPER") >= 0:
		var barrel_tip := center + Vector2(r * 0.46, 0.0)
		draw_circle(barrel_tip, 2.8, Color(1.0, 0.18, 0.18, pulse))
		draw_circle(barrel_tip, 1.4, Color(1.0, 0.7, 0.7, pulse))
	elif key.find("CANNON") >= 0:
		var barrel_top := center + Vector2(0.0, -r * 0.46)
		draw_circle(barrel_top, r * 0.14 * pulse, Color(0.55, 0.52, 0.58, 0.35 * pulse))
	elif key.find("SHOTGUN") >= 0:
		draw_circle(center + Vector2(r * 0.4, -r * 0.12), 2.2, Color(1.0, 0.65, 0.15, pulse))
		draw_circle(center + Vector2(r * 0.4, r * 0.12), 2.2, Color(1.0, 0.65, 0.15, pulse))
	elif key.find("RIFLE") >= 0:
		var tip := center + Vector2(r * 0.44, 0.0)
		draw_circle(tip, 2.5, Color(1.0, 0.88, 0.32, pulse * 0.75))


# ─── Enemy drawing ─────────────────────────────────────────────────────────────

func _draw_boss_aura(center: Vector2, size_px: float, e: Dictionary, anim_tick: int) -> void:
	var pulse: float = 0.55 + 0.35 * sin(float(anim_tick) * 0.5)
	var base: Color = Color(e.get("color", Color.WHITE))
	var aura_r: float = size_px * 0.78
	# Outer ring
	draw_arc(center, aura_r + 3.0, 0.0, TAU, 32, Color(base.r, base.g, base.b, 0.25 * pulse), 3.0)
	draw_arc(center, aura_r, 0.0, TAU, 32, Color(base.r, base.g, base.b, 0.55 * pulse), 2.0)
	# Rotating spikes
	for i in range(4):
		var angle: float = float(i) * TAU / 4.0 + float(anim_tick) * 0.06
		var tip := center + Vector2(cos(angle), sin(angle)) * (aura_r + 6.0)
		var base_pt := center + Vector2(cos(angle), sin(angle)) * aura_r
		draw_line(base_pt, tip, Color(1.0, 0.85, 0.3, 0.85 * pulse), 2.0)


func _draw_pixel_enemy(rect: Rect2, e: Dictionary, tick: int) -> void:
	var phase: int = tick % 4
	var name: String = String(e.get("name", "")).to_lower()
	var is_boss: bool = bool(e.get("is_boss", false)) or String(e.get("boss_type", "")) != ""
	var base: Color = Color(e.get("color", Color.WHITE))
	var c1: Color = base.darkened(0.52)
	var c2: Color = base
	var c3: Color = base.lightened(0.22 + 0.06 * float(phase % 2))
	var c4: Color = Color(0.06, 0.06, 0.08)
	var pattern: PackedStringArray

	if name.contains("spider"):
		c4 = Color(0.95, 0.1, 0.1)
		pattern = PackedStringArray([
			"4.....4.",
			".4.11.4.",
			"..1221..",
			".122221.",
			".122221.",
			"..1221..",
			".4.11.4.",
			"4......4",
		])
	elif name.contains("fly"):
		c4 = Color(0.82, 0.96, 1.0)
		pattern = PackedStringArray([
			"4......4",
			"44.11.44",
			".4.11.4.",
			"..1221..",
			".122221.",
			"..1221..",
			"...44...",
			"........",
		])
	elif name.contains("bug") or name.contains("mite"):
		c4 = Color(0.08, 0.06, 0.04)
		pattern = PackedStringArray([
			"........",
			"..4.4...",
			"..1221..",
			".122221.",
			".122221.",
			"..1221..",
			".4.44.4.",
			"........",
		])
	elif name.contains("drone"):
		c4 = Color(0.58, 0.92, 1.0)
		pattern = PackedStringArray([
			"4..44..4",
			"4.1441.4",
			".14441..",
			"12444221",
			"12444221",
			".14441..",
			"4.1441.4",
			"4..44..4",
		])
	elif name.contains("glitch"):
		c4 = Color(1.0, 0.28, 0.92)
		pattern = PackedStringArray([
			".144441.",
			"14422441",
			"14432441",
			"12444321",
			"12344421",
			"14432441",
			"14422441",
			".144441.",
		])
	elif name.contains("crawler"):
		c4 = Color(0.52, 0.14, 0.82)
		pattern = PackedStringArray([
			"1......1",
			"1.1221.1",
			".144441.",
			"14433441",
			"14433441",
			".144441.",
			"1.1221.1",
			"1......1",
		])
	elif name.contains("virus"):
		c4 = Color(0.1, 0.92, 0.4)
		pattern = PackedStringArray([
			".4...4..",
			"4.1221.4",
			".122221.",
			"12233221",
			"12233221",
			".122221.",
			"4.1221.4",
			".4...4..",
		])
	elif name.contains("worm"):
		c4 = Color(0.92, 0.28, 0.62)
		pattern = PackedStringArray([
			"........",
			"..1111..",
			".122221.",
			"12233221",
			"12333221",
			".122221.",
			"..1221..",
			"...44...",
		])
	elif name.contains("trojan"):
		c4 = Color(1.0, 0.82, 0.1)
		pattern = PackedStringArray([
			"4......4",
			"44.11.44",
			"14.22.41",
			"12444221",
			"12344321",
			"12233221",
			".122221.",
			"..1111..",
		])
	elif name.contains("titan"):
		c4 = Color(1.0, 0.22, 0.14)
		pattern = PackedStringArray([
			"44....44",
			"14.44.41",
			"144..441",
			"12422421",
			"12422421",
			"144..441",
			"14.44.41",
			"44....44",
		])
	elif name.contains("golem"):
		c4 = Color(0.88, 0.72, 0.52)
		pattern = PackedStringArray([
			".111111.",
			"12222221",
			"12.44.21",
			"12444221",
			"12444221",
			"12.44.21",
			"12222221",
			".111111.",
		])
	else:
		# Generic fallback
		c4 = Color(0.08, 0.08, 0.1)
		pattern = PackedStringArray([
			"........",
			"..1111..",
			".122221.",
			"12233221",
			"12344321",
			".122221.",
			".4.44.4.",
			"........",
		])

	# Boss gets extra bright highlight
	if is_boss:
		c3 = c3.lightened(0.15)

	_draw_pixel_pattern(rect, pattern, {"1": c1, "2": c2, "3": c3, "4": c4})


func _draw_enemy_hp_bar(enemy_rect: Rect2, e: Dictionary, is_boss: bool = false) -> void:
	var hp: float = float(e.get("hp", 0.0))
	var max_hp: float = maxf(1.0, float(e.get("max_hp", 1.0)))
	var ratio: float = clampf(hp / max_hp, 0.0, 1.0)
	var w: float = enemy_rect.size.x * (1.1 if is_boss else 0.82)
	var h: float = maxf(3.0 if is_boss else 2.0, enemy_rect.size.y * 0.1)
	var x: float = enemy_rect.position.x + (enemy_rect.size.x - w) * 0.5
	var y: float = enemy_rect.position.y - h - 3.0
	# Background
	draw_rect(Rect2(Vector2(x, y), Vector2(w, h)), Color(0.0, 0.0, 0.0, 0.65))
	# HP fill colour: green → yellow → red
	var bar_col: Color
	if ratio > 0.6:
		bar_col = Color(0.2, 1.0, 0.35)
	elif ratio > 0.3:
		bar_col = Color(1.0, 0.82, 0.1)
	else:
		bar_col = Color(1.0, 0.22, 0.22)
	draw_rect(Rect2(Vector2(x + 1.0, y + 1.0), Vector2((w - 2.0) * ratio, h - 2.0)), bar_col)
	if is_boss:
		draw_rect(Rect2(Vector2(x, y), Vector2(w, h)), Color(1.0, 0.82, 0.1, 0.55), false, 1.0)


# ─── Projectile drawing ────────────────────────────────────────────────────────

func _draw_projectile(p: Dictionary, cs: int, anim_tick: int) -> void:
	var start := Vector2(float(p.get("x", 0.0)) * cs + cs * 0.5, float(p.get("y", 0.0)) * cs + cs * 0.5)
	var tx := float(p.get("tx", p.get("x", 0.0)))
	var ty := float(p.get("ty", p.get("y", 0.0)))
	var target := Vector2(tx * cs + cs * 0.5, ty * cs + cs * 0.5)
	var style: String = String(p.get("style", "dot"))
	var col: Color = p.get("color", Color.YELLOW)
	var life: float = maxf(1.0, float(p.get("max_life", 12)))
	var t: float = 1.0 - clampf(float(p.get("life", 0.0)) / life, 0.0, 1.0)
	var pos: Vector2 = start.lerp(target, t)
	var pulse: float = 0.7 + 0.3 * sin(float(anim_tick) * 1.2)

	if style == "sniper":
		# Red laser beam — wide soft glow + hard core + impact flash
		_draw_pixel_beam(start, target, Color(1.0, 0.12, 0.12, 0.25), 5.0)
		_draw_pixel_beam(start, target, Color(1.0, 0.25, 0.25, 0.55), 2.0)
		_draw_pixel_beam(start, target, Color(1.0, 0.8, 0.8, 0.85), 1.0)
		draw_rect(Rect2(target - Vector2(3, 3), Vector2(6, 6)), Color(1.0, 0.95, 0.95, 0.9))
		draw_rect(Rect2(target - Vector2(1, 1), Vector2(2, 2)), Color(1.0, 1.0, 1.0, 1.0))

	elif style == "lightning":
		# Zigzag bolt with glow
		var segs: int = 6
		var prev := start
		for i in range(1, segs + 1):
			var ft: float = float(i) / float(segs)
			var mid := start.lerp(target, ft)
			var dir := (target - start).normalized()
			var perp := Vector2(-dir.y, dir.x)
			var offset: float = 0.0
			if i < segs:
				offset = (float(_pixel_hash(i, anim_tick, 7) % 100) / 100.0 - 0.5) * 10.0
			var pt := mid + perp * offset
			_draw_pixel_beam(prev, pt, Color(1.0, 0.98, 0.4, 0.9), 2.0)
			_draw_pixel_beam(prev, pt, Color(1.0, 1.0, 0.7, 0.35), 4.5)
			prev = pt

	elif style == "fire" or style == "beam":
		# Fire particle — outer glow, core, bright tip
		draw_rect(Rect2(pos - Vector2(5, 5), Vector2(10, 10)), Color(1.0, 0.28, 0.04, 0.45 * pulse))
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), Color(1.0, 0.45, 0.08, 0.88))
		draw_rect(Rect2(pos - Vector2(1.5, 1.5), Vector2(3, 3)), Color(1.0, 0.88, 0.35, 1.0))

	elif style == "ice":
		# Ice crystal — glow + cross shape
		draw_rect(Rect2(pos - Vector2(4, 4), Vector2(8, 8)), Color(0.38, 0.72, 1.0, 0.38 * pulse))
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), Color(0.62, 0.9, 1.0, 0.9))
		draw_rect(Rect2(pos - Vector2(3, 1), Vector2(6, 2)), Color(0.88, 0.98, 1.0, 0.95))
		draw_rect(Rect2(pos - Vector2(1, 3), Vector2(2, 6)), Color(0.88, 0.98, 1.0, 0.95))

	elif style == "shotgun":
		# Pellet with warm glow
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), Color(1.0, 0.55, 0.08, 0.45 * pulse))
		draw_rect(Rect2(pos - Vector2(2, 2), Vector2(4, 4)), Color(1.0, 0.72, 0.28, 0.92))
		draw_rect(Rect2(pos - Vector2(1, 1), Vector2(2, 2)), Color(1.0, 0.92, 0.72, 1.0))

	elif style == "arc":
		# Mortar shell — round with ember core
		draw_rect(Rect2(pos - Vector2(4, 4), Vector2(8, 8)), Color(col.r, col.g, col.b, 0.3 * pulse))
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), col)
		draw_rect(Rect2(pos - Vector2(1, 1), Vector2(2, 2)), Color(1.0, 0.88, 0.55, 0.92))

	elif style == "bullet":
		# Standard bullet with motion trail
		var dir: Vector2 = (target - start).normalized()
		_draw_pixel_beam(pos, pos - dir * 7.0, Color(col.r, col.g, col.b, 0.38), 2.0)
		draw_rect(Rect2(pos - Vector2(2.5, 2.5), Vector2(5, 5)), col)
		draw_rect(Rect2(pos - Vector2(1, 1), Vector2(2, 2)), Color(1.0, 0.96, 0.82, 0.95))

	elif style == "bolt":
		# Instant bolt (PENETRATOR) — thin piercing line
		_draw_pixel_beam(start, target, Color(col.r, col.g, col.b, 0.3), 4.0)
		_draw_pixel_beam(start, target, col, 1.5)

	else:
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), col)
		draw_rect(Rect2(pos - Vector2(1, 1), Vector2(2, 2)), Color(1.0, 1.0, 1.0, 0.8))


# ─── Shared pixel helpers ──────────────────────────────────────────────────────

func _pixel_hash(r: int, c: int, salt: int = 0) -> int:
	var n: int = r * 92821 + c * 68917 + salt * 1013
	n = (n << 13) ^ n
	return abs((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff)


func _draw_pixel_cell(rect: Rect2, base: Color, r: int, c: int) -> void:
	draw_rect(rect, base)
	var step: float = float(TILE_PX_STEP)
	var cols: int = maxi(1, int(floor(rect.size.x / step)))
	var rows: int = maxi(1, int(floor(rect.size.y / step)))
	for yy in range(rows):
		for xx in range(cols):
			var h: int = _pixel_hash(r * 17 + yy, c * 23 + xx, 3) % 100
			if h < 33:
				var shade := base.darkened(0.08)
				draw_rect(Rect2(rect.position + Vector2(xx * step, yy * step), Vector2(step + 0.1, step + 0.1)), shade)
			elif h > 88:
				var hi := base.lightened(0.08)
				draw_rect(Rect2(rect.position + Vector2(xx * step, yy * step), Vector2(step + 0.1, step + 0.1)), hi)


func _draw_pixel_pattern(rect: Rect2, pattern: PackedStringArray, palette: Dictionary) -> void:
	if pattern.is_empty():
		return
	var h: int = pattern.size()
	var w: int = pattern[0].length()
	if h <= 0 or w <= 0:
		return
	var px: float = rect.size.x / float(w)
	var py: float = rect.size.y / float(h)
	for y in range(h):
		var row: String = pattern[y]
		for x in range(w):
			var ch: String = row.substr(x, 1)
			if ch == "." or not palette.has(ch):
				continue
			var col: Color = palette[ch]
			var pos := rect.position + Vector2(floor(px * x), floor(py * y))
			var size := Vector2(ceil(px), ceil(py))
			draw_rect(Rect2(pos, size), col)


func _draw_pixel_beam(a: Vector2, b: Vector2, col: Color, thickness: float) -> void:
	var dir: Vector2 = b - a
	var len: float = dir.length()
	if len <= 0.001:
		return
	var step: float = 3.0
	var n: int = int(ceil(len / step))
	for i in range(n + 1):
		var t: float = float(i) / maxf(1.0, float(n))
		var p: Vector2 = a.lerp(b, t)
		draw_rect(Rect2(Vector2(floor(p.x), floor(p.y)), Vector2(thickness, thickness)), col)


# ─── Ground effects ────────────────────────────────────────────────────────────

func _draw_neon_asphalt_ground(map_rect: Rect2, cs: int, anim_tick: int) -> void:
	var pulse: float = 0.28 + 0.08 * sin(float(anim_tick) * 0.45)
	draw_rect(map_rect, Color(0.12, 0.12, 0.13, 0.35))

	for i in range(0, int(map_rect.size.x), cs * 2):
		var x := float(i + (i / max(1, cs)) % 7)
		draw_line(Vector2(x, map_rect.position.y + 4), Vector2(x + 10, map_rect.position.y + map_rect.size.y - 4), Color(0.06, 0.06, 0.07, 0.35), 1.0)

	for i in range(1, int(map_rect.size.x / (cs * 2))):
		var mark_w: float = float(cs)
		var mark_h: float = 4.0
		var mx: float = map_rect.position.x + i * cs * 2
		var my: float = map_rect.position.y + map_rect.size.y * 0.48
		draw_rect(Rect2(Vector2(mx, my), Vector2(mark_w, mark_h)), Color(0.85, 0.84, 0.78, 0.22))

	for i in range(5):
		var px: float = map_rect.position.x + (map_rect.size.x * (0.13 + 0.17 * i))
		var py: float = map_rect.position.y + map_rect.size.y * (0.18 + 0.13 * (i % 3))
		var puddle := Rect2(Vector2(px, py), Vector2(36 + i * 4, 14 + (i % 2) * 6))
		draw_rect(puddle, Color(0.15, 0.22, 0.3, 0.18))
		draw_rect(puddle.grow(-2), Color(0.18, 0.55, 0.8, pulse))
		draw_rect(Rect2(puddle.position + Vector2(3, 2), Vector2(puddle.size.x * 0.45, 3)), Color(0.9, 0.35, 0.85, pulse * 0.85))

	for i in range(3):
		var cx: float = map_rect.position.x + map_rect.size.x * (0.25 + 0.27 * i)
		var cy: float = map_rect.position.y + map_rect.size.y * 0.72
		draw_circle(Vector2(cx, cy), 9.0, Color(0.23, 0.23, 0.25, 0.7))
		draw_circle(Vector2(cx, cy), 7.0, Color(0.3, 0.3, 0.34, 0.65))
		draw_arc(Vector2(cx, cy), 5.0, 0.0, TAU, 14, Color(0.18, 0.18, 0.2, 0.5), 1.0)


# ─── Input / coordinate mapping ───────────────────────────────────────────────

func _fill_rect(img: Image, rect: Rect2i, c: Color) -> void:
	for y in range(rect.position.y, rect.position.y + rect.size.y):
		if y < 0 or y >= img.get_height():
			continue
		for x in range(rect.position.x, rect.position.x + rect.size.x):
			if x < 0 or x >= img.get_width():
				continue
			img.set_pixel(x, y, c)


func screen_to_cell(screen_pos: Vector2) -> Vector2i:
	var inv: Transform2D = get_global_transform_with_canvas().affine_inverse()
	var local_p: Vector2 = inv * screen_pos
	var c: int = int(floor(local_p.x / float(GameConstants.CELL_SIZE)))
	var r: int = int(floor(local_p.y / float(GameConstants.CELL_SIZE)))
	return Vector2i(c, r)


func try_build_from_screen(screen_pos: Vector2, tower_key: String) -> bool:
	var cell: Vector2i = screen_to_cell(screen_pos)
	if cell.y < 0 or cell.x < 0 or cell.y >= GameConstants.ROWS or cell.x >= GameConstants.COLS:
		return false
	return _session.try_build_tower(cell.y, cell.x, tower_key)


func _unhandled_input(event: InputEvent) -> void:
	if _session == null:
		return
	if _session.is_game_over:
		return
	var press: bool = false
	var pos: Vector2 = Vector2.ZERO
	if event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if st.pressed:
			press = true
			pos = st.position
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			press = true
			pos = mb.position
	if not press:
		return
	var cell: Vector2i = screen_to_cell(pos)
	var c: int = cell.x
	var r: int = cell.y
	if r < 0 or c < 0 or r >= GameConstants.ROWS or c >= GameConstants.COLS:
		return
	var gp: Node = get_tree().current_scene
	if gp and gp.has_method("get_selected_tower"):
		var key: String = String(gp.call("get_selected_tower"))
		if gp.has_method("request_build_with_question"):
			gp.call("request_build_with_question", r, c, key)
		else:
			_session.try_build_tower(r, c, key)
		queue_redraw()
	get_viewport().set_input_as_handled()

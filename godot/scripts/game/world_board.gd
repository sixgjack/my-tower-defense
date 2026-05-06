extends Node2D
## Draws the grid and entities; maps screen / touch to cell builds via parent `Gameplay`.
## 使用 SubViewport + Camera2D 時，觸控座標會自動對應到本地格子。

var _session: NeonSession
var _camera: Camera2D
var _tower_tex: Dictionary = {} # key -> Array[Texture2D]
var _enemy_tex: Dictionary = {} # key -> Array[Texture2D]

const SPRITE_PX: int = 16


func bind_session(session: NeonSession) -> void:
	_session = session
	_ensure_camera()
	_build_sprite_cache()


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
	# Camera2D zoom > 1 means zoom-out; to fit world we use world/screen ratio (not inverse).
	var fit_zoom: float = maxf(map_sz.x / safe_w, map_sz.y / safe_h)
	# Slightly zoom in so board reads better on large monitors.
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

	draw_rect(Rect2(Vector2.ZERO, Vector2(cols * cs, rows * cs)), bg)

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
			draw_rect(rect, fill)
			draw_rect(rect, grid_line, false, 1.0)

	var anim_tick: int = int(_session.tick_count / 8)

	for t in _session.towers:
		var tr: int = int(t["r"])
		var tc: int = int(t["c"])
		var rect3 := Rect2(Vector2(tc * cs + 4, tr * cs + 4), Vector2(cs - 8, cs - 8))
		var key: String = String(t["key"])
		var tower_frames: Array = _tower_tex.get(key, [])
		var tex: Texture2D = _pick_frame(tower_frames, anim_tick + int(t.get("id", 0)))
		if tex != null:
			draw_texture_rect(tex, rect3, false)
		else:
			draw_rect(rect3, _tower_color(key))
		_draw_tower_accent(rect3, key, anim_tick)
		draw_rect(rect3, Color(1, 1, 1, 0.8), false, 1.5)

	for e in _session.enemies:
		var px: float = float(e["c"]) + float(e.get("x_offset", 0.0))
		var py: float = float(e["r"]) + float(e.get("y_offset", 0.0))
		var center := Vector2((px + 0.5) * cs, (py + 0.5) * cs)
		var scale: float = float(e.get("scale", 1.0))
		var size_px: float = 28.0 * scale
		var enemy_rect := Rect2(center - Vector2(size_px, size_px) * 0.5, Vector2(size_px, size_px))
		var enemy_key: String = _enemy_key(e)
		var enemy_frames: Array = _enemy_tex.get(enemy_key, [])
		var enemy_tex: Texture2D = _pick_frame(enemy_frames, anim_tick + int(e.get("id", 0)))
		if enemy_tex != null:
			draw_texture_rect(enemy_tex, enemy_rect, false)
		else:
			var rad: float = 12.0 * scale
			draw_circle(center, rad + 2.0, Color.BLACK)
			draw_circle(center, rad, e.get("color", Color.WHITE))
		_draw_enemy_hp_bar(enemy_rect, e)

	for p in _session.projectiles:
		_draw_projectile(p, cs, anim_tick)

	var fnt := ThemeDB.fallback_font
	for ft in _session.float_texts:
		var fr: int = int(ft["r"])
		var fc: int = int(ft["c"])
		var pos2 := Vector2(fc * cs + 4, fr * cs + 14)
		draw_string(fnt, pos2, String(ft.get("text", "")), HORIZONTAL_ALIGNMENT_LEFT, -1, 12, ft.get("color", Color.WHITE))


func _tower_color(key: String) -> Color:
	var defs: Dictionary = TowerCatalog.towers()
	if defs.has(key):
		return defs[key].get("color", Color.GRAY)
	return Color.GRAY


func _enemy_key(e: Dictionary) -> String:
	return "%s|%s" % [
		String(e.get("name", "Enemy")),
		String(e.get("is_boss", false)),
	]


func _build_sprite_cache() -> void:
	_tower_tex.clear()
	_enemy_tex.clear()
	var tdefs: Dictionary = TowerCatalog.towers()
	for key in tdefs.keys():
		var data: Dictionary = tdefs[key]
		var base_col: Color = data.get("color", Color.GRAY)
		_tower_tex[String(key)] = _make_tower_frames(String(key), base_col)
	var enemies: Array[Dictionary] = EnemyCatalog.all_types()
	for e in enemies:
		_enemy_tex[_enemy_key(e)] = _make_enemy_frames(
			String(e.get("name", "Enemy")),
			Color.from_string(String(e.get("color", "#ffffff")), Color.WHITE),
			bool(e.get("is_boss", false))
		)


func _make_tower_frames(key: String, base: Color) -> Array:
	var frames: Array = []
	for frame_i in range(2):
		var img := Image.create(SPRITE_PX, SPRITE_PX, false, Image.FORMAT_RGBA8)
		img.fill(Color(0, 0, 0, 0))
		var dark := base.darkened(0.45)
		var light := base.lightened(0.3 + 0.08 * frame_i)
		_fill_rect(img, Rect2i(3, 3, 10, 10), dark)
		_fill_rect(img, Rect2i(4, 4, 8, 8), base)
		_fill_rect(img, Rect2i(6, 6, 4, 4), light)
		# Barrel / emitter style per tower type.
		if key.find("SNIPER") >= 0:
			_fill_rect(img, Rect2i(10, 5, 5, 2), Color(0.95, 0.3, 0.3))
		elif key.find("CANNON") >= 0:
			_fill_rect(img, Rect2i(9, 5, 4, 4), Color(0.15, 0.16, 0.2))
		elif key.find("SHOTGUN") >= 0:
			_fill_rect(img, Rect2i(10, 5, 3, 3), Color(0.95, 0.55, 0.1))
		elif key.find("FREEZE") >= 0:
			_fill_rect(img, Rect2i(10, 5, 4, 2), Color(0.5, 0.85, 1.0))
		elif key.find("BURN") >= 0:
			_fill_rect(img, Rect2i(10, 4, 4, 4), Color(1.0, 0.38, 0.15))
		elif key.find("STUN") >= 0:
			_fill_rect(img, Rect2i(10, 5, 4, 2), Color(1.0, 0.9, 0.2))
		elif key.find("HEAL") >= 0:
			_fill_rect(img, Rect2i(7, 5, 2, 6), Color(0.2, 1.0, 0.6))
			_fill_rect(img, Rect2i(5, 7, 6, 2), Color(0.2, 1.0, 0.6))
		else:
			_fill_rect(img, Rect2i(10, 5, 4, 2), Color(1.0, 0.8, 0.2))
		frames.append(ImageTexture.create_from_image(img))
	return frames


func _make_enemy_frames(name: String, base: Color, is_boss: bool) -> Array:
	var frames: Array = []
	var family: String = _enemy_family(name)
	for frame_i in range(3):
		var img := Image.create(SPRITE_PX, SPRITE_PX, false, Image.FORMAT_RGBA8)
		img.fill(Color(0, 0, 0, 0))
		var dark := base.darkened(0.5)
		var light := base.lightened(0.2 + 0.05 * frame_i)
		var y_bob: int = 0 if frame_i == 1 else 1
		_fill_rect(img, Rect2i(4, 4 + y_bob, 8, 8), dark)
		_fill_rect(img, Rect2i(5, 5 + y_bob, 6, 6), base)
		_fill_rect(img, Rect2i(6, 6 + y_bob, 4, 2), light)
		_fill_rect(img, Rect2i(6, 8 + y_bob, 1, 1), Color.BLACK)
		_fill_rect(img, Rect2i(9, 8 + y_bob, 1, 1), Color.BLACK)
		_fill_rect(img, Rect2i(7, 10 + y_bob, 2, 1), Color(0.98, 0.85, 0.85, 0.9))
		_add_enemy_family_features(img, family, frame_i)
		if is_boss:
			_fill_rect(img, Rect2i(3, 3, 2, 2), Color(1.0, 0.25, 0.2))
			_fill_rect(img, Rect2i(11, 3, 2, 2), Color(1.0, 0.25, 0.2))
			_fill_rect(img, Rect2i(4, 12, 8, 2), Color(0.2, 0.2, 0.25, 0.9))
		frames.append(ImageTexture.create_from_image(img))
	return frames


func _enemy_family(name: String) -> String:
	var n := name.to_lower()
	if n.contains("virus") or n.contains("trojan") or n.contains("worm"):
		return "cyber"
	if n.contains("drone") or n.contains("glitch") or n.contains("titan"):
		return "robot"
	return "bug"


func _add_enemy_family_features(img: Image, family: String, frame_i: int) -> void:
	if family == "bug":
		_fill_rect(img, Rect2i(3, 7, 2, 1), Color(0.2, 0.2, 0.22))
		_fill_rect(img, Rect2i(11, 7, 2, 1), Color(0.2, 0.2, 0.22))
		_fill_rect(img, Rect2i(2 + frame_i, 11, 2, 1), Color(0.15, 0.15, 0.18))
	elif family == "robot":
		_fill_rect(img, Rect2i(6, 3, 4, 1), Color(0.65, 0.88, 1.0))
		_fill_rect(img, Rect2i(4, 12, 8, 1), Color(0.25, 0.25, 0.35))
	else:
		_fill_rect(img, Rect2i(4, 4, 1, 1), Color(0.35, 1.0, 0.55))
		_fill_rect(img, Rect2i(11, 4, 1, 1), Color(0.35, 1.0, 0.55))
		_fill_rect(img, Rect2i(7, 12, 2, 1), Color(0.35, 1.0, 0.55))


func _pick_frame(frames: Array, tick: int) -> Texture2D:
	if frames.is_empty():
		return null
	var idx: int = abs(tick) % frames.size()
	return frames[idx] as Texture2D


func _draw_tower_accent(rect3: Rect2, key: String, anim_tick: int) -> void:
	var pulse: float = 0.55 + 0.25 * sin(float(anim_tick) * 0.7)
	var center := rect3.get_center()
	if key.find("HEAL") >= 0:
		draw_circle(center, rect3.size.x * 0.12, Color(0.25, 1.0, 0.65, pulse))
	elif key.find("BURN") >= 0:
		draw_circle(center + Vector2(0, -rect3.size.y * 0.1), rect3.size.x * 0.10, Color(1.0, 0.42, 0.18, pulse))
	elif key.find("FREEZE") >= 0:
		draw_circle(center, rect3.size.x * 0.1, Color(0.55, 0.9, 1.0, pulse))
	elif key.find("STUN") >= 0:
		draw_line(center + Vector2(-4, -4), center + Vector2(4, 2), Color(1.0, 0.9, 0.3, pulse), 1.5)


func _draw_enemy_hp_bar(enemy_rect: Rect2, e: Dictionary) -> void:
	var hp: float = float(e.get("hp", 0.0))
	var max_hp: float = maxf(1.0, float(e.get("max_hp", 1.0)))
	var ratio: float = clampf(hp / max_hp, 0.0, 1.0)
	var w: float = enemy_rect.size.x * 0.78
	var h: float = maxf(2.0, enemy_rect.size.y * 0.08)
	var x: float = enemy_rect.position.x + (enemy_rect.size.x - w) * 0.5
	var y: float = enemy_rect.position.y - h - 2.0
	draw_rect(Rect2(Vector2(x, y), Vector2(w, h)), Color(0, 0, 0, 0.55))
	draw_rect(Rect2(Vector2(x + 1.0, y + 1.0), Vector2((w - 2.0) * ratio, h - 2.0)), Color(0.35, 1.0, 0.4))


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

	if style == "sniper":
		draw_line(start, target, Color(1.0, 0.35, 0.35, 0.65), 2.0)
		draw_circle(target, 2.5, Color(1.0, 0.8, 0.8, 0.85))
	elif style == "lightning":
		var wiggle := 2.0 + 1.4 * sin(float(anim_tick) * 1.1)
		var mid := (start + target) * 0.5 + Vector2(wiggle, -wiggle)
		draw_polyline(PackedVector2Array([start, mid, target]), Color(1.0, 0.92, 0.35, 0.95), 2.2)
	elif style == "fire":
		draw_circle(pos, 4.5, Color(1.0, 0.42, 0.2, 0.9))
		draw_circle(pos + Vector2(1, -1), 2.5, Color(1.0, 0.78, 0.35, 0.9))
	elif style == "ice":
		draw_rect(Rect2(pos - Vector2(3, 3), Vector2(6, 6)), Color(0.55, 0.9, 1.0, 0.95))
	elif style == "shotgun":
		draw_circle(pos, 3.2, Color(1.0, 0.7, 0.2, 0.85))
	else:
		draw_circle(pos, 3.8, col)


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
		_session.try_build_tower(r, c, key)
		queue_redraw()
	get_viewport().set_input_as_handled()

extends Node2D
## Draws the grid and entities; maps screen / touch to cell builds via parent `Gameplay`.
## 使用 SubViewport + Camera2D 時，觸控座標會自動對應到本地格子。

var _session: NeonSession
var _camera: Camera2D
var _tower_tex: Dictionary = {}
var _enemy_tex: Dictionary = {}

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
	var z: float = mini(container_size.x / map_sz.x, container_size.y / map_sz.y)
	z = clampf(z * 0.97, 0.18, 4.0)
	_camera.zoom = Vector2(z, z)
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

	for t in _session.towers:
		var tr: int = int(t["r"])
		var tc: int = int(t["c"])
		var rect3 := Rect2(Vector2(tc * cs + 4, tr * cs + 4), Vector2(cs - 8, cs - 8))
		var key: String = String(t["key"])
		var tex: Texture2D = _tower_tex.get(key, null)
		if tex:
			draw_texture_rect(tex, rect3, false)
		else:
			draw_rect(rect3, _tower_color(key))
		draw_rect(rect3, Color(1, 1, 1, 0.8), false, 1.5)

	for e in _session.enemies:
		var px: float = float(e["c"]) + float(e.get("x_offset", 0.0))
		var py: float = float(e["r"]) + float(e.get("y_offset", 0.0))
		var center := Vector2((px + 0.5) * cs, (py + 0.5) * cs)
		var scale: float = float(e.get("scale", 1.0))
		var size_px: float = 28.0 * scale
		var enemy_rect := Rect2(center - Vector2(size_px, size_px) * 0.5, Vector2(size_px, size_px))
		var enemy_key: String = _enemy_key(e)
		var enemy_tex: Texture2D = _enemy_tex.get(enemy_key, null)
		if enemy_tex:
			draw_texture_rect(enemy_tex, enemy_rect, false)
		else:
			var rad: float = 12.0 * scale
			draw_circle(center, rad + 2.0, Color.BLACK)
			draw_circle(center, rad, e.get("color", Color.WHITE))

	for p in _session.projectiles:
		var pos := Vector2(float(p["x"]) * cs + cs * 0.5, float(p["y"]) * cs + cs * 0.5)
		draw_circle(pos, 5.0, p.get("color", Color.YELLOW))

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
	return "%s|%s|%s" % [
		String(e.get("name", "Enemy")),
		String(e.get("color", "#ffffff")),
		String(e.get("is_boss", false)),
	]


func _build_sprite_cache() -> void:
	_tower_tex.clear()
	_enemy_tex.clear()
	var tdefs: Dictionary = TowerCatalog.towers()
	for key in tdefs.keys():
		var data: Dictionary = tdefs[key]
		var base_col: Color = data.get("color", Color.GRAY)
		_tower_tex[String(key)] = _make_tower_sprite(String(key), base_col)
	var enemies: Array[Dictionary] = EnemyCatalog.all_types()
	for e in enemies:
		_enemy_tex[_enemy_key(e)] = _make_enemy_sprite(
			String(e.get("name", "Enemy")),
			Color.from_string(String(e.get("color", "#ffffff")), Color.WHITE),
			bool(e.get("is_boss", false))
		)


func _make_tower_sprite(key: String, base: Color) -> Texture2D:
	var img := Image.create(SPRITE_PX, SPRITE_PX, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var dark := base.darkened(0.45)
	var light := base.lightened(0.3)
	_fill_rect(img, Rect2i(3, 3, 10, 10), dark)
	_fill_rect(img, Rect2i(4, 4, 8, 8), base)
	_fill_rect(img, Rect2i(6, 6, 4, 4), light)
	# Barrel / emitter style per tower type for quick readability.
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
	return ImageTexture.create_from_image(img)


func _make_enemy_sprite(_name: String, base: Color, is_boss: bool) -> Texture2D:
	var img := Image.create(SPRITE_PX, SPRITE_PX, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var dark := base.darkened(0.5)
	var light := base.lightened(0.25)
	_fill_rect(img, Rect2i(4, 4, 8, 8), dark)
	_fill_rect(img, Rect2i(5, 5, 6, 6), base)
	_fill_rect(img, Rect2i(6, 6, 4, 2), light)
	_fill_rect(img, Rect2i(6, 8, 1, 1), Color.BLACK)
	_fill_rect(img, Rect2i(9, 8, 1, 1), Color.BLACK)
	_fill_rect(img, Rect2i(7, 10, 2, 1), Color(0.98, 0.85, 0.85, 0.9))
	if is_boss:
		_fill_rect(img, Rect2i(3, 3, 2, 2), Color(1.0, 0.25, 0.2))
		_fill_rect(img, Rect2i(11, 3, 2, 2), Color(1.0, 0.25, 0.2))
		_fill_rect(img, Rect2i(4, 12, 8, 2), Color(0.2, 0.2, 0.25, 0.9))
	return ImageTexture.create_from_image(img)


func _fill_rect(img: Image, rect: Rect2i, c: Color) -> void:
	for y in range(rect.position.y, rect.position.y + rect.size.y):
		if y < 0 or y >= img.get_height():
			continue
		for x in range(rect.position.x, rect.position.x + rect.size.x):
			if x < 0 or x >= img.get_width():
				continue
			img.set_pixel(x, y, c)


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
	var inv: Transform2D = get_global_transform_with_canvas().affine_inverse()
	var local_p: Vector2 = inv * pos
	var c: int = int(floor(local_p.x / float(GameConstants.CELL_SIZE)))
	var r: int = int(floor(local_p.y / float(GameConstants.CELL_SIZE)))
	if r < 0 or c < 0 or r >= GameConstants.ROWS or c >= GameConstants.COLS:
		return
	var gp: Node = get_tree().current_scene
	if gp and gp.has_method("get_selected_tower"):
		var key: String = String(gp.call("get_selected_tower"))
		_session.try_build_tower(r, c, key)
		queue_redraw()
	get_viewport().set_input_as_handled()

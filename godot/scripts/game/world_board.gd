extends Node2D
## Draws the grid and entities; maps screen / touch to cell builds via parent `Gameplay`.

var _session: NeonSession


func bind_session(session: NeonSession) -> void:
	_session = session


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
		var col: Color = _tower_color(String(t["key"]))
		draw_rect(rect3, col)
		draw_rect(rect3, Color.WHITE, false, 2.0)

	for e in _session.enemies:
		var px: float = float(e["c"]) + float(e.get("x_offset", 0.0))
		var py: float = float(e["r"]) + float(e.get("y_offset", 0.0))
		var center := Vector2((px + 0.5) * cs, (py + 0.5) * cs)
		var rad: float = 14.0 * float(e.get("scale", 1.0))
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
	var parent_node := get_parent()
	if parent_node and parent_node.has_method("get_selected_tower"):
		var key: String = String(parent_node.call("get_selected_tower"))
		_session.try_build_tower(r, c, key)
		queue_redraw()
	get_viewport().set_input_as_handled()

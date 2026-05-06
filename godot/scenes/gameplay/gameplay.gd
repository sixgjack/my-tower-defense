class_name Gameplay
extends Node
## Gameplay root: React + Godot 並存時由此進入 Godot 客戶端；版面適配手機 / iPad / 桌面。

var selected_tower: String = "BASIC_RIFLE"

@onready var _session: NeonSession = $NeonSession
@onready var _world: Node2D = $WorldBoard

var _money_label: Label
var _lives_label: Label
var _wave_label: Label
var _notify_label: Label
var _tower_group: ButtonGroup

var _play_container: Control
var _play_viewport: SubViewport
var _hud_root: Control
var _top_bar: HBoxContainer
var _bottom_bar: HBoxContainer
var _drag_tower_key: String = ""
var _is_dragging_tower: bool = false
var _drag_preview: Panel
var _drag_preview_label: Label
var _web_player_uid: String = ""
var _question_bank: QuestionBank
var _question_overlay: Panel
var _question_prompt: Label
var _question_feedback: Label
var _question_buttons: Array[Button] = []
var _pending_build: Dictionary = {}
var _question_open: bool = false
var _question_set_id: String = "mixed"
var _current_question_request_id: String = ""
var _current_question_id: String = ""
var _waiting_for_judgement: bool = false

const HUD_STATS_TOP: float = 48.0
const HUD_BOTTOM_BASE: float = 132.0


func _ready() -> void:
	_question_bank = QuestionBank.new()
	_tower_group = ButtonGroup.new()
	_setup_play_viewport()
	_world.bind_session(_session)
	_build_hud()
	get_viewport().size_changed.connect(_schedule_play_viewport_layout)
	_session.money_changed.connect(_on_money)
	_session.lives_changed.connect(_on_lives)
	_session.wave_changed.connect(_on_wave)
	_session.notification_changed.connect(_on_notification)
	_session.game_over_changed.connect(_on_game_over)
	_refresh_labels()
	_schedule_play_viewport_layout()
	_build_question_overlay()
	_web_player_uid = _read_web_query_param("uid")
	_question_set_id = _read_web_query_param("qs")
	if _question_set_id.is_empty():
		_question_set_id = "mixed"
	_install_web_bridge_listener()
	_emit_web_event("godot.ready", {"uid": _web_player_uid})
	if OS.has_feature("web"):
		_settle_web_layout_async()


func _settle_web_layout_async() -> void:
	## Layout settles slowly on Wasm — retry until the SubViewport has a real size.
	var tree := get_tree()
	for _i in 12:
		await tree.process_frame
		_update_play_viewport_layout()
		if _play_viewport and _play_viewport.size.x > 2:
			break


func _schedule_play_viewport_layout() -> void:
	## Defer once so Container.size matches anchors after sizing pass.
	call_deferred("_update_play_viewport_layout")


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_WINDOW_FOCUS_IN or what == NOTIFICATION_APPLICATION_RESUMED:
		_schedule_play_viewport_layout()


func _setup_play_viewport() -> void:
	var game_layer := CanvasLayer.new()
	game_layer.layer = 0
	add_child(game_layer)

	_play_container = Control.new()
	_play_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	_play_container.anchor_left = 0.0
	_play_container.anchor_top = 0.0
	_play_container.anchor_right = 1.0
	_play_container.anchor_bottom = 1.0
	_play_container.offset_left = 0.0
	_play_container.offset_top = HUD_STATS_TOP
	_play_container.offset_right = 0.0
	_play_container.offset_bottom = -HUD_BOTTOM_BASE
	_play_container.clip_contents = true
	game_layer.add_child(_play_container)

	var svc := SubViewportContainer.new()
	svc.set_anchors_preset(Control.PRESET_FULL_RECT)
	svc.stretch = true
	_play_container.add_child(svc)

	_play_viewport = SubViewport.new()
	_play_viewport.handle_input_locally = true
	_play_viewport.disable_3d = true
	_play_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_play_viewport.transparent_bg = false
	# Set a non-zero initial size so something renders before layout settles
	_play_viewport.size = Vector2i(1280, 580)
	svc.add_child(_play_viewport)

	remove_child(_world)
	_play_viewport.add_child(_world)
	_world.position = Vector2.ZERO


func _safe_insets() -> Vector4:
	## left, top, right, bottom — notch / home-indicator padding (desktop = 0).
	## Wasm: safe-area geometry is unreliable; wrong values shrink the SubViewport into a postage stamp.
	if OS.has_feature("web"):
		return Vector4.ZERO
	var win := get_window()
	var sid: int = win.get_window_id()
	var wpos := DisplayServer.window_get_position(sid)
	var safe := DisplayServer.get_display_safe_area()
	var left: float = maxf(0.0, float(safe.position.x - wpos.x))
	var top: float = maxf(0.0, float(safe.position.y - wpos.y))
	var right: float = maxf(0.0, float(wpos.x + win.size.x - safe.position.x - safe.size.x))
	var bottom: float = maxf(0.0, float(wpos.y + win.size.y - safe.position.y - safe.size.y))
	return Vector4(left, top, right, bottom)


func _update_play_viewport_layout() -> void:
	if _play_viewport == null or _play_container == null:
		return
	var ins := _safe_insets()
	var vp := get_viewport().get_visible_rect().size
	var bottom_hud: float = clampf(vp.y * 0.13, HUD_BOTTOM_BASE, 220.0) + ins.w
	var top_gap: float = HUD_STATS_TOP + ins.y

	_play_container.offset_top = top_gap
	_play_container.offset_left = ins.x
	_play_container.offset_right = -ins.z
	_play_container.offset_bottom = -bottom_hud

	var sz := _play_container.size
	if sz.x < 2.0 or sz.y < 2.0:
		# Layout hasn't settled yet — compute size directly from viewport rect
		sz = Vector2(
			maxf(1.0, vp.x - ins.x - ins.z),
			maxf(1.0, vp.y - top_gap - bottom_hud)
		)
	_play_viewport.size = Vector2i(int(sz.x), int(sz.y))
	_world.configure_camera_for_size(sz)

	if _hud_root:
		_apply_hud_scale(vp)
	if _top_bar:
		_top_bar.offset_top = 8.0 + ins.y
	if _bottom_bar:
		_bottom_bar.offset_bottom = -(8.0 + ins.w)


func _apply_hud_scale(vp: Vector2) -> void:
	var fs: int = clampi(int(14.0 * mini(vp.x, vp.y) / 520.0), 12, 22)
	if _money_label:
		_money_label.add_theme_font_size_override("font_size", fs + 2)
	if _lives_label:
		_lives_label.add_theme_font_size_override("font_size", fs + 2)
	if _wave_label:
		_wave_label.add_theme_font_size_override("font_size", fs + 2)
	if _notify_label:
		_notify_label.add_theme_font_size_override("font_size", mini(fs + 8, 26))


func _process(_delta: float) -> void:
	_session.tick()
	_poll_web_bridge_messages()
	_world.queue_redraw()


func get_selected_tower() -> String:
	return selected_tower


func _make_stylebox(bg: Color, border: Color, border_px: int = 2, radius: int = 6) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(border_px)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 6.0
	s.content_margin_right = 6.0
	s.content_margin_top = 4.0
	s.content_margin_bottom = 4.0
	return s


func _build_hud() -> void:
	var hud := CanvasLayer.new()
	hud.layer = 10
	add_child(hud)

	_hud_root = Control.new()
	_hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(_hud_root)

	# ── Top bar background panel ──
	var top_panel := Panel.new()
	top_panel.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top_panel.offset_bottom = HUD_STATS_TOP + 2
	var top_style := _make_stylebox(Color(0.04, 0.04, 0.07, 0.96), Color(0.25, 0.55, 1.0, 0.5), 0, 0)
	top_style.set_border_width(SIDE_BOTTOM, 2)
	top_panel.add_theme_stylebox_override("panel", top_style)
	top_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_root.add_child(top_panel)

	_top_bar = HBoxContainer.new()
	_top_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_top_bar.offset_left = 14
	_top_bar.offset_top = 7
	_top_bar.offset_right = -14
	_top_bar.offset_bottom = 44
	_top_bar.add_theme_constant_override("separation", 20)
	_hud_root.add_child(_top_bar)

	_money_label = Label.new()
	_money_label.add_theme_color_override("font_color", Color(0.28, 1.0, 0.52))
	_money_label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.8))
	_money_label.add_theme_constant_override("shadow_offset_x", 1)
	_money_label.add_theme_constant_override("shadow_offset_y", 1)
	_top_bar.add_child(_money_label)

	_lives_label = Label.new()
	_lives_label.add_theme_color_override("font_color", Color(1.0, 0.28, 0.32))
	_lives_label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.8))
	_lives_label.add_theme_constant_override("shadow_offset_x", 1)
	_lives_label.add_theme_constant_override("shadow_offset_y", 1)
	_top_bar.add_child(_lives_label)

	_wave_label = Label.new()
	_wave_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.18))
	_wave_label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.8))
	_wave_label.add_theme_constant_override("shadow_offset_x", 1)
	_wave_label.add_theme_constant_override("shadow_offset_y", 1)
	_top_bar.add_child(_wave_label)

	# ── Notification label (center-top, styled) ──
	_notify_label = Label.new()
	_notify_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_notify_label.offset_left = -240
	_notify_label.offset_top = 46
	_notify_label.offset_right = 240
	_notify_label.offset_bottom = 90
	_notify_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notify_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_notify_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_notify_label.add_theme_color_override("font_color", Color(1.0, 0.92, 0.3))
	_notify_label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.9))
	_notify_label.add_theme_constant_override("shadow_offset_x", 2)
	_notify_label.add_theme_constant_override("shadow_offset_y", 2)
	_hud_root.add_child(_notify_label)

	# ── Bottom bar background panel ──
	var bot_panel := Panel.new()
	bot_panel.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bot_panel.offset_top = -126
	var bot_style := _make_stylebox(Color(0.04, 0.04, 0.07, 0.96), Color(0.25, 0.55, 1.0, 0.5), 0, 0)
	bot_style.set_border_width(SIDE_TOP, 2)
	bot_panel.add_theme_stylebox_override("panel", bot_style)
	bot_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_root.add_child(bot_panel)

	_bottom_bar = HBoxContainer.new()
	_bottom_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_bottom_bar.offset_left = 8
	_bottom_bar.offset_top = -118
	_bottom_bar.offset_right = -8
	_bottom_bar.offset_bottom = -8
	_bottom_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_bottom_bar.add_theme_constant_override("separation", 8)
	_hud_root.add_child(_bottom_bar)

	var scroll := ScrollContainer.new()
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size.y = 100.0
	_bottom_bar.add_child(scroll)

	var tower_bar := HBoxContainer.new()
	tower_bar.add_theme_constant_override("separation", 5)
	tower_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	scroll.add_child(tower_bar)

	var defs := TowerCatalog.towers()
	var vp_size := get_viewport().get_visible_rect().size
	var narrow: bool = vp_size.x < 560.0
	var btn_h: float = clampf(vp_size.y * 0.09, 72.0, 100.0)
	var btn_w: float = 72.0 if narrow else 96.0

	for key in defs.keys():
		var stats: Dictionary = defs[key]
		var tower_col: Color = stats.get("color", Color(0.5, 0.5, 0.6))
		var b := Button.new()
		b.toggle_mode = true
		b.button_group = _tower_group
		var icon: String = String(stats.get("icon", "?"))
		var name_str: String = String(stats.get("name", key))
		var cost_str: String = "$%d" % int(stats.get("cost", 0))
		if narrow:
			b.text = "%s\n%s" % [icon, cost_str]
		else:
			b.text = "%s %s\n%s" % [icon, name_str, cost_str]
		b.tooltip_text = "%s — %s" % [name_str, cost_str]
		b.custom_minimum_size = Vector2(btn_w, btn_h)

		# Normal style — dark tinted with tower colour border
		var dark_bg := Color(tower_col.r * 0.18, tower_col.g * 0.18, tower_col.b * 0.18, 0.92)
		var s_normal := _make_stylebox(dark_bg, Color(tower_col.r * 0.7, tower_col.g * 0.7, tower_col.b * 0.7, 0.8), 2, 5)
		var s_hover := _make_stylebox(Color(tower_col.r * 0.32, tower_col.g * 0.32, tower_col.b * 0.32, 0.96), tower_col, 2, 5)
		var s_pressed := _make_stylebox(Color(tower_col.r * 0.45, tower_col.g * 0.45, tower_col.b * 0.45, 1.0), Color(1.0, 1.0, 1.0, 0.95), 3, 5)
		var s_focus := _make_stylebox(Color(tower_col.r * 0.45, tower_col.g * 0.45, tower_col.b * 0.45, 1.0), Color(1.0, 1.0, 1.0, 0.95), 3, 5)
		b.add_theme_stylebox_override("normal", s_normal)
		b.add_theme_stylebox_override("hover", s_hover)
		b.add_theme_stylebox_override("pressed", s_pressed)
		b.add_theme_stylebox_override("focus", s_focus)
		b.add_theme_color_override("font_color", Color(0.92, 0.92, 0.95))
		b.add_theme_color_override("font_pressed_color", Color(1.0, 1.0, 1.0))
		b.add_theme_color_override("font_hover_color", Color(1.0, 1.0, 1.0))
		b.add_theme_font_size_override("font_size", 11)

		b.toggled.connect(_on_tower_toggled.bind(key))
		b.gui_input.connect(_on_tower_button_gui_input.bind(String(key), b))
		tower_bar.add_child(b)
		if key == selected_tower:
			b.button_pressed = true

	# ── Side buttons (Restart / Menu) ──
	var side := VBoxContainer.new()
	side.add_theme_constant_override("separation", 6)
	_bottom_bar.add_child(side)

	var s_restart := _make_stylebox(Color(0.08, 0.18, 0.08, 0.92), Color(0.28, 0.88, 0.38, 0.8), 2, 5)
	var s_restart_h := _make_stylebox(Color(0.12, 0.28, 0.14, 0.96), Color(0.4, 1.0, 0.5, 0.9), 2, 5)
	var restart := Button.new()
	restart.text = "⟳ Restart"
	restart.custom_minimum_size = Vector2(82, 44)
	restart.add_theme_stylebox_override("normal", s_restart)
	restart.add_theme_stylebox_override("hover", s_restart_h)
	restart.add_theme_color_override("font_color", Color(0.4, 1.0, 0.5))
	restart.add_theme_font_size_override("font_size", 13)
	restart.pressed.connect(_on_restart)
	side.add_child(restart)

	var s_menu := _make_stylebox(Color(0.08, 0.08, 0.18, 0.92), Color(0.35, 0.45, 0.9, 0.75), 2, 5)
	var s_menu_h := _make_stylebox(Color(0.12, 0.12, 0.28, 0.96), Color(0.5, 0.6, 1.0, 0.9), 2, 5)
	var menu := Button.new()
	menu.text = "← Menu"
	menu.custom_minimum_size = Vector2(82, 44)
	menu.add_theme_stylebox_override("normal", s_menu)
	menu.add_theme_stylebox_override("hover", s_menu_h)
	menu.add_theme_color_override("font_color", Color(0.6, 0.7, 1.0))
	menu.add_theme_font_size_override("font_size", 13)
	menu.pressed.connect(_on_menu)
	side.add_child(menu)

	_apply_hud_scale(vp_size)
	_build_drag_preview()


func _build_drag_preview() -> void:
	if _hud_root == null:
		return
	_drag_preview = Panel.new()
	_drag_preview.visible = false
	_drag_preview.size = Vector2(84, 30)
	_drag_preview.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_drag_preview.z_index = 100
	_drag_preview.modulate = Color(1, 1, 1, 0.92)
	_hud_root.add_child(_drag_preview)

	_drag_preview_label = Label.new()
	_drag_preview_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_drag_preview_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_drag_preview_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_drag_preview_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_drag_preview.add_child(_drag_preview_label)


func _on_tower_button_gui_input(event: InputEvent, tower_key: String, button: Button) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			_start_tower_drag(tower_key, mb.position, button.text)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if st.pressed:
			_start_tower_drag(tower_key, st.position, button.text)
			get_viewport().set_input_as_handled()


func _start_tower_drag(tower_key: String, pointer_pos: Vector2, button_text: String) -> void:
	_is_dragging_tower = true
	_drag_tower_key = tower_key
	selected_tower = tower_key
	_drag_preview_label.text = button_text
	_drag_preview.visible = true
	_update_drag_preview(pointer_pos)


func _update_drag_preview(pointer_pos: Vector2) -> void:
	if not _is_dragging_tower or _drag_preview == null:
		return
	_drag_preview.position = pointer_pos + Vector2(14, 14)
	var cell: Vector2i = _world.screen_to_cell(pointer_pos)
	var in_bounds: bool = (
		cell.x >= 0 and cell.y >= 0 and cell.x < GameConstants.COLS and cell.y < GameConstants.ROWS
	)
	_drag_preview.modulate = Color(0.8, 1.0, 0.85, 0.92) if in_bounds else Color(1.0, 0.75, 0.75, 0.92)


func _finish_tower_drag(pointer_pos: Vector2) -> void:
	if not _is_dragging_tower:
		return
	var cell: Vector2i = _world.screen_to_cell(pointer_pos)
	request_build_with_question(cell.y, cell.x, _drag_tower_key)
	_is_dragging_tower = false
	_drag_tower_key = ""
	if _drag_preview:
		_drag_preview.visible = false


func _on_tower_toggled(pressed: bool, key: String) -> void:
	if pressed:
		selected_tower = key


func _input(event: InputEvent) -> void:
	if not _is_dragging_tower:
		return
	if event is InputEventMouseMotion:
		_update_drag_preview((event as InputEventMouseMotion).position)
	elif event is InputEventScreenDrag:
		_update_drag_preview((event as InputEventScreenDrag).position)
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and not mb.pressed:
			_finish_tower_drag(mb.position)
			get_viewport().set_input_as_handled()
	elif event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if not st.pressed:
			_finish_tower_drag(st.position)
			get_viewport().set_input_as_handled()


func request_build_with_question(r: int, c: int, tower_key: String) -> void:
	if _question_open:
		return
	if r < 0 or c < 0 or r >= GameConstants.ROWS or c >= GameConstants.COLS:
		return
	_pending_build = {"r": r, "c": c, "key": tower_key}
	if OS.has_feature("web"):
		_request_question_from_bridge()
	else:
		_open_question_gate_local()


func _build_question_overlay() -> void:
	_question_overlay = Panel.new()
	_question_overlay.set_anchors_preset(Control.PRESET_CENTER)
	_question_overlay.offset_left = -300
	_question_overlay.offset_top = -210
	_question_overlay.offset_right = 300
	_question_overlay.offset_bottom = 210
	_question_overlay.visible = false
	_question_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	var q_style := _make_stylebox(Color(0.04, 0.05, 0.10, 0.98), Color(0.28, 0.62, 1.0, 0.9), 2, 10)
	_question_overlay.add_theme_stylebox_override("panel", q_style)
	_hud_root.add_child(_question_overlay)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 18
	root.offset_top = 14
	root.offset_right = -18
	root.offset_bottom = -14
	root.add_theme_constant_override("separation", 9)
	_question_overlay.add_child(root)

	# Header bar
	var header_panel := Panel.new()
	header_panel.custom_minimum_size = Vector2(0, 32)
	var h_style := _make_stylebox(Color(0.12, 0.22, 0.48, 0.9), Color(0.28, 0.62, 1.0, 0.6), 0, 6)
	header_panel.add_theme_stylebox_override("panel", h_style)
	root.add_child(header_panel)

	var title := Label.new()
	title.set_anchors_preset(Control.PRESET_FULL_RECT)
	title.text = "  ANSWER TO BUILD"
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", Color(0.5, 0.82, 1.0))
	header_panel.add_child(title)

	# Question prompt
	_question_prompt = Label.new()
	_question_prompt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_question_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_question_prompt.add_theme_font_size_override("font_size", 16)
	_question_prompt.add_theme_color_override("font_color", Color(0.95, 0.95, 1.0))
	_question_prompt.custom_minimum_size = Vector2(0, 42)
	root.add_child(_question_prompt)

	# Separator line
	var sep := HSeparator.new()
	var sep_style := StyleBoxFlat.new()
	sep_style.bg_color = Color(0.28, 0.62, 1.0, 0.35)
	sep.add_theme_stylebox_override("separator", sep_style)
	root.add_child(sep)

	# Answer buttons
	var answer_colors := [
		Color(0.22, 0.72, 0.30),  # A — green
		Color(0.72, 0.22, 0.22),  # B — red
		Color(0.22, 0.42, 0.82),  # C — blue
		Color(0.72, 0.52, 0.08),  # D — amber
	]
	var labels := ["A", "B", "C", "D"]
	for i in range(4):
		var b := Button.new()
		b.text = "-"
		b.custom_minimum_size = Vector2(0, 38)
		var ac := answer_colors[i]
		var s_n := _make_stylebox(Color(ac.r * 0.22, ac.g * 0.22, ac.b * 0.22, 0.92), Color(ac.r * 0.7, ac.g * 0.7, ac.b * 0.7, 0.7), 2, 5)
		var s_h := _make_stylebox(Color(ac.r * 0.38, ac.g * 0.38, ac.b * 0.38, 0.96), ac, 2, 5)
		b.add_theme_stylebox_override("normal", s_n)
		b.add_theme_stylebox_override("hover", s_h)
		b.add_theme_color_override("font_color", Color(0.88, 0.92, 1.0))
		b.add_theme_color_override("font_hover_color", Color(1.0, 1.0, 1.0))
		b.add_theme_font_size_override("font_size", 13)
		b.pressed.connect(_on_question_answer_pressed.bind(i))
		root.add_child(b)
		_question_buttons.append(b)

	# Feedback label
	_question_feedback = Label.new()
	_question_feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_question_feedback.add_theme_font_size_override("font_size", 13)
	_question_feedback.add_theme_color_override("font_color", Color(1.0, 0.88, 0.28))
	root.add_child(_question_feedback)


func _open_question_gate_local() -> void:
	var q: Dictionary = _question_bank.random_question()
	var choices: Array = q.get("choices", [])
	_question_prompt.text = String(q.get("prompt", "Question"))
	for i in range(_question_buttons.size()):
		var btn := _question_buttons[i]
		btn.disabled = i >= choices.size()
		btn.text = "%d) %s" % [i + 1, String(choices[i]) if i < choices.size() else ""]
		btn.set_meta("answerIndex", int(q.get("answerIndex", 0)))
		btn.set_meta("verifyMode", "local")
	_question_feedback.text = ""
	_question_overlay.visible = true
	_question_open = true
	_waiting_for_judgement = false


func _on_question_answer_pressed(choice_idx: int) -> void:
	if not _question_open:
		return
	var verify_mode: String = String(_question_buttons[0].get_meta("verifyMode"))
	if verify_mode == "bridge":
		if _waiting_for_judgement:
			return
		_waiting_for_judgement = true
		_question_feedback.text = "Checking..."
		_set_question_buttons_disabled(true)
		var selected_text := String(_question_buttons[choice_idx].get_meta("choiceText"))
		_emit_web_event("godot.questionAnswer", {
			"requestId": _current_question_request_id,
			"questionId": _current_question_id,
			"selected": selected_text,
			"selectedIndex": choice_idx,
			"uid": _web_player_uid,
		})
		return

	var correct_idx: int = int(_question_buttons[0].get_meta("answerIndex"))
	if choice_idx == correct_idx:
		_apply_pending_build(true)
	else:
		_apply_pending_build(false)


func _on_money(v: int) -> void:
	_money_label.text = "$%d" % v


func _on_lives(v: int) -> void:
	_lives_label.text = "❤ %d" % v


func _on_wave(v: int) -> void:
	_wave_label.text = "Wave %d" % v


func _on_notification(text: String, _kind: String) -> void:
	if text.is_empty():
		_notify_label.text = ""
	else:
		_notify_label.text = text


func _on_game_over(is_over: bool) -> void:
	if is_over:
		_notify_label.text = "GAME OVER — tap Restart"
		_emit_web_event("godot.runResult", {
			"uid": _web_player_uid,
			"wave": _session.wave,
			"enemiesKilled": _session.total_enemies_killed,
			"moneyEarned": _session.total_money_earned,
			"towersBuilt": _session.towers.size(),
		})


func _read_web_query_param(name: String) -> String:
	if not OS.has_feature("web"):
		return ""
	var js := "(() => { try { return new URLSearchParams(window.location.search).get('%s') || ''; } catch(_e) { return ''; } })();" % name
	var val: Variant = JavaScriptBridge.eval(js, true)
	return String(val)


func _emit_web_event(event_type: String, payload: Dictionary) -> void:
	if not OS.has_feature("web"):
		return
	var json_payload := JSON.stringify(payload)
	var js := "(() => { const msg = { type: '%s', payload: %s }; try { if (window.parent && window.parent !== window) { window.parent.postMessage(msg, window.location.origin); } if (window.opener && !window.opener.closed) { window.opener.postMessage(msg, window.location.origin); } window.postMessage(msg, window.location.origin); } catch(_e) {} })();" % [event_type, json_payload]
	JavaScriptBridge.eval(js, false)


func _install_web_bridge_listener() -> void:
	if not OS.has_feature("web"):
		return
	var js := "(() => { if (window.__godotInboundInstalled) return; window.__godotInboundInstalled = true; window.__godotInbound = window.__godotInbound || []; window.addEventListener('message', (evt) => { try { if (evt.origin !== window.location.origin) return; const d = evt.data || {}; if (d.type === 'godot.questionPayload' || d.type === 'godot.questionJudgement') { window.__godotInbound.push(d); } } catch(_e) {} }); })();"
	JavaScriptBridge.eval(js, false)


func _poll_web_bridge_messages() -> void:
	if not OS.has_feature("web"):
		return
	var raw: Variant = JavaScriptBridge.eval("(() => { try { const q = window.__godotInbound || []; window.__godotInbound = []; return JSON.stringify(q); } catch(_e) { return '[]'; } })();", true)
	var txt: String = String(raw)
	if txt.is_empty():
		return
	var parsed: Variant = JSON.parse_string(txt)
	if not (parsed is Array):
		return
	for item in parsed:
		if not (item is Dictionary):
			continue
		var typ: String = String(item.get("type", ""))
		var payload: Dictionary = item.get("payload", {})
		if typ == "godot.questionPayload":
			_on_question_payload(payload)
		elif typ == "godot.questionJudgement":
			_on_question_judgement(payload)


func _request_question_from_bridge() -> void:
	_current_question_request_id = "%d_%d" % [Time.get_unix_time_from_system(), randi() % 100000]
	_emit_web_event("godot.questionRequest", {
		"requestId": _current_question_request_id,
		"uid": _web_player_uid,
		"questionSetId": _question_set_id,
		"action": "build_tower",
	})
	# If host bridge is unavailable, fall back to local bank after a short timeout.
	await get_tree().create_timer(0.9).timeout
	if not _question_open and not _pending_build.is_empty() and _current_question_id.is_empty():
		_open_question_gate_local()


func _on_question_payload(payload: Dictionary) -> void:
	if String(payload.get("requestId", "")) != _current_question_request_id:
		return
	var choices: Array = payload.get("choices", [])
	_current_question_id = String(payload.get("questionId", ""))
	_question_prompt.text = String(payload.get("prompt", "Question"))
	for i in range(_question_buttons.size()):
		var btn := _question_buttons[i]
		btn.disabled = i >= choices.size()
		btn.text = "%d) %s" % [i + 1, String(choices[i]) if i < choices.size() else ""]
		btn.set_meta("choiceText", String(choices[i]) if i < choices.size() else "")
		btn.set_meta("verifyMode", "bridge")
	_question_feedback.text = ""
	_set_question_buttons_disabled(false)
	_question_overlay.visible = true
	_question_open = true
	_waiting_for_judgement = false


func _on_question_judgement(payload: Dictionary) -> void:
	if String(payload.get("requestId", "")) != _current_question_request_id:
		return
	var allow: bool = bool(payload.get("allow", false))
	_apply_pending_build(allow)


func _apply_pending_build(allow: bool) -> void:
	if allow:
		var ok: bool = _session.try_build_tower(
			int(_pending_build.get("r", -1)),
			int(_pending_build.get("c", -1)),
			String(_pending_build.get("key", ""))
		)
		_question_feedback.text = "Correct! Action %s." % ("done" if ok else "blocked")
	else:
		_question_feedback.text = "Incorrect. Action cancelled."
	_emit_web_event("godot.questionResult", {
		"uid": _web_player_uid,
		"correct": allow,
		"action": "build_tower",
		"requestId": _current_question_request_id,
		"questionId": _current_question_id,
	})
	_pending_build = {}
	_current_question_request_id = ""
	_current_question_id = ""
	_question_open = false
	_waiting_for_judgement = false
	_set_question_buttons_disabled(true)
	await get_tree().create_timer(0.5).timeout
	_question_overlay.visible = false


func _set_question_buttons_disabled(v: bool) -> void:
	for b in _question_buttons:
		b.disabled = v


func _refresh_labels() -> void:
	_on_money(_session.money)
	_on_lives(_session.lives)
	_on_wave(_session.wave)


func _on_restart() -> void:
	_session.start_new_game()
	_refresh_labels()
	_notify_label.text = ""


func _on_menu() -> void:
	get_tree().change_scene_to_file("res://scenes/main/main.tscn")

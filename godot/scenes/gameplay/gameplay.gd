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
	_emit_web_event("godot.ready", {"uid": _web_player_uid})
	if OS.has_feature("web"):
		_settle_web_layout_async()


func _settle_web_layout_async() -> void:
	## Canvas + Control layout settles a few frames after first paint on Wasm.
	var tree := get_tree()
	for _i in 4:
		await tree.process_frame
	_update_play_viewport_layout()


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
		return
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
	_world.queue_redraw()


func get_selected_tower() -> String:
	return selected_tower


func _build_hud() -> void:
	var hud := CanvasLayer.new()
	hud.layer = 10
	add_child(hud)

	_hud_root = Control.new()
	_hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(_hud_root)

	_top_bar = HBoxContainer.new()
	_top_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_top_bar.offset_left = 12
	_top_bar.offset_top = 8
	_top_bar.offset_right = -12
	_top_bar.offset_bottom = 44
	_top_bar.add_theme_constant_override("separation", 16)
	_hud_root.add_child(_top_bar)

	_money_label = Label.new()
	_lives_label = Label.new()
	_wave_label = Label.new()
	_top_bar.add_child(_money_label)
	_top_bar.add_child(_lives_label)
	_top_bar.add_child(_wave_label)

	_notify_label = Label.new()
	_notify_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_notify_label.offset_top = 44
	_notify_label.offset_bottom = 92
	_notify_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notify_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hud_root.add_child(_notify_label)

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
	scroll.custom_minimum_size.y = 56.0
	_bottom_bar.add_child(scroll)

	var tower_bar := HBoxContainer.new()
	tower_bar.add_theme_constant_override("separation", 6)
	tower_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	scroll.add_child(tower_bar)

	var defs := TowerCatalog.towers()
	var narrow: bool = get_viewport().get_visible_rect().size.x < 560.0
	for key in defs.keys():
		var stats: Dictionary = defs[key]
		var b := Button.new()
		b.toggle_mode = true
		b.button_group = _tower_group
		if narrow:
			b.text = String(stats.get("icon", "?"))
		else:
			b.text = "%s %s" % [String(stats.get("icon", "?")), String(stats.get("name", key))]
		b.tooltip_text = "%s — $%d" % [String(stats.get("name", key)), int(stats.get("cost", 0))]
		b.custom_minimum_size = Vector2(52 if narrow else 108, maxf(48.0, mini(get_viewport().get_visible_rect().size.y * 0.065, 56.0)))
		b.toggled.connect(_on_tower_toggled.bind(key))
		b.gui_input.connect(_on_tower_button_gui_input.bind(String(key), b))
		tower_bar.add_child(b)
		if key == selected_tower:
			b.button_pressed = true

	var side := VBoxContainer.new()
	side.add_theme_constant_override("separation", 8)
	_bottom_bar.add_child(side)

	var restart := Button.new()
	restart.text = "Restart"
	restart.custom_minimum_size = Vector2(88, 44)
	restart.pressed.connect(_on_restart)
	side.add_child(restart)

	var menu := Button.new()
	menu.text = "Menu"
	menu.custom_minimum_size = Vector2(88, 44)
	menu.pressed.connect(_on_menu)
	side.add_child(menu)

	_apply_hud_scale(get_viewport().get_visible_rect().size)
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
	_open_question_gate()


func _build_question_overlay() -> void:
	_question_overlay = Panel.new()
	_question_overlay.set_anchors_preset(Control.PRESET_CENTER)
	_question_overlay.offset_left = -280
	_question_overlay.offset_top = -180
	_question_overlay.offset_right = 280
	_question_overlay.offset_bottom = 180
	_question_overlay.visible = false
	_question_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_hud_root.add_child(_question_overlay)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 16
	root.offset_top = 16
	root.offset_right = -16
	root.offset_bottom = -16
	root.add_theme_constant_override("separation", 10)
	_question_overlay.add_child(root)

	var title := Label.new()
	title.text = "Answer to perform action"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 18)
	root.add_child(title)

	_question_prompt = Label.new()
	_question_prompt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_question_prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_question_prompt.add_theme_font_size_override("font_size", 16)
	root.add_child(_question_prompt)

	for i in range(4):
		var b := Button.new()
		b.text = "-"
		b.custom_minimum_size = Vector2(0, 40)
		b.pressed.connect(_on_question_answer_pressed.bind(i))
		root.add_child(b)
		_question_buttons.append(b)

	_question_feedback = Label.new()
	_question_feedback.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_question_feedback.add_theme_font_size_override("font_size", 14)
	root.add_child(_question_feedback)


func _open_question_gate() -> void:
	var q: Dictionary = _question_bank.random_question()
	var choices: Array = q.get("choices", [])
	_question_prompt.text = String(q.get("prompt", "Question"))
	for i in range(_question_buttons.size()):
		var btn := _question_buttons[i]
		btn.disabled = i >= choices.size()
		btn.text = "%d) %s" % [i + 1, String(choices[i]) if i < choices.size() else ""]
		btn.set_meta("answerIndex", int(q.get("answerIndex", 0)))
	_question_feedback.text = ""
	_question_overlay.visible = true
	_question_open = true


func _on_question_answer_pressed(choice_idx: int) -> void:
	if not _question_open:
		return
	var correct_idx: int = int(_question_buttons[0].get_meta("answerIndex"))
	if choice_idx == correct_idx:
		var ok: bool = _session.try_build_tower(
			int(_pending_build.get("r", -1)),
			int(_pending_build.get("c", -1)),
			String(_pending_build.get("key", ""))
		)
		_question_feedback.text = "Correct! Action %s." % ("done" if ok else "blocked")
		_emit_web_event("godot.questionResult", {
			"uid": _web_player_uid,
			"correct": true,
			"action": "build_tower",
		})
	else:
		_question_feedback.text = "Incorrect. Action cancelled."
		_emit_web_event("godot.questionResult", {
			"uid": _web_player_uid,
			"correct": false,
			"action": "build_tower",
		})
	_pending_build = {}
	_question_open = false
	await get_tree().create_timer(0.5).timeout
	_question_overlay.visible = false


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

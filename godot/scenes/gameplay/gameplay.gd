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

const HUD_STATS_TOP: float = 48.0
const HUD_BOTTOM_BASE: float = 132.0


func _ready() -> void:
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
	var bottom_hud: float = maxf(HUD_BOTTOM_BASE, vp.y * 0.20) + ins.w
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


func _on_tower_toggled(pressed: bool, key: String) -> void:
	if pressed:
		selected_tower = key


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

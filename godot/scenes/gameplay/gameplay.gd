extends Node

var selected_tower: String = "BASIC_RIFLE"

@onready var _session: NeonSession = $NeonSession
@onready var _world: Node2D = $WorldBoard

var _money_label: Label
var _lives_label: Label
var _wave_label: Label
var _notify_label: Label
var _tower_group: ButtonGroup


func _ready() -> void:
	_tower_group = ButtonGroup.new()
	_world.bind_session(_session)
	_build_hud()
	_session.money_changed.connect(_on_money)
	_session.lives_changed.connect(_on_lives)
	_session.wave_changed.connect(_on_wave)
	_session.notification_changed.connect(_on_notification)
	_session.game_over_changed.connect(_on_game_over)
	_refresh_labels()


func _process(_delta: float) -> void:
	_session.tick()
	_world.queue_redraw()


func get_selected_tower() -> String:
	return selected_tower


func _build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_PASS
	layer.add_child(root)

	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 16
	top.offset_top = 8
	top.offset_right = -16
	top.offset_bottom = 44
	top.add_theme_constant_override("separation", 24)
	root.add_child(top)

	_money_label = Label.new()
	_lives_label = Label.new()
	_wave_label = Label.new()
	top.add_child(_money_label)
	top.add_child(_lives_label)
	top.add_child(_wave_label)

	_notify_label = Label.new()
	_notify_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_notify_label.offset_top = 48
	_notify_label.offset_bottom = 96
	_notify_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notify_label.add_theme_font_size_override("font_size", 22)
	root.add_child(_notify_label)

	var bottom := HBoxContainer.new()
	bottom.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bottom.offset_left = 8
	bottom.offset_top = -120
	bottom.offset_right = -8
	bottom.offset_bottom = -12
	bottom.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom.add_theme_constant_override("separation", 8)
	root.add_child(bottom)

	var tower_bar := HBoxContainer.new()
	tower_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tower_bar.add_theme_constant_override("separation", 6)
	bottom.add_child(tower_bar)

	var defs := TowerCatalog.towers()
	for key in defs.keys():
		var stats: Dictionary = defs[key]
		var b := Button.new()
		b.toggle_mode = true
		b.button_group = _tower_group
		b.text = "%s %s" % [String(stats.get("icon", "?")), String(stats.get("name", key))]
		b.tooltip_text = "%s — $%d" % [String(stats.get("name", key)), int(stats.get("cost", 0))]
		b.custom_minimum_size = Vector2(118, 44)
		b.toggled.connect(_on_tower_toggled.bind(key))
		tower_bar.add_child(b)
		if key == selected_tower:
			b.button_pressed = true

	var side := VBoxContainer.new()
	side.add_theme_constant_override("separation", 8)
	bottom.add_child(side)

	var restart := Button.new()
	restart.text = "Restart"
	restart.pressed.connect(_on_restart)
	side.add_child(restart)

	var menu := Button.new()
	menu.text = "Menu"
	menu.pressed.connect(_on_menu)
	side.add_child(menu)


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

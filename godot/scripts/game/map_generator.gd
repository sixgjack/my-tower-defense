class_name MapGenerator
extends RefCounted
## Port of web `MapGenerator.ts` — same ROWS/COLS and pattern rotation.

const ROWS: int = GameConstants.ROWS
const COLS: int = GameConstants.COLS

enum MapPattern { LINEAR, SPIRAL, SQUARE_RING, ZIGZAG, U_TURN, MAZE }


static func generate_map(level: int = 1, _path_length_multiplier: float = 1.0) -> Array:
	var map: Array = []
	for _rr in range(ROWS):
		var row: Array = []
		row.resize(COLS)
		row.fill(GameConstants.CELL_EMPTY)
		map.append(row)

	var patterns: Array = [
		MapPattern.LINEAR,
		MapPattern.SPIRAL,
		MapPattern.SQUARE_RING,
		MapPattern.ZIGZAG,
		MapPattern.U_TURN,
		MapPattern.MAZE,
	]
	var pattern: MapPattern = patterns[(level - 1) % patterns.size()]

	match pattern:
		MapPattern.LINEAR:
			_generate_linear(map, level)
		MapPattern.SPIRAL:
			_generate_spiral(map, level)
		MapPattern.SQUARE_RING:
			_generate_square_ring(map, level)
		MapPattern.ZIGZAG:
			_generate_zigzag(map, level)
		MapPattern.U_TURN:
			_generate_u_turn(map, level)
		MapPattern.MAZE:
			_generate_maze(map, level)

	var density: float = minf(0.2, 0.05 + (level * 0.01))
	for rr in range(ROWS):
		for cc in range(COLS):
			if map[rr][cc] == GameConstants.CELL_EMPTY and randf() < density:
				map[rr][cc] = GameConstants.CELL_OBSTACLE

	return map


static func _generate_linear(map: Array, level: int) -> void:
	var side: int = level % 4
	var start_r: int
	var start_c: int
	var end_r: int
	var end_c: int

	if side == 0:
		start_r = int(floor(ROWS / 2.0)) + (level % 3) - 1
		start_c = 0
		end_r = int(floor(ROWS / 2.0)) + ((level + 1) % 3) - 1
		end_c = COLS - 1
	elif side == 1:
		start_r = 0
		start_c = int(floor(COLS / 2.0)) + (level % 3) - 1
		end_r = mini(ROWS - 1, int(floor((ROWS - 1) * 1.0)))
		end_c = int(floor(COLS / 2.0)) + ((level + 1) % 3) - 1
	elif side == 2:
		start_r = int(floor(ROWS / 2.0)) + (level % 3) - 1
		start_c = COLS - 1
		end_r = int(floor(ROWS / 2.0)) + ((level + 1) % 3) - 1
		end_c = 0
	else:
		start_r = ROWS - 1
		start_c = int(floor(COLS / 2.0)) + (level % 3) - 1
		end_r = 0
		end_c = int(floor(COLS / 2.0)) + ((level + 1) % 3) - 1

	start_r = clampi(start_r, 1, ROWS - 2)
	start_c = clampi(start_c, 1, COLS - 2)
	end_r = clampi(end_r, 1, ROWS - 2)
	end_c = clampi(end_c, 1, COLS - 2)

	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	while c != end_c or r != end_r:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		if c < end_c:
			c += 1
		elif c > end_c:
			c -= 1
		elif r < end_r:
			r += 1
		elif r > end_r:
			r -= 1
	map[end_r][end_c] = GameConstants.CELL_BASE


static func _generate_spiral(map: Array, _level: int) -> void:
	var start_r: int = 1
	var start_c: int = 1
	var center_r: int = int(floor(ROWS / 2.0))
	var center_c: int = int(floor(COLS / 2.0))
	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	var dir: int = 0
	var steps: int = 1
	var step_count: int = 0
	while absi(r - center_r) > 1 or absi(c - center_c) > 1:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		if dir == 0:
			c += 1
		elif dir == 1:
			r += 1
		elif dir == 2:
			c -= 1
		else:
			r -= 1
		step_count += 1
		if step_count >= steps:
			dir = (dir + 1) % 4
			if dir == 0 or dir == 2:
				steps += 1
			step_count = 0
		r = clampi(r, 1, ROWS - 2)
		c = clampi(c, 1, COLS - 2)
	map[center_r][center_c] = GameConstants.CELL_BASE


static func _generate_square_ring(map: Array, _level: int) -> void:
	var margin: int = 2
	var start_r: int = margin
	var start_c: int = margin
	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	while c < COLS - margin - 1:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		c += 1
	while r < ROWS - margin - 1:
		map[r][c] = GameConstants.CELL_PATH
		r += 1
	while c > margin:
		map[r][c] = GameConstants.CELL_PATH
		c -= 1
	while r > margin + 1:
		map[r][c] = GameConstants.CELL_PATH
		r -= 1
	var inner_margin: int = margin + 2
	var inner_end: int = mini(ROWS, COLS) - inner_margin
	c = inner_margin
	map[r][c] = GameConstants.CELL_PATH
	while c < inner_end - 1:
		map[r][c] = GameConstants.CELL_PATH
		c += 1
	while r < inner_end - 1:
		map[r][c] = GameConstants.CELL_PATH
		r += 1
	while c > inner_margin:
		map[r][c] = GameConstants.CELL_PATH
		c -= 1
	while r > int(floor(ROWS / 2.0)):
		map[r][c] = GameConstants.CELL_PATH
		r -= 1
	map[int(floor(ROWS / 2.0))][int(floor(COLS / 2.0))] = GameConstants.CELL_BASE


static func _generate_zigzag(map: Array, _level: int) -> void:
	var start_r: int = 1
	var start_c: int = 1
	var end_r: int = ROWS - 2
	var end_c: int = COLS - 2
	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	var going_right: bool = true
	while c < end_c:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		c += 1
		if c >= end_c - 2 or (going_right and c % 4 == 0):
			if r < end_r - 2:
				r += 1
				if map[r][c] != GameConstants.CELL_START:
					map[r][c] = GameConstants.CELL_PATH
			going_right = not going_right
	while r < end_r:
		map[r][c] = GameConstants.CELL_PATH
		r += 1
	map[end_r][end_c] = GameConstants.CELL_BASE


static func _generate_u_turn(map: Array, _level: int) -> void:
	var start_r: int = 1
	var start_c: int = 1
	var end_r: int = ROWS - 2
	var end_c: int = 1
	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	while c < COLS - 2:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		c += 1
	while r < end_r:
		map[r][c] = GameConstants.CELL_PATH
		r += 1
	while c > end_c:
		map[r][c] = GameConstants.CELL_PATH
		c -= 1
	map[end_r][end_c] = GameConstants.CELL_BASE


static func _generate_maze(map: Array, _level: int) -> void:
	var start_r: int = 1
	var start_c: int = 1
	var end_r: int = ROWS - 2
	var end_c: int = COLS - 2
	map[start_r][start_c] = GameConstants.CELL_START
	var r: int = start_r
	var c: int = start_c
	var dir: int = 0
	var segment_length: int = 3
	while absi(r - end_r) > 1 or absi(c - end_c) > 1:
		if map[r][c] != GameConstants.CELL_START:
			map[r][c] = GameConstants.CELL_PATH
		for _i in range(segment_length):
			if dir == 0 and c < end_c:
				c += 1
			elif dir == 1 and r < end_r:
				r += 1
			elif dir == 2 and c > end_c:
				c -= 1
			elif dir == 3 and r > end_r:
				r -= 1
			else:
				break
			if map[r][c] != GameConstants.CELL_START:
				map[r][c] = GameConstants.CELL_PATH
		if randf() > 0.5:
			dir = (dir + 1) % 4
		else:
			dir = (dir + 3) % 4
		segment_length = 2 + randi_range(0, 2)
	map[end_r][end_c] = GameConstants.CELL_BASE

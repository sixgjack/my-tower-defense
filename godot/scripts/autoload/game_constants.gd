extends Node
## Shared grid layout (matches web Neon Defense MapGenerator).

const ROWS: int = 12
const COLS: int = 20
const CELL_SIZE: int = 64

## Map cell kinds (integer grid in Godot; web used 0,1,'S','B','X').
const CELL_EMPTY: int = 0
const CELL_PATH: int = 1
const CELL_START: int = 2
const CELL_BASE: int = 3
const CELL_OBSTACLE: int = 4

// src/engine/MapGenerator.ts

export const ROWS = 12;
export const COLS = 20;

// 0=Empty, 1=Path, S=Start, B=Base, X=Obstacle
export type MapGrid = (0 | 1 | 'S' | 'B' | 'X')[][]; 

// Map generation patterns
type MapPattern = 'linear' | 'spiral' | 'square_ring' | 'zigzag' | 'u_turn' | 'maze';

export function generateMap(level: number = 1, pathLengthMultiplier: number = 1.0): MapGrid {
  // 1. Initialize empty board
  let map: MapGrid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

  // Select pattern based on level (cycles through patterns)
  const patterns: MapPattern[] = ['linear', 'spiral', 'square_ring', 'zigzag', 'u_turn', 'maze'];
  const patternIndex = (level - 1) % patterns.length;
  const pattern = patterns[patternIndex];

  switch (pattern) {
    case 'linear':
      generateLinearMap(map, level);
      break;
    case 'spiral':
      generateSpiralMap(map, level);
      break;
    case 'square_ring': // 回字型 - Square within square
      generateSquareRingMap(map, level);
      break;
    case 'zigzag':
      generateZigZagMap(map, level);
      break;
    case 'u_turn':
      generateUTurnMap(map, level);
      break;
    case 'maze':
      generateMazeMap(map, level);
      break;
  }

  // Place obstacles on empty spaces
  const density = Math.min(0.2, 0.05 + (level * 0.01));
  for (let rr = 0; rr < ROWS; rr++) {
    for (let cc = 0; cc < COLS; cc++) {
      if (map[rr][cc] === 0 && Math.random() < density) {
        map[rr][cc] = 'X';
      }
    }
  }

  return map;
}

// Linear path (original, but start/end can vary)
function generateLinearMap(map: MapGrid, level: number, pathLengthMultiplier: number = 1.0) {
  const side = level % 4; // 0=left, 1=top, 2=right, 3=bottom
  let startR, startC, endR, endC;

  if (side === 0) {
    // Left to Right
    startR = Math.floor(ROWS / 2) + (level % 3) - 1;
    startC = 0;
    endR = Math.floor(ROWS / 2) + ((level + 1) % 3) - 1;
    endC = COLS - 1;
  } else if (side === 1) {
    // Top to Bottom
    startR = 0;
    startC = Math.floor(COLS / 2) + (level % 3) - 1;
    endR = Math.min(ROWS - 1, Math.floor((ROWS - 1) * pathLengthMultiplier));
    endC = Math.floor(COLS / 2) + ((level + 1) % 3) - 1;
  } else if (side === 2) {
    // Right to Left
    startR = Math.floor(ROWS / 2) + (level % 3) - 1;
    startC = COLS - 1;
    endR = Math.floor(ROWS / 2) + ((level + 1) % 3) - 1;
    endC = 0;
  } else {
    // Bottom to Top
    startR = ROWS - 1;
    startC = Math.floor(COLS / 2) + (level % 3) - 1;
    endR = 0;
    endC = Math.floor(COLS / 2) + ((level + 1) % 3) - 1;
  }

  startR = Math.max(1, Math.min(ROWS - 2, startR));
  startC = Math.max(1, Math.min(COLS - 2, startC));
  endR = Math.max(1, Math.min(ROWS - 2, endR));
  endC = Math.max(1, Math.min(COLS - 2, endC));

  map[startR][startC] = 'S';
  
  let r = startR;
  let c = startC;

  // Simple pathfinding towards end
  while (c !== endC || r !== endR) {
    if (map[r][c] !== 'S') map[r][c] = 1;
    
    if (c < endC) c++;
    else if (c > endC) c--;
    else if (r < endR) r++;
    else if (r > endR) r--;
  }

  map[endR][endC] = 'B';
}

// Spiral pattern (start outside, spiral inward)
function generateSpiralMap(map: MapGrid, _level: number) {
  const startR = 1;
  const startC = 1;
  const centerR = Math.floor(ROWS / 2);
  const centerC = Math.floor(COLS / 2);

  map[startR][startC] = 'S';

  let r = startR;
  let c = startC;
  let dir = 0; // 0=right, 1=down, 2=left, 3=up
  let steps = 1;
  let stepCount = 0;

  while (Math.abs(r - centerR) > 1 || Math.abs(c - centerC) > 1) {
    if (map[r][c] !== 'S') map[r][c] = 1;

    if (dir === 0) c++;
    else if (dir === 1) r++;
    else if (dir === 2) c--;
    else r--;

    stepCount++;
    if (stepCount >= steps) {
      dir = (dir + 1) % 4;
      if (dir === 0 || dir === 2) steps++;
      stepCount = 0;
    }

    r = Math.max(1, Math.min(ROWS - 2, r));
    c = Math.max(1, Math.min(COLS - 2, c));
  }

  map[centerR][centerC] = 'B';
}

// 回字型 - Square within square (like Chinese character 回)
function generateSquareRingMap(map: MapGrid, _level: number) {
  const margin = 2;
  
  // Outer square path (clockwise)
  const startR = margin;
  const startC = margin;
  map[startR][startC] = 'S';

  // Draw outer perimeter
  let r = startR;
  let c = startC;
  
  // Go right
  while (c < COLS - margin - 1) {
    if (map[r][c] !== 'S') map[r][c] = 1;
    c++;
  }
  
  // Go down
  while (r < ROWS - margin - 1) {
    map[r][c] = 1;
    r++;
  }
  
  // Go left
  while (c > margin) {
    map[r][c] = 1;
    c--;
  }
  
  // Go up (partially)
  while (r > margin + 1) {
    map[r][c] = 1;
    r--;
  }

  // Inner square (counter-clockwise)
  const innerMargin = margin + 2;
  const innerEnd = Math.min(ROWS, COLS) - innerMargin;
  
  // Continue from where we left off, go right into inner area
  c = innerMargin;
  map[r][c] = 1;
  
  // Go right
  while (c < innerEnd - 1) {
    map[r][c] = 1;
    c++;
  }
  
  // Go down
  while (r < innerEnd - 1) {
    map[r][c] = 1;
    r++;
  }
  
  // Go left
  while (c > innerMargin) {
    map[r][c] = 1;
    c--;
  }
  
  // Go up to center
  while (r > Math.floor(ROWS / 2)) {
    map[r][c] = 1;
    r--;
  }

  // End point in center
  map[Math.floor(ROWS / 2)][Math.floor(COLS / 2)] = 'B';
}

// Zigzag pattern
function generateZigZagMap(map: MapGrid, _level: number) {
  const startR = 1;
  const startC = 1;
  const endR = ROWS - 2;
  const endC = COLS - 2;

  map[startR][startC] = 'S';

  let r = startR;
  let c = startC;
  let goingRight = true;

  while (c < endC) {
    if (map[r][c] !== 'S') map[r][c] = 1;
    c++;

    if (c >= endC - 2 || (goingRight && c % 4 === 0)) {
      if (r < endR - 2) {
        r++;
        if (map[r][c] !== 'S') map[r][c] = 1;
      }
      goingRight = !goingRight;
    }
  }

  // Final approach to end
  while (r < endR) {
    map[r][c] = 1;
    r++;
  }

  map[endR][endC] = 'B';
}

// U-turn pattern
function generateUTurnMap(map: MapGrid, _level: number) {
  const startR = 1;
  const startC = 1;
  const endR = ROWS - 2;
  const endC = 1;

  map[startR][startC] = 'S';

  // Go right
  let r = startR;
  let c = startC;
  while (c < COLS - 2) {
    if (map[r][c] !== 'S') map[r][c] = 1;
    c++;
  }

  // Go down
  while (r < endR) {
    map[r][c] = 1;
    r++;
  }

  // Go left
  while (c > endC) {
    map[r][c] = 1;
    c--;
  }

  map[endR][endC] = 'B';
}

// Maze-like pattern (simplified)
function generateMazeMap(map: MapGrid, _level: number) {
  const startR = 1;
  const startC = 1;
  const endR = ROWS - 2;
  const endC = COLS - 2;

  map[startR][startC] = 'S';

  let r = startR;
  let c = startC;

  // Create a winding path
  let dir = 0; // 0=right, 1=down, 2=left, 3=up
  let segmentLength = 3;

  while (Math.abs(r - endR) > 1 || Math.abs(c - endC) > 1) {
    if (map[r][c] !== 'S') map[r][c] = 1;

    for (let i = 0; i < segmentLength; i++) {
      if (dir === 0 && c < endC) c++;
      else if (dir === 1 && r < endR) r++;
      else if (dir === 2 && c > endC) c--;
      else if (dir === 3 && r > endR) r--;
      else break;

      if (map[r][c] !== 'S') map[r][c] = 1;
    }

    // Change direction
    if (Math.random() > 0.5) {
      dir = (dir + 1) % 4;
    } else {
      dir = (dir + 3) % 4;
    }
    segmentLength = 2 + Math.floor(Math.random() * 3);
  }

  map[endR][endC] = 'B';
}

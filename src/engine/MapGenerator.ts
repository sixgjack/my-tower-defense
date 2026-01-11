// src/engine/MapGenerator.ts

export const ROWS = 12;
export const COLS = 20;

// 0=Empty, 1=Path, S=Start, B=Base, X=Obstacle
export type MapGrid = (0 | 1 | 'S' | 'B' | 'X')[][]; 

export function generateMap(level: number = 1): MapGrid {
  // 1. Initialize empty board
  let map: MapGrid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

  // 2. Define Start and End
  const startR = 1;
  const startC = 0;
  const endR = ROWS - 2;
  const endC = COLS - 1;

  // 3. Dig the Path (Simple Random Walker that biases towards the end)
  let r = startR;
  let c = startC;
  
  map[r][c] = 'S'; // Start

  // While we haven't reached the end column...
  while (c < endC || r !== endR) {
    // Mark current spot as Path if it's not Start
    if (map[r][c] !== 'S') map[r][c] = 1;

    // Decide next move: Right or Down/Up (towards target)
    // We prioritize moving Right to ensure we progress
    const moveRight = c < endC && Math.random() > 0.3; // 70% chance to move right
    const moveVert = !moveRight;

    if (moveRight) {
        c++;
    } else {
        // Move vertically towards the exit row
        if (r < endR) r++;
        else if (r > endR) r--;
        // If we represent already at correct row, force right
        else c++; 
    }
    
    // Safety clamp
    r = Math.max(1, Math.min(ROWS - 2, r));
    c = Math.max(0, Math.min(COLS - 1, c));
  }

  map[endR][endC] = 'B'; // Base
  // Ensure the cell right before Base is a path
  if (map[endR][endC-1] === 0) map[endR][endC-1] = 1;


  // 4. Place Obstacles (Randomly fill empty spots)
  // Higher levels = more obstacles
  const density = Math.min(0.2, 0.05 + (level * 0.01)); 
  
  for (let rr = 0; rr < ROWS; rr++) {
      for (let cc = 0; cc < COLS; cc++) {
          // If empty, maybe place obstacle
          if (map[rr][cc] === 0 && Math.random() < density) {
              map[rr][cc] = 'X';
          }
      }
  }

  return map;
}
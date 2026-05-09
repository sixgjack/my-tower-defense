# Tower Defense — Claude Code Instructions

## Project Overview
Educational tower defense game built with React + TypeScript + PixiJS (v8). Arknights-inspired operator system with roguelike map transitions. Deployed as a web app; Godot bridge available for future native export.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, PixiJS v8
- **Build**: Vite
- **Game engine**: Custom ECS-style singleton at `src/engine/GameEngine.ts`
- **Rendering**: PixiJS canvas via `src/components/PixiGameBoard.tsx` (tile/tower/enemy layers)
- **UI overlay**: React components on top of the Pixi canvas

## Key Architecture Rules
- `game` is a singleton exported from `src/engine/GameEngine.ts` — never instantiate a second one
- Game state lives entirely in `GameEngine`; React reads it each animation frame via `setTick`
- `isTacticalMode = true` freezes the game loop (`tick()` returns immediately)
- Map is a 2D array: `0` = ground, `1` = path, `'S'` = start, `'B'` = base, `'X'` = wall
- `mapVersion` is incremented in `closeWaveShop()` — PixiGameBoard detects the change and flushes all layers

## Arknights Operator System
- Operator classes: `vanguard | guard | defender | sniper | caster | medic | supporter | specialist`
- Melee operators (`canDeployOnPath: true`) can be placed on path tiles (`cell === 1`)
- Placing on path costs **DP** (Deploy Points) — enforced in `requestBuildTower` / `confirmAction`
- Enemies hitting a blocking operator stop and attack it every 50 ticks; operator attacks back via normal targeting
- `retreatOperator(towerId)` removes the operator, refunds 50% DP + 50% gold
- Ranged operators (sniper/caster/medic/supporter) have `blockCount: 0` and cannot be placed on path tiles

## DP Economy
- Starts at 10 DP, max 20 DP
- Passive generation: `0.008 + vanguardCount * 0.005` per game tick (~60 ticks/sec)
- Per-operator DP costs defined in `_AK` record in `src/engine/data.ts` (`dpCost` field)
- Tower card shows `{dpCost}DP` badge in purple; turns red when insufficient

## Roguelike Map System
- Every 10 waves: `closeWaveShop()` regenerates map, advances theme, refunds towers on new path (70%)
- 18 theme palettes in `THEME_TILE_COLORS` in `PixiGameBoard.tsx` — `getC()` returns current theme colors
- Wave preparation page (`WavePreparationPage.tsx`) is a full-screen shop before each environment transition

## Important Files
| File | Purpose |
|------|---------|
| `src/engine/GameEngine.ts` | All game logic — single source of truth |
| `src/engine/data.ts` | Tower/enemy/theme definitions; `_AK` record stamps Arknights fields |
| `src/engine/types.ts` | TypeScript interfaces (Tower, Enemy, Projectile, OperatorClass…) |
| `src/components/GameBoard.tsx` | Main React UI overlay, game loop, sidebar tower cards |
| `src/components/PixiGameBoard.tsx` | PixiJS renderer — tiles, towers (HP bars), enemies, projectiles |
| `src/components/WavePreparationPage.tsx` | Full-screen wave shop / tower repick |
| `src/components/LobbyScreen.tsx` | Commander select lobby |
| `src/engine/MapGenerator.ts` | Procedural map generation |

## Coding Conventions
- Keep inline styles in React — this project intentionally uses dynamic colors from game data (operator class colors, theme colors). ESLint inline-style warnings are expected and acceptable.
- PixiJS v8 API: use `container.getChildByLabel('name')` to retrieve named children; `Graphics.rect().fill()` not `Graphics.beginFill()`
- No `console.log` in production paths
- Tower cards in the sidebar use the Arknights-style operator card layout: class color header strip, portrait with block-count pips, ATK/SPD/DEF stat row, gold+DP cost row

## Common Tasks
**Add a new tower**: Define stats in `src/engine/data.ts` TOWERS record, add an `_AK` entry, add to `TOWER_VISUAL_GROUP` in `src/config/spriteManifest.ts`

**Add a new theme**: Append to `THEMES` in `data.ts` and add a matching color palette key in `THEME_TILE_COLORS` in `PixiGameBoard.tsx`

**Change DP costs**: Edit `dpCost` values in the `_AK` record in `src/engine/data.ts`

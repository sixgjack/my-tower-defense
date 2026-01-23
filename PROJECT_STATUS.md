# Project: Neon Defense (React + TypeScript)
**Current State:** MVP (Minimum Viable Product)
**Engine:** Custom Tick-based loop (60fps)

## Architecture
1. **GameEngine.ts**: Singleton class. Handles state (money, wave, lives), entities (enemies, towers), and physics.
2. **MapGenerator.ts**: Generates a grid with a guaranteed path from 'S' (Start) to 'B' (Base).
3. **GameBoard.tsx**: React component. Uses `requestAnimationFrame` to trigger `game.tick()` and render to Canvas 2D.

## Current Features
- **Pathing:** Auto-generated path using "Drunkard's Walk" algorithm.
- **Waves:** Logic for wave countdowns, increasing difficulty, and boss waves.
- **Towers:** Multiple tower types with unique abilities (projectile, area, beam, spread, pull, aura)
- **Enemies:** 100+ enemy types with various abilities
- **Render:** Canvas 2D + SVG hybrid rendering for performance

## Completed Features ✅

### Core Systems
- **Buff System**: Complete buff/debuff system with rarity tiers (common, rare, epic, legendary)
- **Theme Effects**: 20+ themes with unique environmental effects
- **3-pick-1 Roguelike Buff Selection**: Triggers every 3 waves

### Tower System
- ✅ **8 Basic Towers**: Auto-Rifle, Mortar, Sniper, Shotgun, Cryo, Flamethrower, Stun, Medic
- ✅ **22 Specialized Towers**: Chain Lightning, Railgun, Gatling, Artillery, etc.
- ✅ **Tower Loadout Selection**: Players select 8 towers before battle
- ✅ **Support Towers**: Speed Buff, Damage Buff, Range Buff, Frost/Venom Enhancers, Healer
- ✅ **Beam Attack Balance**: Max 5x damage ramp (reduced from 10x), overheat after 5 seconds
- ✅ **Tower Status Effects Visuals**: Stunned/Disabled shows 💫 icon, Slowed shows 🐌 icon

### Enemy System
- ✅ **100+ Enemy Types**: Including bosses with special abilities
- ✅ **New Enemy Abilities (v2)**:
  - `cc_immune`: Immune to stuns, slows, freezes (Juggernaut, Unstoppable Force, Phase Shifter)
  - `area_disable`: Disables towers in 2x2 area (EMP Drone, Pulse Bomber)
  - `speed_aura`: Speeds up nearby allies by 30% (War Drummer, Rally Banner)
  - `shield_allies`: Grants shields to nearby allies (Guardian Angel, Fortress)
- ✅ **Enemy Ability Visuals**: Shield indicator, CC immune badge, ability icons
- ✅ **Enemy Encyclopedia (敵人圖鑑)**: Now properly tracks and saves encountered enemies

### Localization (i18n)
- ✅ **Bilingual Support**: English + Traditional Chinese (繁體中文)
- ✅ **Tower Names & Descriptions**: Translated for all towers
- ✅ **Enemy Abilities**: Translated (teleport, deactivate_towers, heal_allies, etc.)
- ✅ **Status Effects**: Translated (stunned, frozen, slowed, burning, etc.)
- ✅ **UI Elements**: Lucky Draw, Rarity, Difficulty, Filters all translated

### Balance Changes
- ✅ **Tower Stun Duration**: Enemy `deactivate_towers` now stuns for 3 seconds (was 1.5s)
- ✅ **Tower Slow Duration**: Enemy `slow_towers` now slows for 3 seconds (was 2s)
- ✅ **Beam Attack**: Max 5x ramp, overheats after 5 seconds, damage reduced to 0.08x base
- ✅ **Healing Effects**: No longer show text particles (cleaner visuals)

### Credits System
- ✅ **Credits Based on Waves**: wave * 5 credits per game
- ✅ **Lucky Draw**: Spend 100 credits to draw towers

## In Progress 🚧
- **Battle Shop System**: Integration with lucky draw every 3 waves
- **Lucky Draw Rarity**: Individual rarity per option (not uniform)
- **Tower Live Demo**: Needs improvement for tower selection preview

## Known Issues / Next Steps
- SoundSystem is currently a placeholder (console.log only)
- No visual "Game Over" screen (just console log / freeze)
- Need ranking leaderboard system
- Lucky draw system needs better tower selection algorithm

## Instruction for AI Agent
When editing this project:
1. Always preserve the `game.tick()` loop in `GameBoard.tsx`.
2. Do not remove the `MapGenerator` logic; it ensures valid paths.
3. State is managed in `GameEngine`, not React state. React only re-renders the canvas.
4. Run `git push` after every major update.

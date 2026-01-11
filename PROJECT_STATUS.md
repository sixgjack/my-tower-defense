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
- **Towers:** "SNIPER" type implemented (Instant hit).
- **Enemies:** Basic movement with HP scaling.
- **Render:** Canvas 2D rendering for performance (70+ towers capable).

## Known Issues / Next Steps
- SoundSystem is currently a placeholder (console.log only).
- Only tower types have 70 but only 5 stypes of projectiles, need more.
- also towers are not getting upgraded dmg after upgrading
- No visual "Game Over" screen (just console log / freeze).
- develop more themes, at least 20+, and each theme should have some special envirmental effects, such as frosty theme will slow down turrents(shooting speed)
-very detailed effects mechcanism (you may refer to "effect mechcanism example.md")
-need more boss and enermies types at least 50+, with different abilitys, such as deactivating some towers, suddenly move from one side to other side, healing enermies ahead,
- need to implement a entrance mobile gam like menu and allow students to establish their accounts with google SSO, also need to build a database to store questions(currently firebase) and students account and their status
- need to build a ranking leader system
- need to implement a tower introduction interface, some brief introduction about the tower, what the tower is capable of, and its ability, a instant demo of how the tower attacks the enermies, since i want everytime players can only pick 8 towers into the game
- a rouge like ability picking menu every 5 waves, where players can 3 pick 1 options to slightly empower their towers, recover hearts, or sth like the game "hades"
- a credit system where player can get after every combat and they can unlock new towers
- a lucky draw tower system, which may let players to draw some really overpowered towers, using credits earned from the combat


## Instruction for AI Agent
When editing this project:
1. Always preserve the `game.tick()` loop in `GameBoard.tsx`.
2. Do not remove the `MapGenerator` logic; it ensures valid paths.
3. State is managed in `GameEngine`, not React state. React only re-renders the canvas.
4. i might update what i want later on.
- help me git push to my repository from time to time
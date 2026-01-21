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

## Completed Features ✅
- **Buff System**: Complete buff/debuff system with rarity tiers (common, rare, epic, legendary)
  - `buffSystem.ts`: Core buff definitions and generation functions
  - `themeEffects.ts`: Theme-based environmental effects (2-3 effects per theme)
  - Buff types: damage, attack speed, range, money, enemy speed, enemy HP, lives
  - Duration types: wave-based (3-10 waves) or permanent
- **Theme Effects**: Dynamic environmental effects that change every 10 waves
  - 20+ themes with unique visual styles
  - Each theme generates 2-3 random buffs/debuffs
  - Effects apply to towers or enemies based on type

## Known Issues / Next Steps
- SoundSystem is currently a placeholder (console.log only).
- ✅ **Tower Reduction**: Reduced from 70+ to 30 curated towers with unique abilities
  - 8 basic towers unlocked by default (Auto-Rifle, Mortar, Sniper, Shotgun, Cryo, Flamethrower, Stun, Medic)
  - 22 specialized towers covering: chain attacks, penetration, area damage, beams, status effects, positioning, support, special mechanics
  - All towers have unique abilities: stun, slow, burn, poison, pull/push, buff, heal, chain, penetrate, mine layer, orbital strike, executioner, banker, weaken, summoner
- ✅ **Tower Descriptions**: Reworked to focus on unique aspects and abilities rather than just stats
- ✅ **Upgrade System**: Reworked with upgradeStats interface - each tower upgrades multiple aspects (damage, range, cooldown, areaRadius, multiTarget, slowFactor, stunDuration, burnDamage, pullStrength, beamRamp, etc.) with exponential scaling
- rework on the visuals based on the above amendments
- desgin 8 basic towers for player use, than playes may unlock new towers through lucky draw
-make a 
- grant mini boss and big boss the ability to affect towers, including attack towers , stunning towers, have double health bars, have sheid bars, slowing down tower attack speed, move very fast, split into half when die, etc.)
update visual effects and avoid 
- also towers are not getting upgraded dmg after upgrading
- No visual "Game Over" screen (just console log / freeze).
- develop more themes, at least 20+, and each theme should have some special envirmental effects, such as frosty theme will slow down turrents(shooting speed)
- very detailed effects mechcanism (you may refer to "effect mechcanism example.md")
- need more boss and enermies types at least 50+, with different abilitys, such as deactivating some towers, suddenly move from one side to other side, healing enermies ahead, run very fast, attract towers firepower, have sheild)
- need to implement a entrance mobile gam like menu and allow students to establish their accounts with google SSO, also need to build a database to store questions(currently firebase) and students account and their status
- need to build a ranking leader system
<<<<<<< Current (Your changes)
- need to implement a tower introduction interface, some brief introduction about the tower, what the tower is capable of, and its ability, a instant demo of how the tower attacks the enermies, since i want everytime players can only pick 8 towers into the game
- **TODO: Implement 3-pick-1 roguelike buff selection UI** - The buff system is ready (`generateBuffChoices()` function exists), but the UI component for selecting buffs every 3 waves needs to be created
=======
- ✅ **Tower Loadout Selection**: Complete implementation - players must select 8 towers before battle, with live demo preview, tower stats, and personality descriptions. GameBoard restricts building to only selected towers.
- ✅ **3-pick-1 Roguelike Buff Selection**: Complete implementation with UI modal, triggers every 3 waves, applies buffs to towers/enemies
- ✅ **Credits System**: Credits now based on waves achieved (wave * 5) instead of money earned
>>>>>>> Incoming (Background Agent changes)
- a credit system where player can get after every combat and they can unlock new towers
- a lucky draw tower system, which may let players to draw some really overpowered towers, using credits earned from the combat


## Instruction for AI Agent
When editing this project:
1. Always preserve the `game.tick()` loop in `GameBoard.tsx`.
2. Do not remove the `MapGenerator` logic; it ensures valid paths.
3. State is managed in `GameEngine`, not React state. React only re-renders the canvas.
4. i might update what i want later on.
help me git push to my repository from upond every code update
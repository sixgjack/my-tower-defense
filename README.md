# Neon Defense — Tower Defense Game

A full-stack educational tower defense game built with **React 19 + TypeScript + Vite**, with an embedded **Godot 4** client for mobile/tablet play.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v3 |
| Build | Vite 7 |
| Database | PGlite (in-browser PostgreSQL) |
| Auth | Google OAuth (Firebase) |
| Godot client | Godot 4.3 (GL Compatibility, Web export) |
| Hosting | Any static host (Nginx, Caddy, Vercel, etc.) |

---

## Quick Start (Development)

```bash
# 1. Clone the repo
git clone https://github.com/sixgjack/my-tower-defense.git
cd my-tower-defense

# 2. Install dependencies
npm install

# 3. Start dev server (http://localhost:5173)
npm run dev
```

> The dev server is reachable on LAN at `http://<your-ip>:5173`

---

## Environment Variables

Create a `.env` file in the project root (never commit this):

```env
# Skip Google sign-in for local dev — removes auth requirement
VITE_DISABLE_GOOGLE_AUTH=true

# Firebase / Google OAuth (required for real auth)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

---

## Build for Production

```bash
npm run build        # outputs to dist/
npm run preview      # serve dist/ locally on port 4173
```

---

## Deploy to Your Server

```bash
# Build first
npm run build

# Copy dist/ to your server (example with scp)
scp -r dist/ user@yourserver:/var/www/neon-defense/

# Or rsync (faster for updates)
rsync -avz --delete dist/ user@yourserver:/var/www/neon-defense/
```

**Nginx config example:**
```nginx
server {
    listen 80;
    server_name tower.yourdomain.com;
    root /var/www/neon-defense;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Fork & Continue Development

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/my-tower-defense.git
cd my-tower-defense

# 2. Install
npm install

# 3. Create a feature branch
git checkout -b feat/your-feature

# 4. Dev loop
npm run dev

# 5. Check types before committing
npx tsc -b

# 6. Build and test
npm run build && npm run preview

# 7. Push
git push -u origin feat/your-feature
```

---

## Project Structure

```
my-tower-defense/
├── src/
│   ├── components/        # React UI components
│   │   ├── GameBoard.tsx  # Main game canvas + tower placement
│   │   ├── MenuScreen.tsx # Auth + main menu
│   │   ├── LobbyScreen.tsx
│   │   └── ...
│   ├── engine/
│   │   ├── GameEngine.ts  # Core tick-based game loop (~1900 lines)
│   │   └── data.ts        # Tower / enemy / theme data definitions
│   ├── services/
│   │   ├── postgresDatabase.ts  # PGlite wrapper
│   │   ├── studentService.ts    # Student progress CRUD
│   │   └── googleAuth.ts        # Firebase Auth
│   └── config/
│       └── authMode.ts    # Auth toggle (env var)
├── godot/                 # Godot 4 client
│   ├── scenes/            # .tscn scene files
│   ├── scripts/game/      # GDScript game logic
│   │   ├── world_board.gd # Pixel art renderer
│   │   ├── neon_session.gd # Game engine (GDScript)
│   │   ├── tower_catalog.gd
│   │   └── enemy_catalog.gd
│   └── project.godot
├── public/
│   └── godot/             # Godot web export goes here
└── vite.config.ts
```

---

## Godot Client

The Godot project lives in `godot/`. It connects to the React app via `postMessage` for question gating.

**To export for web:**
1. Open `godot/` in Godot 4.3+
2. Project → Export → Web
3. Export to `public/godot/`
4. The React app will automatically serve it at `/godot/index.html`

---

## Adding Sprite Assets to Godot

Currently all graphics are procedurally drawn in GDScript (`world_board.gd`).

**To use real sprite sheets instead:**

1. Download free assets from:
   - **[Kenney.nl](https://kenney.nl/assets)** — top-tier free game art, very clean pixel style
   - **[itch.io/game-assets](https://itch.io/game-assets/free)** — filter by "Top rated", "Free", "Pixel art"
   - **[OpenGameArt.org](https://opengameart.org)** — fully open-source art (check licenses)
   - **[CraftPix.net](https://craftpix.net/freebies/)** — free section has good tower defense packs

2. Drop PNG files into `godot/assets/sprites/`

3. In Godot, replace `_draw_pixel_tower()` / `_draw_pixel_enemy()` calls in `world_board.gd` with:
   ```gdscript
   var tex = preload("res://assets/sprites/tower_rifle.png")
   draw_texture_rect(tex, rect3, false)
   ```

**Recommended search terms on itch.io:**
- "tower defense tileset pixel art"
- "sci-fi enemies pixel art top down"
- "neon tower sprites"

---

## Tower Types (31 in React, 8 in Godot)

| Key | Name | Type | Special |
|-----|------|------|---------|
| BASIC_RIFLE | Auto-Rifle | projectile | — |
| BASIC_CANNON | Mortar | area | Splash 1.8 tiles |
| BASIC_SNIPER | Sniper | projectile | Long range |
| BASIC_SHOTGUN | Shotgun | spread | 5 pellets |
| BASIC_FREEZE | Cryo Turret | projectile | Slows 0.5x |
| BASIC_BURN | Flamethrower | beam | Burn DoT |
| BASIC_STUN | Stun Cannon | projectile | Stuns 90 ticks |
| BASIC_HEAL | Medic Station | aura | Support |

---

## Requirements

- Node.js 18+
- npm 9+
- Git
- (Optional) Godot 4.3 for Godot client changes

# UAEC Invasion

**UAEC Invasion** is a browser-based arcade shooter inspired by classic Space Invaders, reimagined as a Neo Tokyo / Citadel street-defense game.

The player controls a citizen with a missile launcher while UAEC forces march down the street in formation. The goal is to destroy each advancing wave before it crosses the danger line.

Current prototype version:

```text
UAEC Invasion v0.1.0
```

## Current Status

This is an early playable desktop browser prototype.

Implemented:

- Canvas renderer
- Player movement and shooting
- One player missile on screen at a time
- UAEC enemy formation movement and advancement
- Enemy speed-up as units are destroyed
- Enemy shooting
- 3 lives
- Score and high score
- Online leaderboard foundation with 3-letter initials entry
- Wave progression
- Destructible barricades
- UAEC Tank mystery target
- Heartbeat-style audio
- Music and SFX mute toggles
- Pause
- Screen shake
- Explosion effects
- Rain / CRT atmosphere
- Title screen and game-over screen polish
- Sprite loading system with placeholder fallbacks
- Starter test sprite pack

## Controls

| Key | Action |
| --- | --- |
| `A` | Move left |
| `D` | Move right |
| `Left Arrow` | Move left |
| `Right Arrow` | Move right |
| `Spacebar` | Fire |
| `P` | Pause / resume |
| `Escape` | Pause / resume |
| `M` | Toggle music |
| `N` | Toggle SFX |
| `Enter` | Start / restart |
| `T` | Toggle sprites as a hidden dev tool |
| `Up / Down Arrow` / mouse wheel / scrollbar drag | Scroll game-over leaderboard |

## Gameplay Rules

- The player starts with 3 lives.
- The player has infinite ammo.
- Only one player missile can be active at a time.
- UAEC enemies move as a synchronized formation.
- When the formation hits a side boundary, it advances toward the player.
- The formation speeds up as enemies are destroyed.
- Barricades block both player and enemy projectiles.
- Barricades rebuild at the start of each new wave.
- The UAEC Tank appears as a mystery target.
- The tank has hidden bonus scoring based on shot count.

## Enemy Types

| Enemy | Role | Score |
| --- | --- | --- |
| UAEC Officer | Small invader | 10 |
| UAEC Riot Shield Unit | Medium invader | 20 |
| UAEC Armored Class | Large invader | 30 |
| UAEC Tank | Mystery target | 50 / 100 / 150 / 300 |

## Tech Stack

- TypeScript
- Vite
- HTML5 Canvas
- Web Audio API
- Browser `localStorage`
- Supabase-ready leaderboard client
- Vitest for lightweight logic tests

## Development Setup

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Then open:

```text
http://localhost:5173/
```

Run verification:

```sh
npm run verify
```

Optional Supabase leaderboard setup:

1. Create a Supabase project.
2. Run `supabase/leaderboard.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Set:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-browser-safe-publishable-or-anon-key
```

The game client uses Supabase row-level security and only needs the browser-safe publishable/anon key. Do not put a service-role key in `.env.local`.

The leaderboard table keeps only the top 100 scores. A database trigger prunes lower-ranked rows after inserts so desktop and mobile builds share the same limit.

Build the project:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Project Structure

```text
uaec-invasion/
  archive/source-snapshots/  Historical source snapshots kept out of active src
  public/assets/             Runtime art and audio assets
  src/main.ts                Browser entrypoint
  src/style.css              Page and canvas shell styles
  src/game/                  Game logic, rendering config, input, audio, assets
  src/game/*.test.ts         Lightweight logic tests
```

## Art Pipeline

The game supports sprite loading with fallback placeholders.

- If a sprite exists, the game uses it.
- If a sprite is missing or disabled, the game falls back to placeholder art.

Sprite folders:

- `public/assets/sprites/player`
- `public/assets/sprites/enemies`
- `public/assets/sprites/tank`
- `public/assets/sprites/barricades`
- `public/assets/sprites/projectiles`
- `public/assets/sprites/effects`

The current sprite pack is a test pipeline pack, not final production art.

## Development Safety

- Record notable changes in `CHANGELOG.md`.
- Use `RELEASE_CHECKLIST.md` before release candidates and after refactors.
- Keep behavior-changing work separate from cleanup-only commits where possible.
- Historical source snapshots live in `archive/source-snapshots/` so they are easy to compare or restore without being included in active TypeScript compilation.

## Roadmap

Next priorities:

- Create cleaner individual final sprites
- Add online leaderboard UI and 3-letter initials entry
- Replace temporary test sprites
- Improve Neo Tokyo / Citadel background
- Add better explosion art
- Add multiple stronger cyberpunk music loops

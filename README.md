# UAEC Invasion

**UAEC Invasion** is a browser-based arcade shooter inspired by the core mechanics of classic Space Invaders, reimagined as a Neo Tokyo / Citadel street-defense game.

The player controls a citizen with a missile launcher while UAEC forces march down the street in formation. The goal is to destroy the advancing UAEC wave before they cross the danger line.

Current prototype version:

```text
UAEC Invasion v0.1.0
Current Status

This is an early playable prototype.

Implemented:

Desktop browser gameplay
Canvas renderer
Player movement
Player shooting
One player missile on screen at a time
UAEC enemy formation
Formation side-to-side movement
Formation advancement toward the player
Enemy speed-up as units are destroyed
Enemy shooting
3 lives
Score and high score
Wave progression
Destructible barricades
UAEC Tank mystery target
Hidden 300-point tank scoring pattern
Heartbeat-style audio
Mute/unmute
Pause
Screen shake
Explosion effects
Rain / CRT atmosphere
Title screen polish
Game-over screen polish
Sprite loading system
Starter test sprite pack
Controls
| Key           | Action          |
| ------------- | --------------- |
| `A`           | Move left       |
| `D`           | Move right      |
| `Left Arrow`  | Move left       |
| `Right Arrow` | Move right      |
| `Spacebar`    | Fire            |
| `P`           | Pause / resume  |
| `Escape`      | Pause / resume  |
| `M`           | Mute / unmute   |
| `Enter`       | Start / restart |

[200~Gameplay Rules
The player starts with 3 lives.
The player has infinite ammo.
Only one player missile can be active at a time.
UAEC enemies move as a synchronized formation.
When the formation hits a side boundary, it advances toward the player.
The formation speeds up as enemies are destroyed.
Barricades block both player and enemy projectiles.
Barricades rebuild at the start of each new wave.
The UAEC Tank appears as a mystery target.
The tank has hidden bonus scoring based on shot count.
cat > README.md <<'EOF'
# UAEC Invasion

**UAEC Invasion** is a browser-based arcade shooter inspired by the core mechanics of classic Space Invaders, reimagined as a Neo Tokyo / Citadel street-defense game.

The player controls a citizen with a missile launcher while UAEC forces march down the street in formation. The goal is to destroy the advancing UAEC wave before they cross the danger line.

Current prototype version:

```text
UAEC Invasion v0.1.0
Current Status

This is an early playable prototype.

Implemented:

Desktop browser gameplay
Canvas renderer
Player movement
Player shooting
One player missile on screen at a time
UAEC enemy formation
Formation side-to-side movement
Formation advancement toward the player
Enemy speed-up as units are destroyed
Enemy shooting
3 lives
Score and high score
Wave progression
Destructible barricades
UAEC Tank mystery target
Hidden 300-point tank scoring pattern
Heartbeat-style audio
Mute/unmute
Pause
Screen shake
Explosion effects
Rain / CRT atmosphere
Title screen polish
Game-over screen polish
Sprite loading system
Starter test sprite pack
Controls
| Key           | Action          |
| ------------- | --------------- |
| `A`           | Move left       |
| `D`           | Move right      |
| `Left Arrow`  | Move left       |
| `Right Arrow` | Move right      |
| `Spacebar`    | Fire            |
| `P`           | Pause / resume  |
| `Escape`      | Pause / resume  |
| `M`           | Mute / unmute   |
| `Enter`       | Start / restart |
Gameplay Rules
The player starts with 3 lives.
The player has infinite ammo.
Only one player missile can be active at a time.
UAEC enemies move as a synchronized formation.
When the formation hits a side boundary, it advances toward the player.
The formation speeds up as enemies are destroyed.
Barricades block both player and enemy projectiles.
Barricades rebuild at the start of each new wave.
The UAEC Tank appears as a mystery target.
The tank has hidden bonus scoring based on shot count.

Enemy Types
Enemy	Role	Score
UAEC Officer	Small invader	10
UAEC Riot Shield Unit	Medium invader	20
UAEC Armored Class	Large invader	30
UAEC Tank	Mystery target	50 / 100 / 150 / 300
Hidden Tank Scoring

The UAEC Tank awards 300 points when destroyed on specific player shot counts.
Pattern:

Shot 23 = 300 points
Shot 38 = 300 points
Shot 53 = 300 points
Shot 68 = 300 points
...
The shot count is intentionally hidden from the player.

Tech Stack
TypeScript
Vite
HTML5 Canvas
Web Audio API
Browser localStorage
Development Setup

Install dependencies:

npm install

Start the local development server:

npm run dev

Then open:

http://localhost:5173/

Build the project:

npm run build

Preview the production build:

npm run preview
Project Structure
uaec-invasion/
  PRD.md
  architecture.md
  ASSET_TODO.md
  README.md
  public/
    assets/
      ASSET_GUIDE.md
      citadel-witness.png
      sprites/
      audio/
  src/
    main.ts
    style.css
    game/
      Game.ts
      assets.ts
      audio.ts
      balance.ts
      constants.ts
      input.ts
      metadata.ts
      rendering.ts
      types.ts
      utils.ts
Art Pipeline

The game currently supports sprite loading with fallback placeholders.

If a sprite exists, the game uses it.

If a sprite is missing, the game falls back to placeholder art.

Sprite folders:

public/assets/sprites/player
public/assets/sprites/enemies
public/assets/sprites/tank
public/assets/sprites/barricades
public/assets/sprites/projectiles
public/assets/sprites/effects

The current sprite pack is a test pipeline pack, not final production art.

Roadmap

Next priorities:

Create cleaner individual final sprites
Replace temporary test sprites
Improve Neo Tokyo / Citadel background
Add better explosion art
Add cyberpunk music loop
Add mobile controls
Tune difficulty after more playtesting
Notes

This project is desktop-first.

Mobile support will come after the desktop version feels polished.

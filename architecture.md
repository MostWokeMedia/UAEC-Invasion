# UAEC Invasion — Architecture

## 1. Technical Overview

UAEC Invasion is a desktop-first browser arcade game.

Recommended stack:
- HTML5 Canvas
- TypeScript
- Vite
- Web Audio API
- Browser localStorage for high score

The game should start with placeholder shapes before replacing them with pixel-art assets.

## 2. Why Canvas Instead of React

React is good for websites and app interfaces.

Canvas is better for this game because:
- the game updates many objects every frame
- we need direct control over drawing
- sprite positioning and animation are easier
- we can render the entire scene in one loop

React may be used later for menus or a landing page, but the game itself should run inside Canvas.

## 3. Project Structure

Recommended starting structure:

```text
uaec-invasion/
  PRD.md
  architecture.md
  package.json
  index.html
  src/
    main.ts
    game/
      Game.ts
      constants.ts
      types.ts
      input.ts
      scoring.ts
      audio.ts
      collision.ts
      renderer.ts
```

Later expanded structure:

```text
uaec-invasion/
  public/
    assets/
      sprites/
        player/
        enemies/
        tank/
        barricades/
        projectiles/
        explosions/
      audio/
  src/
    main.ts
    game/
      Game.ts
      constants.ts
      types.ts
      input.ts
      scoring.ts
      audio.ts
      collision.ts
      renderer.ts
      wave.ts
    entities/
      Player.ts
      Enemy.ts
      EnemyFormation.ts
      Projectile.ts
      Tank.ts
      Barricade.ts
      Explosion.ts
    systems/
      MovementSystem.ts
      ShootingSystem.ts
      CollisionSystem.ts
      RenderSystem.ts
      AudioSystem.ts
```

For the first prototype, keep fewer files. Add more files only when the project becomes harder to manage.

## 4. Game States

The game should use simple states:

```ts
type GameMode =
  | "start"
  | "playing"
  | "player-hit"
  | "wave-clear"
  | "game-over";
```

### 4.1 Start
- Shows title screen.
- Waits for Enter or click.
- Audio may initialize after this interaction.

### 4.2 Playing
- Normal gameplay.
- Player can move and shoot.
- Enemies move and shoot.
- Collision is active.

### 4.3 Player Hit
- Brief pause after player is hit.
- Player loses one life.
- Projectiles clear.
- If lives remain, return to playing.
- If no lives remain, go to game-over.

### 4.4 Wave Clear
- Triggered when all enemies are destroyed.
- Short delay.
- Next wave begins.

### 4.5 Game Over
- Shows final score.
- Updates high score.
- Waits for Enter to restart.

## 5. Core Game Loop

The game loop runs with `requestAnimationFrame`.

Basic flow:

```ts
function loop(timestamp: number) {
  const dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  game.update(dt);
  game.render();

  requestAnimationFrame(loop);
}
```

The update function handles:
- input
- player movement
- player shooting
- enemy movement
- tank movement
- projectile movement
- collisions
- score changes
- win/loss checks

The render function handles:
- clearing the screen
- drawing the background
- drawing enemies
- drawing barricades
- drawing projectiles
- drawing player
- drawing HUD

## 6. Coordinate System

The internal game should use a simple 2D logical coordinate system.

The screen uses:

```text
x = horizontal position
y = vertical screen position
```

To create the Neo Tokyo perspective, enemy rows farther away should appear:
- higher on screen
- smaller
- closer together

Enemy rows closer to the player should appear:
- lower on screen
- larger
- farther apart

Version 1 can fake this using fixed row positions and scales.

Example:

```ts
const ROW_RENDER_DATA = [
  { y: 190, scale: 0.70 },
  { y: 260, scale: 0.82 },
  { y: 335, scale: 0.94 },
  { y: 420, scale: 1.08 },
  { y: 515, scale: 1.22 },
];
```

As the formation advances, each row moves down the screen and gets slightly larger.

## 7. Entity Types

### 7.1 Player

```ts
type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  invulnerableMs: number;
};
```

### 7.2 Enemy

```ts
type EnemyType = "officer" | "shield" | "armored";

type Enemy = {
  id: string;
  type: EnemyType;
  row: number;
  col: number;
  alive: boolean;
  score: number;
};
```

Enemies do not move individually in Version 1. The formation moves as a group.

### 7.3 Enemy Formation

```ts
type EnemyFormation = {
  xOffset: number;
  yAdvance: number;
  direction: -1 | 1;
  stepTimerMs: number;
  stepDelayMs: number;
  enemies: Enemy[];
};
```

### 7.4 Projectile

```ts
type ProjectileOwner = "player" | "enemy";

type Projectile = {
  owner: ProjectileOwner;
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  active: boolean;
};
```

### 7.5 Tank

```ts
type Tank = {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: -1 | 1;
  speed: number;
  spawnTimerMs: number;
};
```

### 7.6 Barricade

For Version 1, use block-based barricades.

```ts
type BarricadeBlock = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  active: boolean;
};
```

A barricade is made of many small blocks. When a projectile hits a block, that block loses HP or disappears.

## 8. Input System

The input system should track keys as pressed or not pressed.

Controls:
- `KeyA`
- `KeyD`
- `ArrowLeft`
- `ArrowRight`
- `Space`
- `Enter`
- `KeyM`

Example:

```ts
type InputState = {
  left: boolean;
  right: boolean;
  shootPressed: boolean;
  startPressed: boolean;
  mutePressed: boolean;
};
```

Important:
- Movement can be continuous while a key is held.
- Shooting should fire once per key press, not every frame.
- Mute should toggle once per key press, not every frame.

## 9. Player Shooting Rules

Player missile rules:
- one active player projectile maximum
- missile moves upward/toward enemies
- slow and deliberate speed
- only valid launches increment shot count

Pseudo-code:

```ts
if (input.shootPressed && !hasActivePlayerProjectile()) {
  playerShotCount++;
  spawnPlayerProjectile();
}
```

## 10. Enemy Formation Movement

The formation updates on a timer, not every frame.

Pseudo-code:

```ts
formation.stepTimerMs += dt;

if (formation.stepTimerMs >= formation.stepDelayMs) {
  formation.stepTimerMs = 0;
  formation.xOffset += formation.direction * STEP_SIZE;

  if (formationHitBoundary()) {
    formation.direction *= -1;
    formation.yAdvance += ADVANCE_SIZE;
  }

  updateFormationSpeed();
  audio.playHeartbeat();
}
```

This gives the correct Space Invaders-style stepping motion.

## 11. Formation Speed

The step delay is based on how many enemies remain alive.

```ts
function getFormationStepDelay(aliveCount: number): number {
  if (aliveCount <= 1) return 90;
  if (aliveCount <= 3) return 160;
  if (aliveCount <= 7) return 260;
  if (aliveCount <= 14) return 430;
  if (aliveCount <= 21) return 600;
  if (aliveCount <= 28) return 750;
  return 900;
}
```

## 12. Enemy Shooting

Rules:
- max 3 enemy projectiles active
- only living enemies can fire
- prefer the frontmost living enemy in a column
- enemy shot cooldown decreases as enemies are destroyed

Pseudo-code:

```ts
if (enemyProjectileCount < 3 && enemyShotCooldown <= 0) {
  const shooter = chooseEnemyShooter();
  spawnEnemyProjectile(shooter);
  resetEnemyShotCooldown();
}
```

## 13. Collision System

Use rectangle collision for Version 1.

Collision pairs:
- player projectile vs enemies
- player projectile vs tank
- player projectile vs barricade blocks
- enemy projectile vs player
- enemy projectile vs barricade blocks
- enemy formation vs player danger line
- enemy formation vs barricades

Basic collision:

```ts
function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
```

## 14. Scoring System

Enemy scores:
- UAEC Officer: 10
- UAEC Riot Shield Unit: 20
- UAEC Armored Class: 30

Tank scores:
- 300 if hidden shot-count pattern matches
- otherwise 50, 100, or 150

Tank scoring:

```ts
function getTankScore(playerShotCount: number): number {
  if (playerShotCount === 23) return 300;
  if (playerShotCount > 23 && (playerShotCount - 23) % 15 === 0) return 300;

  const options = [50, 100, 150];
  return options[Math.floor(Math.random() * options.length)];
}
```

High score:
- save to `localStorage`
- load on game start

## 15. Audio Architecture

Use Web Audio API for generated sounds.

Version 1 sounds:
- heartbeat pulse
- player missile
- enemy hit
- player hit
- tank destroyed
- wave clear

Audio must start only after user interaction.

Audio state:

```ts
type AudioState = {
  enabled: boolean;
  initialized: boolean;
};
```

Mute behavior:
- pressing `M` toggles enabled
- if muted, no sounds play
- if unmuted, sounds resume

Heartbeat:
- triggered by formation step
- pitch can vary slightly
- rate naturally increases as formation step delay decreases

## 16. Rendering Architecture

Version 1 uses placeholder shapes.

Recommended colors:
- Player: light gray
- Player missile: white/orange
- Officer: dark blue
- Shield unit: dark blue with gray shield
- Armored unit: larger dark blue rectangle
- Tank: dark gray long rectangle
- Enemy projectile: red/pink
- Barricade: gray
- HUD: white and neon pink

Render order:
1. background
2. far tank
3. enemies
4. barricades
5. projectiles
6. player
7. HUD
8. overlays/start/game-over messages

## 17. Mobile Expansion Plan

Do not build mobile first.

After desktop version works:
- make canvas responsive
- add left/right touch zones
- add fire button
- test landscape mode
- simplify HUD if necessary

## 18. Development Roadmap

### Milestone 1 — Project Setup
- install tools
- create Vite TypeScript project
- display canvas
- draw player rectangle

### Milestone 2 — Player Controls
- move left/right
- shoot one missile
- constrain player to screen bounds

### Milestone 3 — Enemy Formation
- create 35 enemies
- draw formation
- move side-to-side
- advance toward player
- speed up as enemies die

### Milestone 4 — Collisions and Scoring
- player missile destroys enemies
- score updates
- wave clears when enemies are gone

### Milestone 5 — Enemy Fire and Lives
- enemies shoot
- player loses lives
- game over works

### Milestone 6 — Barricades
- add destructible blocks
- projectiles damage barricades

### Milestone 7 — UAEC Tank
- tank appears on timer
- tank can be destroyed
- hidden 300-point scoring works

### Milestone 8 — Audio
- heartbeat pulse
- mute/unmute
- basic sound effects

### Milestone 9 — Visual Replacement
- replace rectangles with pixel art
- add background
- add explosions
- add polish

## 19. Beginner Notes

Important concepts:

### Terminal
A terminal is where you type commands to create, run, and manage the project.

### Node.js
Node.js lets your computer run JavaScript tools outside the browser.

### npm
npm installs project tools and packages.

### Vite
Vite creates and runs the local development version of the game.

### TypeScript
TypeScript is JavaScript with extra structure that helps catch mistakes.

### Canvas
Canvas is the browser feature that lets us draw the game screen.

### Local Development Server
When you run `npm run dev`, Vite starts a local website on your computer. You open that website in your browser to play the game while building it.

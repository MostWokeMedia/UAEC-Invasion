import { COLS, HEIGHT, ROWS, TOTAL_ENEMIES, WIDTH } from "./constants";
import { AudioManager } from "./audio";
import { BALANCE } from "./balance";
import { SpriteManager } from "./assets";
import type { SpriteKey } from "./assets";
import { InputManager } from "./input";
import { BUILD_LABEL } from "./metadata";
import {
  ENEMY_SPRITE,
  EXPLOSION_SPRITE,
  PLAYER_SPRITE,
  PROJECTILE_SPRITE,
  TANK_SPRITE,
} from "./rendering";
import { clamp, rectsOverlap } from "./utils";
import type {
  BarricadeBlock,
  Direction,
  Enemy,
  EnemyType,
  Explosion,
  FloatingText,
  GameMode,
  Player,
  Projectile,
  Rect,
  Tank,
} from "./types";

export class Game {
  private backgroundImage = new Image();
  private backgroundLoaded = false;
  private mode: GameMode = "start";
  private score = 0;
  private highScore = Number(localStorage.getItem("uaec-invasion-high-score") || 0);
  private wave = 1;
  private lives = 3;
  private modeTimerMs = 0;
  private playerShotCount = 0;
  private earnedNewHighScore = false;
  private sprites = new SpriteManager();
  private spriteRenderCache = new Map<string, HTMLCanvasElement>();

  private player: Player = {
    x: WIDTH / 2 - 24,
    y: HEIGHT - 78,
    width: 48,
    height: 38,
    speed: 310,
    invulnerableMs: 0,
  };

  private enemies: Enemy[] = [];
  private barricadeBlocks: BarricadeBlock[] = [];
  private playerMissile: Projectile | null = null;
  private enemyProjectiles: Projectile[] = [];
  private floatingTexts: FloatingText[] = [];
  private explosions: Explosion[] = [];
  private playerFireFlashMs = 0;
  private screenShakeMs = 0;
  private screenShakeStrength = 0;

  private formation = {
    xOffset: 0,
    yAdvance: 0,
    direction: 1 as Direction,
    stepTimerMs: 0,
    stepDelayMs: 900,
    animationFrame: 0,
  };

  private enemyShotCooldownMs = 1500;

  private tank: Tank = {
    active: false,
    x: -160,
    y: 112,
    width: 130,
    height: 42,
    direction: 1,
    speed: 72,
    spawnTimerMs: 14000,
  };

  private nextTankDirection: Direction = -1;

  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private audio: AudioManager;

  constructor(
    ctx: CanvasRenderingContext2D,
    input: InputManager,
    audio: AudioManager,
  ) {
    this.ctx = ctx;
    this.input = input;
    this.audio = audio;
    this.setupSpriteToggleHotkey();
    this.backgroundImage.src = "/assets/backgrounds/citadel_street_hud_bg.png";
    this.backgroundImage.onload = () => {
      this.backgroundLoaded = true;
    };

    this.sprites.loadAll();
    this.startWave();
  }

  private setupSpriteToggleHotkey(): void {
    window.addEventListener("keydown", (event) => {
      const isSpriteToggle =
        event.code === "KeyT" || event.key.toLowerCase() === "t";

      if (!isSpriteToggle || event.repeat) return;

      event.preventDefault();
      this.sprites.toggleEnabled();

      console.info(
        `UAEC Invasion sprites: ${this.sprites.isEnabled ? "ON" : "OFF"}`,
      );
    });
  }

  update(dtMs: number): void {
    this.updateScreenShake(dtMs);

    if (this.input.consume("KeyM")) {
      this.audio.toggleMusicMute();
    }

    if (this.input.consume("KeyN")) {
      this.audio.toggleSfxMute();
    }


    const pausePressed = this.input.consume("KeyP") || this.input.consume("Escape");

    if (pausePressed && this.mode === "playing") {
      this.audio.pauseMusic();
      this.mode = "paused";
      return;
    }

    if (pausePressed && this.mode === "paused") {
      this.mode = "playing";
      this.audio.resumeMusic();
      return;
    }

    if (this.mode === "paused") {
      return;
    }

    if (this.mode === "start") {
      const startPressed = this.input.consume("Enter") || this.input.consume("Space");

      if (startPressed) {
        this.audio.initialize();
        this.startNewGame();
      }
      return;
    }

    if (this.mode === "game-over") {
      const restartPressed = this.input.consume("Enter") || this.input.consume("Space");

      if (restartPressed) {
        this.audio.initialize();
        this.startNewGame();
      }
      return;
    }

    if (this.mode === "player-hit") {
      this.modeTimerMs -= dtMs;
      if (this.modeTimerMs <= 0) {
        if (this.lives <= 0) {
          this.mode = "game-over";
        } else {
          this.mode = "playing";
          this.player.invulnerableMs = 1600;
        }
      }
      this.updateFloatingTexts(dtMs);
      this.updateExplosions(dtMs);
      return;
    }

    if (this.mode === "wave-clear") {
      this.modeTimerMs -= dtMs;
      this.updateFloatingTexts(dtMs);

      if (this.modeTimerMs <= 0) {
        this.wave++;
        this.startWave();
        this.mode = "playing";
      }

      return;
    }

    this.updatePlaying(dtMs);
  }

  render(): void {
  this.ctx.save();
  this.applyScreenShake();

  this.drawBackground();

  // Keep rain / CRT behind gameplay objects so enemies stay readable.
  this.drawAtmosphereOverlay();

  // Darken the busy street before drawing enemies and projectiles.
  this.drawGameplayReadabilityVeil();

  this.drawTank();
  this.drawEnemies();
  this.drawBarricades();
  this.drawProjectiles();
  this.drawExplosions();
  this.drawPlayer();
  this.drawFloatingTexts();
  this.drawHud();

  if (this.mode === "start") {
    this.drawStartScreen();
  }

  if (this.mode === "game-over") {
    this.drawGameOverScreen();
  }

  if (this.mode === "paused") {
    this.drawPauseScreen();
  }

  if (this.mode === "wave-clear") {
    this.drawWaveClearScreen();
  }

  if (this.mode === "player-hit") {
    this.drawPlayerHitScreen();
  }

  this.ctx.restore();
}

  private updatePlaying(dtMs: number): void {
    this.player.invulnerableMs = Math.max(0, this.player.invulnerableMs - dtMs);
    this.playerFireFlashMs = Math.max(0, this.playerFireFlashMs - dtMs);

    this.updatePlayer(dtMs);
    this.updatePlayerShooting();
    this.updateFormation(dtMs);
    this.updateEnemyShooting(dtMs);
    this.updateTank(dtMs);
    this.updateProjectiles(dtMs);
    this.handleCollisions();
    this.updateFloatingTexts(dtMs);
    this.updateExplosions(dtMs);
    this.checkWaveAndLossConditions();
  }

  private startNewGame(): void {
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.earnedNewHighScore = false;
    this.mode = "playing";
    this.playerShotCount = 0;
    this.startWave();
  }

  private startWave(): void {
    this.enemies = this.createEnemies();
    this.barricadeBlocks = this.createBarricades();
    this.playerMissile = null;
    this.enemyProjectiles = [];
    this.floatingTexts = [];
    this.explosions = [];

    this.player.x = WIDTH / 2 - this.player.width / 2;
    this.player.y = HEIGHT - 78;
    this.player.invulnerableMs = 1200;

    const startingAdvance = this.getWaveStartingAdvance();

    this.formation = {
      xOffset: 0,
      yAdvance: startingAdvance,
      direction: 1,
      stepTimerMs: 0,
      stepDelayMs: 900,
      animationFrame: 0,
    };

    this.enemyShotCooldownMs = 1600;
    this.playerShotCount = 0;

    this.tank = {
      active: false,
      x: -160,
      y: 112,
      width: 130,
      height: 42,
      direction: 1,
      speed: 72,
      spawnTimerMs: 12000 + Math.random() * 8000,
    };
  }

  private createEnemies(): Enemy[] {
    const enemies: Enemy[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type: EnemyType = row === 0 ? "armored" : row <= 2 ? "shield" : "officer";
        const score = type === "armored" ? 30 : type === "shield" ? 20 : 10;

        enemies.push({
          id: `${row}-${col}`,
          type,
          row,
          col,
          alive: true,
          score,
        });
      }
    }

    return enemies;
  }

  private createBarricades(): BarricadeBlock[] {
    const blocks: BarricadeBlock[] = [];
    const barricadeCenters = [190, 385, 575, 770];

    for (const centerX of barricadeCenters) {
      const blockSize = 16;
      const startX = centerX - blockSize * 3;
      const startY = 592;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
          const isGap = row === 2 && (col === 2 || col === 3);

          if (!isGap) {
            blocks.push({
              x: startX + col * blockSize,
              y: startY + row * blockSize,
              width: blockSize - 2,
              height: blockSize - 2,
              hp: 2,
              active: true,
            });
          }
        }
      }
    }

    return blocks;
  }

  private updatePlayer(dtMs: number): void {
    const dt = dtMs / 1000;

    if (this.input.isLeftHeld()) {
      this.player.x -= this.player.speed * dt;
    }

    if (this.input.isRightHeld()) {
      this.player.x += this.player.speed * dt;
    }

    this.player.x = clamp(this.player.x, 34, WIDTH - this.player.width - 34);
  }

  private updatePlayerShooting(): void {
    if (!this.input.consume("Space")) return;
    if (this.playerMissile) return;

    this.playerShotCount++;

    this.playerMissile = {
      owner: "player",
      x: this.player.x + this.player.width / 2 - 3,
      y: this.player.y - 16,
      width: 6,
      height: 18,
      speedY: -285,
    };

    this.playerFireFlashMs = 140;
    this.audio.playShoot();
  }

  private updateFormation(dtMs: number): void {
    const aliveCount = this.getAliveEnemies().length;

    this.formation.stepDelayMs = this.getFormationStepDelay(aliveCount);
    this.formation.stepTimerMs += dtMs;

    if (this.formation.stepTimerMs < this.formation.stepDelayMs) return;

    this.formation.stepTimerMs = 0;
    this.formation.animationFrame = this.formation.animationFrame === 0 ? 1 : 0;

    const attemptedDirection = this.formation.direction;
    this.formation.xOffset += attemptedDirection * 20;

    const bounds = this.getFormationBounds();

    if (bounds && (bounds.x < 44 || bounds.x + bounds.width > WIDTH - 44)) {
      this.formation.xOffset -= attemptedDirection * 20;
      this.formation.direction *= -1;
      this.formation.yAdvance += 20;
    }

    this.audio.playHeartbeat(aliveCount);
  }

  private updateEnemyShooting(dtMs: number): void {
    this.enemyShotCooldownMs -= dtMs;

    if (this.enemyProjectiles.length >= 3) return;
    if (this.enemyShotCooldownMs > 0) return;

    const shooter = this.chooseEnemyShooter();
    if (!shooter) return;

    const rect = this.getEnemyRect(shooter);

    this.enemyProjectiles.push({
      owner: "enemy",
      x: rect.x + rect.width / 2 - 4,
      y: rect.y + rect.height,
      width: 8,
      height: 18,
      speedY: 130 + this.wave * 8,
    });

    const aliveCount = this.getAliveEnemies().length;
    this.enemyShotCooldownMs = Math.max(480, 1600 - (TOTAL_ENEMIES - aliveCount) * 28) + Math.random() * 650;
  }

  private updateTank(dtMs: number): void {
    const dt = dtMs / 1000;

    if (this.tank.active) {
      this.tank.x += this.tank.direction * this.tank.speed * dt;

      if (this.tank.direction === 1 && this.tank.x > WIDTH + 170) {
        this.tank.active = false;
        this.tank.spawnTimerMs = 20000 + Math.random() * 9000;
      }

      if (this.tank.direction === -1 && this.tank.x < -190) {
        this.tank.active = false;
        this.tank.spawnTimerMs = 20000 + Math.random() * 9000;
      }

      return;
    }

    this.tank.spawnTimerMs -= dtMs;

    if (this.tank.spawnTimerMs <= 0) {
      const direction: Direction = this.nextTankDirection;
      this.nextTankDirection = this.nextTankDirection === -1 ? 1 : -1;

      this.tank = {
        active: true,
        direction,
        x: direction === 1 ? -160 : WIDTH + 160,
        y: 112,
        width: 130,
        height: 42,
        speed: 72 + this.wave * 4,
        spawnTimerMs: 0,
      };
    }
  }

  private updateProjectiles(dtMs: number): void {
    const dt = dtMs / 1000;

    if (this.playerMissile) {
      this.playerMissile.y += this.playerMissile.speedY * dt;

      if (this.playerMissile.y + this.playerMissile.height < 0) {
        this.playerMissile = null;
      }
    }

    for (const projectile of this.enemyProjectiles) {
      projectile.y += projectile.speedY * dt;
    }

    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => projectile.y < HEIGHT + 40);
  }

  private handleCollisions(): void {
    this.handlePlayerMissileCollisions();
    this.handleEnemyProjectileCollisions();
  }

  private handlePlayerMissileCollisions(): void {
    if (!this.playerMissile) return;

    for (const block of this.barricadeBlocks) {
      if (!block.active) continue;

      if (rectsOverlap(this.playerMissile, block)) {
        this.damageBarricadeBlock(block);
        this.playerMissile = null;
        return;
      }
    }

    if (this.tank.active && rectsOverlap(this.playerMissile, this.tank)) {
      const tankScore = this.getTankScore();
      this.addScore(tankScore);
      this.floatingTexts.push({
        text: `+${tankScore}`,
        x: this.tank.x + this.tank.width / 2,
        y: this.tank.y,
        lifeMs: 900,
      });

      this.explosions.push({
        x: this.tank.x + this.tank.width / 2 - EXPLOSION_SPRITE.tankWidth / 2,
        y: this.tank.y + this.tank.height / 2 - EXPLOSION_SPRITE.tankHeight / 2,
        width: EXPLOSION_SPRITE.tankWidth,
        height: EXPLOSION_SPRITE.tankHeight,
        lifeMs: 820,
        totalLifeMs: 820,
      });

      this.triggerScreenShake(360, 10);

      this.playerMissile = null;
      this.tank.active = false;
      this.tank.spawnTimerMs = 21000 + Math.random() * 9000;
      this.audio.playTankHit();
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const enemyRect = this.getEnemyRect(enemy);
      const enemyHurtbox = this.getEnemyHurtbox(enemy, enemyRect);

      if (rectsOverlap(this.playerMissile, enemyHurtbox)) {
        enemy.alive = false;
        this.addScore(enemy.score);
        this.floatingTexts.push({
          text: `+${enemy.score}`,
          x: enemyRect.x + enemyRect.width / 2,
          y: enemyRect.y,
          lifeMs: 650,
        });

        this.explosions.push({
          x: enemyRect.x + enemyRect.width / 2 - EXPLOSION_SPRITE.enemyWidth / 2,
          y: enemyRect.y + enemyRect.height / 2 - EXPLOSION_SPRITE.enemyHeight / 2,
          width: EXPLOSION_SPRITE.enemyWidth,
          height: EXPLOSION_SPRITE.enemyHeight,
          lifeMs: 320,
          totalLifeMs: 320,
        });

        this.triggerScreenShake(90, 2.5);

        this.playerMissile = null;
        this.audio.playEnemyHit();
        return;
      }
    }
  }

  private handleEnemyProjectileCollisions(): void {
    const remainingProjectiles: Projectile[] = [];

    for (const projectile of this.enemyProjectiles) {
      let projectileConsumed = false;

      for (const block of this.barricadeBlocks) {
        if (!block.active) continue;

        if (rectsOverlap(projectile, block)) {
          this.damageBarricadeBlock(block);
          projectileConsumed = true;
          break;
        }
      }

      if (projectileConsumed) continue;

      if (
        this.player.invulnerableMs <= 0 &&
        rectsOverlap(projectile, this.getPlayerHitbox())
      ) {
        this.explosions.push({
          x: this.player.x + this.player.width / 2 - EXPLOSION_SPRITE.playerWidth / 2,
          y: this.player.y + this.player.height / 2 - EXPLOSION_SPRITE.playerHeight / 2,
          width: EXPLOSION_SPRITE.playerWidth,
          height: EXPLOSION_SPRITE.playerHeight,
          lifeMs: 680,
          totalLifeMs: 680,
        });

        this.triggerScreenShake(520, 14);

        this.lives--;
        this.enemyProjectiles = [];
        this.playerMissile = null;
        this.mode = "player-hit";
        this.modeTimerMs = 1100;
        this.audio.playPlayerHit();
        return;
      }

      remainingProjectiles.push(projectile);
    }

    this.enemyProjectiles = remainingProjectiles;
  }

  private checkWaveAndLossConditions(): void {
    if (this.getAliveEnemies().length === 0) {
      this.mode = "wave-clear";
      this.modeTimerMs = 1600;
      this.playerMissile = null;
      this.enemyProjectiles = [];
      this.audio.playWaveClear();
      return;
    }

    const dangerLineY = HEIGHT - 105;

    for (const enemy of this.getAliveEnemies()) {
      const rect = this.getEnemyRect(enemy);

      if (rect.y + rect.height >= dangerLineY) {
        this.lives = 0;
        this.mode = "game-over";
        this.audio.playPlayerHit();
        return;
      }
    }

    for (const block of this.barricadeBlocks) {
      if (!block.active) continue;

      for (const enemy of this.getAliveEnemies()) {
        if (rectsOverlap(this.getEnemyRect(enemy), block)) {
          block.active = false;
        }
      }
    }
  }

  private damageBarricadeBlock(block: BarricadeBlock): void {
    block.hp--;

    if (block.hp <= 0) {
      block.active = false;
    }
  }

  private getPlayerHitbox(): Rect {
    return {
      x: this.player.x,
      y: this.player.y + BALANCE.player.hitboxYOffset,
      width: this.player.width,
      height: this.player.height,
    };
  }

  private chooseEnemyShooter(): Enemy | null {
    const alive = this.getAliveEnemies();
    if (alive.length === 0) return null;

    const columns = [...new Set(alive.map((enemy) => enemy.col))];
    const selectedColumn = columns[Math.floor(Math.random() * columns.length)];
    const candidates = alive.filter((enemy) => enemy.col === selectedColumn);

    candidates.sort((a, b) => b.row - a.row);

    return candidates[0] ?? null;
  }

  private getAliveEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  private getFormationStepDelay(aliveCount: number): number {
    const wavePressure = Math.min(Math.max(this.wave - 3, 0) * 8, 80);

    let baseDelay: number;

    if (aliveCount <= 1) baseDelay = 90;
    else if (aliveCount <= 3) baseDelay = 160;
    else if (aliveCount <= 7) baseDelay = 260;
    else if (aliveCount <= 14) baseDelay = 430;
    else if (aliveCount <= 21) baseDelay = 600;
    else if (aliveCount <= 28) baseDelay = 750;
    else baseDelay = 900;

    return Math.max(80, baseDelay - wavePressure);
  }

  private getWaveStartingAdvance(): number {
    // Waves may start lower as difficulty ramps, but never lower than Wave 9.
    // Enemy movement speed can continue increasing separately.
    const cappedWaveForStartHeight = Math.min(this.wave, 9);

    if (cappedWaveForStartHeight <= 2) return 0;

    return Math.min((cappedWaveForStartHeight - 2) * 6, 42);
  }


  private getTankScore(): number {
    if (this.playerShotCount === 23) return 300;
    if (this.playerShotCount > 23 && (this.playerShotCount - 23) % 15 === 0) return 300;

    const fallbackScores = [50, 100, 150];
    return fallbackScores[Math.floor(Math.random() * fallbackScores.length)];
  }

  private addScore(points: number): void {
    this.score += points;

    if (this.score > this.highScore) {
      this.earnedNewHighScore = true;
      this.highScore = this.score;
      localStorage.setItem("uaec-invasion-high-score", String(this.highScore));
    }
  }

  private getEnemyHurtbox(enemy: Enemy, rect: Rect): Rect {
    const paddingByType: Record<EnemyType, { xRatio: number; yRatio: number }> = {
      officer: { xRatio: 0.06, yRatio: 0.04 },
      shield: { xRatio: 0.08, yRatio: 0.04 },
      armored: { xRatio: 0.24, yRatio: 0.10 },
    };

    const padding = paddingByType[enemy.type];
    const padX = rect.width * padding.xRatio;
    const padY = rect.height * padding.yRatio;

    return {
      x: rect.x - padX,
      y: rect.y - padY,
      width: rect.width + padX * 2,
      height: rect.height + padY * 2,
    };
  }

  private getEnemyRect(enemy: Enemy): Rect {
    const rowY = [130, 200, 275, 365, 455][enemy.row];
    const baseScale = [0.72, 0.84, 0.96, 1.1, 1.25][enemy.row];
    const advanceScale = this.formation.yAdvance * 0.0017;
    const scale = baseScale + advanceScale;

    const spacing = 78 * scale;
    const centerX = WIDTH / 2 + this.formation.xOffset;
    const x = centerX + (enemy.col - (COLS - 1) / 2) * spacing;

    const baseWidth = enemy.type === "armored" ? 42 : enemy.type === "shield" ? 40 : 34;
    const baseHeight = enemy.type === "armored" ? 46 : enemy.type === "shield" ? 48 : 40;

    return {
      x: x - (baseWidth * scale) / 2,
      y: rowY + this.formation.yAdvance,
      width: baseWidth * scale,
      height: baseHeight * scale,
    };
  }

  private getFormationBounds(): Rect | null {
    const alive = this.getAliveEnemies();
    if (alive.length === 0) return null;

    const rects = alive.map((enemy) => this.getEnemyRect(enemy));
    const left = Math.min(...rects.map((rect) => rect.x));
    const top = Math.min(...rects.map((rect) => rect.y));
    const right = Math.max(...rects.map((rect) => rect.x + rect.width));
    const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  private updateScreenShake(dtMs: number): void {
    this.screenShakeMs = Math.max(0, this.screenShakeMs - dtMs);

    if (this.screenShakeMs === 0) {
      this.screenShakeStrength = 0;
    }
  }

  private triggerScreenShake(durationMs: number, strength: number): void {
    this.screenShakeMs = Math.max(this.screenShakeMs, durationMs);
    this.screenShakeStrength = Math.max(this.screenShakeStrength, strength);
  }

  private applyScreenShake(): void {
    if (this.screenShakeMs <= 0 || this.screenShakeStrength <= 0) return;

    const decay = this.screenShakeMs / 520;
    const currentStrength = this.screenShakeStrength * Math.min(1, decay);
    const offsetX = (Math.random() - 0.5) * currentStrength * 2;
    const offsetY = (Math.random() - 0.5) * currentStrength * 2;

    this.ctx.translate(offsetX, offsetY);
  }

  private updateExplosions(dtMs: number): void {
    for (const explosion of this.explosions) {
      explosion.lifeMs -= dtMs;
    }

    this.explosions = this.explosions.filter((explosion) => explosion.lifeMs > 0);
  }

  private updateFloatingTexts(dtMs: number): void {
    for (const floatingText of this.floatingTexts) {
      floatingText.lifeMs -= dtMs;
      floatingText.y -= 24 * (dtMs / 1000);
    }

    this.floatingTexts = this.floatingTexts.filter((floatingText) => floatingText.lifeMs > 0);
  }

  private drawBackground(): void {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    if (this.backgroundLoaded) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, WIDTH, HEIGHT);

      // Small tint so sprites and background feel unified without hiding the art.
      this.ctx.fillStyle = "rgba(2, 4, 10, 0.18)";
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
      this.ctx.fillStyle = "#050713";
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    this.ctx.restore();
  }

private drawGameplayReadabilityVeil(): void {
  this.ctx.save();

  const playfieldTop = 86;

  const verticalVeil = this.ctx.createLinearGradient(
    0,
    playfieldTop,
    0,
    HEIGHT,
  );

  verticalVeil.addColorStop(0, "rgba(2, 5, 15, 0.50)");
  verticalVeil.addColorStop(0.42, "rgba(2, 5, 15, 0.40)");
  verticalVeil.addColorStop(0.72, "rgba(2, 5, 15, 0.28)");
  verticalVeil.addColorStop(1, "rgba(2, 5, 15, 0.18)");

  this.ctx.fillStyle = verticalVeil;
  this.ctx.fillRect(0, playfieldTop, WIDTH, HEIGHT - playfieldTop);

  const centerVeil = this.ctx.createRadialGradient(
    WIDTH / 2,
    360,
    60,
    WIDTH / 2,
    360,
    470,
  );

  centerVeil.addColorStop(0, "rgba(0, 0, 0, 0.28)");
  centerVeil.addColorStop(0.62, "rgba(0, 0, 0, 0.18)");
  centerVeil.addColorStop(1, "rgba(0, 0, 0, 0)");

  this.ctx.fillStyle = centerVeil;
  this.ctx.fillRect(0, playfieldTop, WIDTH, HEIGHT - playfieldTop);

  this.ctx.restore();
}

  private drawHud(): void {
    this.ctx.save();

    // Top HUD panel.
    this.ctx.fillStyle = "rgba(2, 3, 10, 0.78)";
    this.ctx.fillRect(0, 0, WIDTH, 86);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.65)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 86);
    this.ctx.lineTo(WIDTH, 86);
    this.ctx.stroke();

    // Subtle inner glow line.
    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.25)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, 82);
    this.ctx.lineTo(WIDTH, 82);
    this.ctx.stroke();

    this.ctx.textAlign = "left";

    // Labels.
    this.ctx.font = "15px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("SCORE", 28, 26);
    this.ctx.fillText("HI-SCORE", 224, 26);
    this.ctx.fillText("WAVE", 454, 26);
    this.ctx.fillText("LIVES", 610, 26);

    // Values.
    this.ctx.font = "28px 'Courier New', monospace";

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(String(this.score).padStart(6, "0"), 28, 62);

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText(String(this.highScore).padStart(6, "0"), 224, 62);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(String(this.wave).padStart(2, "0"), 454, 62);

    // Lives as citizen head icons.
    const lifeHeadSprite = this.sprites.get("citizenLifeHead");

    for (let i = 0; i < this.lives; i++) {
      const x = 612 + i * 38;
      const y = 38;

      if (lifeHeadSprite) {
        this.drawCachedImage("citizenLifeHead", lifeHeadSprite, x, y, 30, 30);
        continue;
      }

      // Fallback if the life icon is missing.
      this.ctx.fillStyle = "#202838";
      this.ctx.fillRect(x, y + 10, 24, 18);

      this.ctx.fillStyle = "#9ee7ff";
      this.ctx.fillRect(x + 7, y, 10, 12);

      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillRect(x + 3, y + 6, 18, 4);
    }

    // Audio indicators.
    this.ctx.textAlign = "right";
    this.ctx.font = "15px 'Courier New', monospace";

    this.ctx.fillStyle = this.audio.isMusicMuted ? "#ff4f9a" : "#9ee7ff";
    this.ctx.fillText(this.audio.isMusicMuted ? "MUSIC OFF [M]" : "MUSIC [M]", WIDTH - 28, 26);

    this.ctx.fillStyle = this.audio.isSfxMuted ? "#ff4f9a" : "#9ee7ff";
    this.ctx.fillText(this.audio.isSfxMuted ? "SFX OFF [N]" : "SFX [N]", WIDTH - 28, 50);

    this.ctx.restore();
  }

  private drawPlayer(): void {
    if (this.player.invulnerableMs > 0 && Math.floor(this.player.invulnerableMs / 120) % 2 === 0) {
      return;
    }

    const firingSprite = this.sprites.get("playerFire");
    const idleSprite = this.sprites.get("playerIdle");
    const playerSprite = this.playerFireFlashMs > 0 && firingSprite ? firingSprite : idleSprite;

    if (playerSprite) {
      const drawWidth = PLAYER_SPRITE.width;
      const drawHeight = PLAYER_SPRITE.height;
      const drawX =
        this.player.x + this.player.width / 2 - drawWidth / 2 + PLAYER_SPRITE.xOffset;
      const drawY =
        this.player.y + this.player.height - drawHeight + PLAYER_SPRITE.yOffset;

      this.drawCachedImage(
        this.playerFireFlashMs > 0 && firingSprite ? "playerFire" : "playerIdle",
        playerSprite,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
      return;
    }

    this.drawPlaceholderPlayer();
  }

  private drawPlaceholderPlayer(): void {
    this.ctx.fillStyle = "#202838";
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = "#566176";
    this.ctx.fillRect(this.player.x + 12, this.player.y - 22, 24, 24);

    this.ctx.fillStyle = "#c9d3e8";
    this.ctx.fillRect(this.player.x + this.player.width / 2 - 6, this.player.y - 48, 12, 46);

    this.ctx.fillStyle = this.playerFireFlashMs > 0 ? "#fff7d6" : "#ff4f9a";
    this.ctx.fillRect(this.player.x + 14, this.player.y - 30, 20, 5);
  }

  private drawCachedImage(
    cacheKeyBase: string,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const drawWidth = Math.max(1, Math.round(width));
    const drawHeight = Math.max(1, Math.round(height));
    const cacheKey = `${cacheKeyBase}:${drawWidth}x${drawHeight}`;

    let cachedCanvas = this.spriteRenderCache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement("canvas");
      cachedCanvas.width = drawWidth;
      cachedCanvas.height = drawHeight;

      const cachedCtx = cachedCanvas.getContext("2d");

      if (!cachedCtx) return;

      cachedCtx.imageSmoothingEnabled = false;
      cachedCtx.drawImage(image, 0, 0, drawWidth, drawHeight);

      this.spriteRenderCache.set(cacheKey, cachedCanvas);
    }

    this.ctx.drawImage(
      cachedCanvas,
      Math.round(x),
      Math.round(y),
      drawWidth,
      drawHeight,
    );
  }

  private drawCachedImageWithGlow(
    cacheKeyBase: string,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    glowColor: string,
    glowBlur: number,
    glowAlpha: number,
  ): void {
    const drawWidth = Math.max(1, Math.round(width));
    const drawHeight = Math.max(1, Math.round(height));
    const padding = Math.ceil(glowBlur * 2);
    const cacheKey = `${cacheKeyBase}:glow:${drawWidth}x${drawHeight}:${glowColor}:${glowBlur}:${glowAlpha}`;

    let cachedCanvas = this.spriteRenderCache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement("canvas");
      cachedCanvas.width = drawWidth + padding * 2;
      cachedCanvas.height = drawHeight + padding * 2;

      const cachedCtx = cachedCanvas.getContext("2d");

      if (!cachedCtx) return;

      cachedCtx.imageSmoothingEnabled = false;

      // Expensive glow is rendered once into the cache, not every frame.
      cachedCtx.save();
      cachedCtx.globalAlpha = glowAlpha;
      cachedCtx.shadowColor = glowColor;
      cachedCtx.shadowBlur = glowBlur;
      cachedCtx.drawImage(image, padding, padding, drawWidth, drawHeight);
      cachedCtx.restore();

      // Crisp sprite on top of the cached glow.
      cachedCtx.drawImage(image, padding, padding, drawWidth, drawHeight);

      this.spriteRenderCache.set(cacheKey, cachedCanvas);
    }

    this.ctx.drawImage(
      cachedCanvas,
      Math.round(x) - padding,
      Math.round(y) - padding,
    );
  }

  private drawEnemies(): void {
  const frame = this.formation.animationFrame;

  for (const enemy of this.enemies) {
    if (!enemy.alive) continue;

    const rect = this.getEnemyRect(enemy);
    const spriteKey = this.getEnemySpriteKey(enemy, frame);
    const enemySprite = this.sprites.get(spriteKey);

    if (enemySprite) {
      const bob = frame === 0 ? 0 : rect.height * ENEMY_SPRITE.bobRatio;
      const typeScale = ENEMY_SPRITE.typeScale[enemy.type];
      const typeXOffset = ENEMY_SPRITE.typeXOffset[enemy.type];

      const drawWidth = rect.width * ENEMY_SPRITE.widthScale * typeScale;
      const drawHeight = rect.height * ENEMY_SPRITE.heightScale * typeScale;

      const drawX =
        rect.x +
        rect.width / 2 -
        drawWidth / 2 +
        ENEMY_SPRITE.xOffset +
        typeXOffset;

      const drawY = rect.y + rect.height - drawHeight + bob;

      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;

      // Grounding shadow separates the legs from the wet road.
      this.ctx.globalAlpha = 0.32;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
      this.ctx.beginPath();
      this.ctx.ellipse(
        rect.x + rect.width / 2,
        rect.y + rect.height * 0.96,
        drawWidth * 0.36,
        Math.max(4, drawHeight * 0.09),
        0,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();

      // Slightly dimmer neon rim pass.
      this.ctx.globalAlpha = 0.72;
        const enemyGlowColor =
          enemy.type === "officer"
            ? "rgba(158, 231, 255, 0.62)"
            : enemy.type === "shield"
              ? "rgba(255, 79, 154, 0.68)"
              : "rgba(255, 79, 154, 0.82)";
        const enemyGlowBlur = enemy.type === "armored" ? 11 : enemy.type === "shield" ? 9 : 7;

        this.drawCachedImageWithGlow(
          spriteKey,
          enemySprite,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
          enemyGlowColor,
          enemyGlowBlur,
          0.72,
        );

      // Crisp readable sprite pass.
      this.ctx.globalAlpha = 1;
      this.ctx.filter = "brightness(1.17) contrast(1.13) saturate(1.05)";

      this.ctx.filter = "none";
      this.ctx.restore();

      continue;
    }

    this.drawPlaceholderEnemy(enemy, rect, frame);
  }
}

  private getEnemySpriteKey(enemy: Enemy, frame: number): SpriteKey {
    if (enemy.type === "officer") {
      return frame === 0 ? "uaecOfficerWalk1" : "uaecOfficerWalk2";
    }

    if (enemy.type === "shield") {
      return frame === 0 ? "uaecShieldWalk1" : "uaecShieldWalk2";
    }

    return frame === 0 ? "uaecArmoredWalk1" : "uaecArmoredWalk2";
  }

  private drawPlaceholderEnemy(enemy: Enemy, rect: Rect, frame: number): void {
    const bob = frame === 0 ? 0 : rect.height * 0.05;

    if (enemy.type === "officer") {
      this.ctx.fillStyle = "#151d2d";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width, rect.height - bob);

      this.ctx.fillStyle = "#222b3f";
      this.ctx.fillRect(
        rect.x + rect.width * 0.18,
        rect.y - rect.height * 0.14 + bob,
        rect.width * 0.64,
        rect.height * 0.24,
      );

      this.ctx.fillStyle = frame === 0 ? "#ff4f9a" : "#9ee7ff";
      this.ctx.fillRect(
        rect.x + rect.width * 0.16,
        rect.y + rect.height * 0.28 + bob,
        rect.width * 0.68,
        4,
      );

      this.ctx.fillStyle = "#0d1220";
      this.ctx.fillRect(
        rect.x - rect.width * 0.14,
        rect.y + rect.height * 0.74,
        rect.width * 0.28,
        rect.height * 0.12,
      );
      this.ctx.fillRect(
        rect.x + rect.width * 0.86,
        rect.y + rect.height * 0.74,
        rect.width * 0.28,
        rect.height * 0.12,
      );
    }

    if (enemy.type === "shield") {
      const shieldShift = frame === 0 ? 0 : rect.width * 0.08;

      this.ctx.fillStyle = "#151d2d";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width * 0.62, rect.height - bob);

      this.ctx.fillStyle = "#3b4356";
      this.ctx.fillRect(
        rect.x + rect.width * 0.48 + shieldShift,
        rect.y + rect.height * 0.12,
        rect.width * 0.52,
        rect.height * 0.78,
      );

      this.ctx.strokeStyle = frame === 0 ? "#9ca3af" : "#9ee7ff";
      this.ctx.strokeRect(
        rect.x + rect.width * 0.48 + shieldShift,
        rect.y + rect.height * 0.12,
        rect.width * 0.52,
        rect.height * 0.78,
      );

      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillRect(
        rect.x + rect.width * 0.12,
        rect.y + rect.height * 0.30 + bob,
        rect.width * 0.38,
        4,
      );
    }

    if (enemy.type === "armored") {
      const shoulderPush = frame === 0 ? rect.width * 0.1 : rect.width * 0.18;

      this.ctx.fillStyle = "#1d2436";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width, rect.height - bob);

      this.ctx.fillStyle = "#30394f";
      this.ctx.fillRect(
        rect.x - shoulderPush,
        rect.y + rect.height * 0.18 + bob,
        rect.width + shoulderPush * 2,
        rect.height * 0.56,
      );

      this.ctx.fillStyle = frame === 0 ? "#ff4f9a" : "#9ee7ff";
      this.ctx.fillRect(
        rect.x + rect.width * 0.18,
        rect.y + rect.height * 0.34 + bob,
        rect.width * 0.64,
        5,
      );
    }

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.font = `${Math.max(8, rect.width * 0.24)}px 'Courier New', monospace`;
    this.ctx.textAlign = "center";
    this.ctx.fillText("UAEC", rect.x + rect.width / 2, rect.y + rect.height * 0.62 + bob);
  }

  private drawTank(): void {
    if (!this.tank.active) return;

    const tankSprite = this.sprites.get("uaecTank");

    if (tankSprite) {
      const drawWidth = this.tank.width;
      const drawHeight = this.tank.height + TANK_SPRITE.extraHeight;
      const drawX = this.tank.x;
      const drawY = this.tank.y + TANK_SPRITE.yOffset;

      this.ctx.save();

      if (this.tank.direction === -1) {
        this.ctx.translate(drawX + drawWidth, 0);
        this.ctx.scale(-1, 1);

        this.drawCachedImageWithGlow(
          "uaecTank",
          tankSprite,
          0,
          drawY,
          drawWidth,
          drawHeight,
          "rgba(255, 79, 154, 0.82)",
          14,
          0.72,
        );
      } else {
        this.drawCachedImageWithGlow(
          "uaecTank",
          tankSprite,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
          "rgba(255, 79, 154, 0.82)",
          14,
          0.72,
        );
      }

      this.ctx.restore();
      return;
    }

    // Placeholder fallback if the tank sprite is missing or disabled.
    this.ctx.save();

    this.ctx.fillStyle = "#111827";
    this.ctx.fillRect(this.tank.x, this.tank.y, this.tank.width, this.tank.height);

    this.ctx.fillStyle = "#1f2937";
    this.ctx.fillRect(
      this.tank.x + 16,
      this.tank.y - 10,
      this.tank.width * 0.45,
      this.tank.height * 0.55,
    );

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillRect(
      this.tank.x + this.tank.width * 0.16,
      this.tank.y + this.tank.height * 0.36,
      this.tank.width * 0.22,
      4,
    );

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.font = "16px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("UAEC", this.tank.x + this.tank.width / 2, this.tank.y + 28);

    this.ctx.restore();
  }


  private drawBarricades(): void {
    const fullBlockSprite = this.sprites.get("barricadeFull");
    const damagedBlockSprite = this.sprites.get("barricadeDamaged");

    for (const block of this.barricadeBlocks) {
      if (!block.active) continue;

      const sprite = block.hp === 2 ? fullBlockSprite : damagedBlockSprite;

      if (sprite) {
        this.drawCachedImage(
          block.hp === 2 ? "barricadeFull" : "barricadeDamaged",
          sprite,
          block.x,
          block.y,
          block.width,
          block.height,
        );
        continue;
      }

      this.ctx.fillStyle = block.hp === 2 ? "#6b7280" : "#3f4654";
      this.ctx.fillRect(block.x, block.y, block.width, block.height);

      if (block.hp === 1) {
        this.ctx.fillStyle = "rgba(255, 79, 154, 0.18)";
        this.ctx.fillRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
      }
    }
  }

  private drawProjectiles(): void {
    this.drawPlayerMissile();
    this.drawEnemyProjectiles();
  }

  private drawPlayerMissile(): void {
    if (!this.playerMissile) return;

    const missileSprite = this.sprites.get("playerMissile");

    if (missileSprite) {
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(
        missileSprite,
        this.playerMissile.x + PROJECTILE_SPRITE.playerXOffset,
        this.playerMissile.y + PROJECTILE_SPRITE.playerYOffset,
        PROJECTILE_SPRITE.playerWidth,
        PROJECTILE_SPRITE.playerHeight,
      );
      this.ctx.restore();
      return;
    }

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillRect(
      this.playerMissile.x,
      this.playerMissile.y,
      this.playerMissile.width,
      this.playerMissile.height,
    );

    this.ctx.fillStyle = "#ff7a3d";
    this.ctx.fillRect(this.playerMissile.x - 2, this.playerMissile.y + 14, 10, 8);
  }

  private drawEnemyProjectiles(): void {
    const enemyProjectileSprite = this.sprites.get("enemyProjectile");

    for (const projectile of this.enemyProjectiles) {
      if (enemyProjectileSprite) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(
          enemyProjectileSprite,
          projectile.x + PROJECTILE_SPRITE.enemyXOffset,
          projectile.y + PROJECTILE_SPRITE.enemyYOffset,
          PROJECTILE_SPRITE.enemyWidth,
          PROJECTILE_SPRITE.enemyHeight,
        );
        this.ctx.restore();
        continue;
      }

      this.ctx.fillStyle = "#ff355d";
      this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  }

  private drawExplosions(): void {
    for (const explosion of this.explosions) {
      const progress = 1 - explosion.lifeMs / explosion.totalLifeMs;
      const spriteKey =
        progress < 0.34 ? "explosion1" : progress < 0.67 ? "explosion2" : "explosion3";
      const sprite = this.sprites.get(spriteKey);

      if (sprite) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = Math.max(0, explosion.lifeMs / explosion.totalLifeMs);
        this.ctx.drawImage(sprite, explosion.x, explosion.y, explosion.width, explosion.height);
        this.ctx.restore();
        continue;
      }

      this.drawPlaceholderExplosion(explosion, progress);
    }
  }

  private drawPlaceholderExplosion(explosion: Explosion, progress: number): void {
    const centerX = explosion.x + explosion.width / 2;
    const centerY = explosion.y + explosion.height / 2;
    const alpha = Math.max(0, explosion.lifeMs / explosion.totalLifeMs);
    const radius = 8 + progress * Math.max(explosion.width, explosion.height) * 0.42;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillRect(centerX - 6, centerY - 6, 12, 12);

    this.ctx.fillStyle = "#ff7a3d";
    this.ctx.fillRect(centerX - radius * 0.9, centerY - 4, 14, 8);
    this.ctx.fillRect(centerX + radius * 0.55, centerY - 4, 14, 8);
    this.ctx.fillRect(centerX - 4, centerY - radius * 0.75, 8, 14);
    this.ctx.fillRect(centerX - 4, centerY + radius * 0.55, 8, 14);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillRect(centerX - radius * 0.55, centerY - radius * 0.45, 12, 12);
    this.ctx.fillRect(centerX + radius * 0.35, centerY - radius * 0.38, 12, 12);
    this.ctx.fillRect(centerX - radius * 0.35, centerY + radius * 0.32, 12, 12);
    this.ctx.fillRect(centerX + radius * 0.18, centerY + radius * 0.38, 12, 12);

    this.ctx.restore();
  }

  private drawFloatingTexts(): void {
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#f5f7ff";

    for (const floatingText of this.floatingTexts) {
      this.ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    }
  }

  private drawStartScreen(): void {
    const time = performance.now() / 1000;
    const titleFlicker = Math.sin(time * 18) > 0.94 ? 0.72 : 1;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;

    this.ctx.save();

    // Use the real gameplay background so the menu matches the game world.
    this.drawBackground();

    // Dark cinematic overlay for readability.
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle center panel.
    const panelX = WIDTH / 2 - 320;
    const panelY = 104;
    const panelW = 640;
    const panelH = 530;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.76)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.72)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.30)";
    this.ctx.strokeRect(panelX + 8, panelY + 8, panelW - 16, panelH - 16);

    this.ctx.textAlign = "center";

    // Title.
    this.ctx.save();
    this.ctx.globalAlpha = titleFlicker;

    this.ctx.font = "76px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("UAEC", WIDTH / 2, panelY + 92);

    this.ctx.font = "68px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("INVASION", WIDTH / 2, panelY + 156);

    this.ctx.strokeStyle = "#9ee7ff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeText("INVASION", WIDTH / 2, panelY + 156);

    this.ctx.restore();

    // Lore copy.
    this.ctx.font = "21px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS UNDER LOCKDOWN.", WIDTH / 2, panelY + 218);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE UAEC ARE ADVANCING.", WIDTH / 2, panelY + 252);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("HOLD THE LINE.", WIDTH / 2, panelY + 286);

    // Start prompt.
    this.ctx.save();
    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "28px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText("PRESS ENTER OR SPACE", WIDTH / 2, panelY + 348);
    this.ctx.restore();

    // Controls.
    const controlsX = WIDTH / 2 - 195;
    const controlsY = panelY + 386;

    this.ctx.textAlign = "left";
    this.ctx.font = "17px 'Courier New', monospace";

    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("A/D or ←/→", controlsX, controlsY);
    this.ctx.fillText("SPACE", controlsX, controlsY + 28);
    this.ctx.fillText("P/ESC", controlsX, controlsY + 56);
    this.ctx.fillText("M", controlsX, controlsY + 84);
    this.ctx.fillText("N", controlsX, controlsY + 112);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("MOVE", controlsX + 260, controlsY);
    this.ctx.fillText("FIRE", controlsX + 260, controlsY + 28);
    this.ctx.fillText("PAUSE", controlsX + 260, controlsY + 56);
    this.ctx.fillText(this.audio.isMusicMuted ? "MUSIC ON" : "MUSIC OFF", controlsX + 260, controlsY + 84);
    this.ctx.fillText(this.audio.isSfxMuted ? "SFX ON" : "SFX OFF", controlsX + 260, controlsY + 112);

    // Footer info.
    this.ctx.textAlign = "center";
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(
      `HIGH SCORE: ${String(this.highScore).padStart(6, "0")}`,
      WIDTH / 2,
      660,
    );

    this.ctx.font = "17px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("THE CITADEL IS WATCHING...", WIDTH / 2, 690);

    this.ctx.font = "13px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText(BUILD_LABEL, WIDTH / 2, 716);

    this.ctx.restore();
  }



  private drawAtmosphereOverlay(): void {
    this.ctx.save();

    this.drawRainOverlay();
    this.drawCrtOverlay();
    this.drawVignetteOverlay();

    this.ctx.restore();
  }

  private drawRainOverlay(): void {
    const time = performance.now() / 1000;
    const rainCount = 90;
    const fallSpeed = time * 360;

    this.ctx.save();
    this.ctx.globalAlpha = 0.22;
    this.ctx.strokeStyle = "#9ee7ff";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < rainCount; i++) {
      const seedX = (i * 97) % WIDTH;
      const seedY = (i * 53) % HEIGHT;
      const x = (seedX + Math.sin(i * 12.9898) * 40 + fallSpeed * 0.16) % WIDTH;
      const y = (seedY + fallSpeed + i * 17) % HEIGHT;
      const length = 10 + (i % 4) * 4;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x - 5, y + length);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawCrtOverlay(): void {
    this.ctx.save();

    this.ctx.globalAlpha = 0.10;
    this.ctx.fillStyle = "#f5f7ff";

    for (let y = 0; y < HEIGHT; y += 4) {
      this.ctx.fillRect(0, y, WIDTH, 1);
    }

    this.ctx.globalAlpha = 0.06;
    this.ctx.fillStyle = "#ff4f9a";

    for (let x = 0; x < WIDTH; x += 6) {
      this.ctx.fillRect(x, 0, 1, HEIGHT);
    }

    this.ctx.restore();
  }

  private drawVignetteOverlay(): void {
    const gradient = this.ctx.createRadialGradient(
      WIDTH / 2,
      HEIGHT / 2,
      120,
      WIDTH / 2,
      HEIGHT / 2,
      620,
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.62, "rgba(0, 0, 0, 0.10)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.58)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.save();
    this.ctx.globalAlpha = 0.10;
    this.ctx.strokeStyle = "#ff4f9a";
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
    this.ctx.restore();
  }

  private drawPlayerHitScreen(): void {
    const time = performance.now() / 1000;
    const pulse = 0.62 + Math.sin(time * 8) * 0.28;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeStyle = "#ff355d";
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(70, 70, WIDTH - 140, HEIGHT - 140);
    this.ctx.restore();

    if (this.lives > 0) {
      this.ctx.font = "54px 'Courier New', monospace";
      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillText("SIGNAL DISRUPTED", WIDTH / 2, HEIGHT / 2 - 70);

      this.ctx.font = "24px 'Courier New', monospace";
      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.fillText(
        `LIVES REMAINING: ${String(this.lives).padStart(2, "0")}`,
        WIDTH / 2,
        HEIGHT / 2 - 18,
      );

      this.ctx.fillStyle = "#9ee7ff";
      this.ctx.fillText("REDEPLOYING...", WIDTH / 2, HEIGHT / 2 + 34);
    } else {
      this.ctx.font = "54px 'Courier New', monospace";
      this.ctx.fillStyle = "#ff355d";
      this.ctx.fillText("SIGNAL COLLAPSING", WIDTH / 2, HEIGHT / 2 - 70);

      this.ctx.font = "24px 'Courier New', monospace";
      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.fillText("NO LIVES REMAINING", WIDTH / 2, HEIGHT / 2 - 18);

      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillText("TRANSMISSION ENDING...", WIDTH / 2, HEIGHT / 2 + 34);
    }
  }

  private drawPauseScreen(): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.font = "60px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2 - 52);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS WATCHING...", WIDTH / 2, HEIGHT / 2 + 4);

    this.ctx.font = "20px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("PRESS P OR ESC TO RESUME", WIDTH / 2, HEIGHT / 2 + 54);
  }

  private drawWaveClearScreen(): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.70)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.font = "58px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("WAVE CLEARED", WIDTH / 2, HEIGHT / 2 - 44);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("UAEC FORMATION BROKEN.", WIDTH / 2, HEIGHT / 2 + 10);

    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("NEXT WAVE INCOMING..", WIDTH / 2, HEIGHT / 2 + 46);
  }

  private drawGameOverScreen(): void {
    const time = performance.now() / 1000;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;
    const newHighFlash = 0.75 + Math.sin(time * 6.5) * 0.25;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.font = "62px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("SIGNAL LOST", WIDTH / 2, 88);

    if (this.earnedNewHighScore) {
      this.ctx.save();
      this.ctx.globalAlpha = newHighFlash;
      this.ctx.font = "26px 'Courier New', monospace";
      this.ctx.fillStyle = "#fff7d6";
      this.ctx.fillText("NEW HIGH SCORE", WIDTH / 2, 128);
      this.ctx.restore();
    }

    const panelX = WIDTH / 2 - 210;
    const panelY = 150;
    const panelW = 420;
    const panelH = 112;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.78)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.72)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText(`FINAL SCORE: ${String(this.score).padStart(6, "0")}`, WIDTH / 2, panelY + 34);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(`HIGH SCORE: ${String(this.highScore).padStart(6, "0")}`, WIDTH / 2, panelY + 66);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(`WAVE REACHED: ${String(this.wave).padStart(2, "0")}`, WIDTH / 2, panelY + 98);

    this.drawGameOverPortrait();

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE CITADEL HAS WITNESSED", WIDTH / 2, 594);

    this.ctx.save();
    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText("PRESS ENTER OR SPACE TO REDEPLOY", WIDTH / 2, 640);
    this.ctx.restore();
  }

  private drawGameOverPortrait(): void {
    const time = performance.now() / 1000;
    const bob = Math.sin(time * 1.8) * 5;
    const flicker = Math.sin(time * 12) > 0.96 ? 0.82 : 1;

    const size = 190;
    const x = WIDTH / 2 - size / 2;
    const y = 316 + bob;

    this.ctx.save();
    this.ctx.globalAlpha = flicker;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.78)";
    this.ctx.fillRect(x - 18, y - 18, size + 36, size + 36);

    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.45)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - 18, y - 18, size + 36, size + 36);

    const portrait = this.sprites.get("citadelWitness");

    if (portrait) {
      this.ctx.drawImage(portrait, x, y, size, size);
    } else {
      this.ctx.fillStyle = "#111827";
      this.ctx.fillRect(x, y, size, size);

      this.ctx.strokeStyle = "#f5f7ff";
      this.ctx.strokeRect(x, y, size, size);

      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.font = "16px 'Courier New', monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PORTRAIT", WIDTH / 2, y + 88);
      this.ctx.fillText("MISSING", WIDTH / 2, y + 110);
    }

    this.ctx.restore();
  }

}

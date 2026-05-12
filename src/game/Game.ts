import { COLS, HEIGHT, ROWS, TOTAL_ENEMIES, WIDTH } from "./constants";
import { AudioManager } from "./audio";
import { AtmosphereRenderer } from "./atmosphereRenderer";
import { BALANCE } from "./balance";
import { BarricadeRenderer } from "./barricadeRenderer";
import { SpriteManager } from "./assets";
import type { SpriteKey } from "./assets";
import { EffectsRenderer } from "./effectsRenderer";
import { InputManager } from "./input";
import { PlayerRenderer } from "./playerRenderer";
import {
  getFormationStepDelay,
  getTankScore,
  getWaveStartingAdvance,
} from "./gameplay";
import { HudRenderer } from "./hudRenderer";
import {
  ENEMY_SPRITE,
  EXPLOSION_SPRITE,
  TANK_SPRITE,
} from "./rendering";
import { ScreenRenderer } from "./screenRenderer";
import { SpriteRenderer } from "./spriteRenderer";
import { readNumber, writeNumber } from "./storage";
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
  private static readonly HIGH_SCORE_KEY = "uaec-invasion-high-score";

  private backgroundImage = new Image();
  private backgroundLoaded = false;
  private mode: GameMode = "start";
  private score = 0;
  private highScore = readNumber(Game.HIGH_SCORE_KEY, 0);
  private wave = 1;
  private lives = 3;
  private modeTimerMs = 0;
  private playerShotCount = 0;
  private earnedNewHighScore = false;
  private sprites = new SpriteManager();

  private player: Player = {
    x: WIDTH / 2 - 24,
    y: HEIGHT - 78,
    width: 48,
    height: 38,
    speed: BALANCE.player.speed,
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

  private enemyShotCooldownMs: number = BALANCE.enemies.startingShotCooldownMs;

  private tank: Tank = {
    active: false,
    x: -160,
    y: 112,
    width: 130,
    height: 42,
    direction: 1,
    speed: BALANCE.tank.baseSpeed,
    spawnTimerMs: 14000,
  };

  private nextTankDirection: Direction = -1;

  private ctx: CanvasRenderingContext2D;
  private atmosphereRenderer: AtmosphereRenderer;
  private barricadeRenderer: BarricadeRenderer;
  private effectsRenderer: EffectsRenderer;
  private spriteRenderer: SpriteRenderer;
  private hudRenderer: HudRenderer;
  private playerRenderer: PlayerRenderer;
  private screenRenderer: ScreenRenderer;
  private input: InputManager;
  private audio: AudioManager;
  private spriteToggleHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    input: InputManager,
    audio: AudioManager,
  ) {
    this.ctx = ctx;
    this.atmosphereRenderer = new AtmosphereRenderer(ctx);
    this.effectsRenderer = new EffectsRenderer(ctx, this.sprites);
    this.spriteRenderer = new SpriteRenderer(ctx);
    this.barricadeRenderer = new BarricadeRenderer(
      ctx,
      this.sprites,
      this.spriteRenderer,
    );
    this.hudRenderer = new HudRenderer(ctx, this.sprites, this.spriteRenderer);
    this.playerRenderer = new PlayerRenderer(
      ctx,
      this.sprites,
      this.spriteRenderer,
    );
    this.screenRenderer = new ScreenRenderer(ctx, this.sprites);
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
    this.spriteToggleHandler = (event) => {
      const isSpriteToggle =
        event.code === "KeyT" || event.key.toLowerCase() === "t";

      if (!isSpriteToggle || event.repeat) return;

      event.preventDefault();
      this.sprites.toggleEnabled();

      console.info(
        `UAEC Invasion sprites: ${this.sprites.isEnabled ? "ON" : "OFF"}`,
      );
    };

    window.addEventListener("keydown", this.spriteToggleHandler);
  }

  dispose(): void {
    if (this.spriteToggleHandler) {
      window.removeEventListener("keydown", this.spriteToggleHandler);
      this.spriteToggleHandler = null;
    }
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
          this.player.invulnerableMs = BALANCE.player.hitInvulnerableMs;
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
  this.atmosphereRenderer.drawAtmosphereOverlay();

  // Darken the busy street before drawing enemies and projectiles.
  this.atmosphereRenderer.drawGameplayReadabilityVeil();

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
    this.player.invulnerableMs = BALANCE.player.respawnInvulnerableMs;

    const startingAdvance = this.getWaveStartingAdvance();

    this.formation = {
      xOffset: 0,
      yAdvance: startingAdvance,
      direction: 1,
      stepTimerMs: 0,
      stepDelayMs: 900,
      animationFrame: 0,
    };

    this.enemyShotCooldownMs = BALANCE.enemies.startingShotCooldownMs;
    this.playerShotCount = 0;

    this.tank = {
      active: false,
      x: -160,
      y: 112,
      width: 130,
      height: 42,
      direction: 1,
      speed: BALANCE.tank.baseSpeed,
      spawnTimerMs:
        BALANCE.tank.firstSpawnMinMs +
        Math.random() * BALANCE.tank.firstSpawnRandomBonusMs,
    };
  }

  private createEnemies(): Enemy[] {
    const enemies: Enemy[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type: EnemyType = row === 0 ? "armored" : row <= 2 ? "shield" : "officer";
        const score =
          type === "armored"
            ? BALANCE.scoring.armored
            : type === "shield"
              ? BALANCE.scoring.shield
              : BALANCE.scoring.officer;

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
      speedY: BALANCE.player.missileSpeed,
    };

    this.playerFireFlashMs = BALANCE.player.fireFlashMs;
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
    this.formation.xOffset += attemptedDirection * BALANCE.formation.sideStep;

    const bounds = this.getFormationBounds();

    if (
      bounds &&
      (bounds.x < BALANCE.formation.leftBoundary ||
        bounds.x + bounds.width > WIDTH - BALANCE.formation.rightBoundaryPadding)
    ) {
      this.formation.xOffset -= attemptedDirection * BALANCE.formation.sideStep;
      this.formation.direction *= -1;
      this.formation.yAdvance += BALANCE.formation.advanceStep;
    }

    this.audio.playHeartbeat(aliveCount);
  }

  private updateEnemyShooting(dtMs: number): void {
    this.enemyShotCooldownMs -= dtMs;

    if (this.enemyProjectiles.length >= BALANCE.enemies.maxActiveProjectiles) return;
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
      speedY:
        BALANCE.enemies.baseProjectileSpeed +
        this.wave * BALANCE.enemies.projectileSpeedPerWave,
    });

    const aliveCount = this.getAliveEnemies().length;
    this.enemyShotCooldownMs =
      Math.max(
        BALANCE.enemies.minimumShotCooldownMs,
        BALANCE.enemies.startingShotCooldownMs -
          (TOTAL_ENEMIES - aliveCount) *
            BALANCE.enemies.cooldownReductionPerEnemyKilledMs,
      ) +
      Math.random() * BALANCE.enemies.randomCooldownBonusMs;
  }

  private updateTank(dtMs: number): void {
    const dt = dtMs / 1000;

    if (this.tank.active) {
      this.tank.x += this.tank.direction * this.tank.speed * dt;

      if (this.tank.direction === 1 && this.tank.x > WIDTH + 170) {
        this.tank.active = false;
        this.tank.spawnTimerMs =
          BALANCE.tank.respawnMinMs +
          Math.random() * BALANCE.tank.respawnRandomBonusMs;
      }

      if (this.tank.direction === -1 && this.tank.x < -190) {
        this.tank.active = false;
        this.tank.spawnTimerMs =
          BALANCE.tank.respawnMinMs +
          Math.random() * BALANCE.tank.respawnRandomBonusMs;
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
        speed: BALANCE.tank.baseSpeed + this.wave * BALANCE.tank.speedPerWave,
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
      const tankScore = getTankScore(this.playerShotCount);
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
      this.tank.spawnTimerMs =
        BALANCE.tank.respawnMinMs +
        1000 +
        Math.random() * BALANCE.tank.respawnRandomBonusMs;
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
        this.modeTimerMs = BALANCE.screens.playerHitPauseMs;
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
      this.modeTimerMs = BALANCE.screens.waveClearPauseMs;
      this.playerMissile = null;
      this.enemyProjectiles = [];
      this.audio.playWaveClear();
      return;
    }

    const dangerLineY = HEIGHT - BALANCE.danger.playerDangerLineOffset;

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
    return getFormationStepDelay(aliveCount, this.wave);
  }

  private getWaveStartingAdvance(): number {
    return getWaveStartingAdvance(this.wave);
  }

  private addScore(points: number): void {
    this.score += points;

    if (this.score > this.highScore) {
      this.earnedNewHighScore = true;
      this.highScore = this.score;
      writeNumber(Game.HIGH_SCORE_KEY, this.highScore);
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

  private drawHud(): void {
    this.hudRenderer.draw({
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      lives: this.lives,
      isMusicMuted: this.audio.isMusicMuted,
      isSfxMuted: this.audio.isSfxMuted,
    });
  }

  private drawPlayer(): void {
    this.playerRenderer.draw(this.player, this.playerFireFlashMs);
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

        this.spriteRenderer.drawImageWithGlow(
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
      this.spriteRenderer.drawImage(spriteKey, enemySprite, drawX, drawY, drawWidth, drawHeight);
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

        this.spriteRenderer.drawImageWithGlow(
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
        this.spriteRenderer.drawImageWithGlow(
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
    this.barricadeRenderer.draw(this.barricadeBlocks);
  }

  private drawProjectiles(): void {
    this.effectsRenderer.drawProjectiles(
      this.playerMissile,
      this.enemyProjectiles,
    );
  }

  private drawExplosions(): void {
    this.effectsRenderer.drawExplosions(this.explosions);
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
    this.screenRenderer.drawStartScreen(
      {
        highScore: this.highScore,
        isMusicMuted: this.audio.isMusicMuted,
        isSfxMuted: this.audio.isSfxMuted,
      },
      () => this.drawBackground(),
    );
  }



  private drawPlayerHitScreen(): void {
    this.screenRenderer.drawPlayerHitScreen(this.lives);
  }

  private drawPauseScreen(): void {
    this.screenRenderer.drawPauseScreen();
  }

  private drawWaveClearScreen(): void {
    this.screenRenderer.drawWaveClearScreen();
  }

  private drawGameOverScreen(): void {
    this.screenRenderer.drawGameOverScreen({
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      earnedNewHighScore: this.earnedNewHighScore,
    });
  }

}

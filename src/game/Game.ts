import { HEIGHT, WIDTH } from "./constants";
import { AudioManager } from "./audio";
import { AtmosphereRenderer } from "./atmosphereRenderer";
import { BALANCE } from "./balance";
import { BarricadeRenderer } from "./barricadeRenderer";
import { BackgroundRenderer } from "./backgroundRenderer";
import { SpriteManager } from "./assets";
import {
  didHitTank,
  findBarricadeHit,
  findEnemyHit,
  findEnemyProjectileHit,
} from "./collision";
import { EffectsRenderer } from "./effectsRenderer";
import { EnemyRenderer } from "./enemyRenderer";
import { FloatingTextRenderer } from "./floatingTextRenderer";
import {
  getEnemyRect,
  getFormationBounds,
  getPlayerHitbox,
} from "./geometry";
import { InputManager } from "./input";
import { PlayerRenderer } from "./playerRenderer";
import {
  chooseEnemyShooter,
  createBarricades,
  createEnemies,
  getEnemyShotCooldown,
  getFormationStepDelay,
  getTankScore,
  getWaveStartingAdvance,
  updateEnemyProjectiles,
  updateExplosions,
  updateFloatingTexts,
  updatePlayerMissile,
} from "./gameplay";
import { HudRenderer } from "./hudRenderer";
import { EXPLOSION_SPRITE } from "./rendering";
import { ScreenRenderer } from "./screenRenderer";
import { SpriteRenderer } from "./spriteRenderer";
import { readNumber, writeNumber } from "./storage";
import { TankRenderer } from "./tankRenderer";
import { clamp, rectsOverlap } from "./utils";
import type {
  BarricadeBlock,
  Direction,
  Enemy,
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
  private backgroundRenderer: BackgroundRenderer;
  private barricadeRenderer: BarricadeRenderer;
  private effectsRenderer: EffectsRenderer;
  private enemyRenderer: EnemyRenderer;
  private floatingTextRenderer: FloatingTextRenderer;
  private spriteRenderer: SpriteRenderer;
  private hudRenderer: HudRenderer;
  private playerRenderer: PlayerRenderer;
  private screenRenderer: ScreenRenderer;
  private tankRenderer: TankRenderer;
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
    this.backgroundRenderer = new BackgroundRenderer(ctx);
    this.effectsRenderer = new EffectsRenderer(ctx, this.sprites);
    this.floatingTextRenderer = new FloatingTextRenderer(ctx);
    this.spriteRenderer = new SpriteRenderer(ctx);
    this.enemyRenderer = new EnemyRenderer(
      ctx,
      this.sprites,
      this.spriteRenderer,
    );
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
    this.tankRenderer = new TankRenderer(
      ctx,
      this.sprites,
      this.spriteRenderer,
    );
    this.input = input;
    this.audio = audio;
    this.setupSpriteToggleHotkey();

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
    this.enemies = createEnemies();
    this.barricadeBlocks = createBarricades();
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

    const shooter = chooseEnemyShooter(this.enemies);
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
    this.enemyShotCooldownMs = getEnemyShotCooldown(aliveCount);
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
    this.playerMissile = updatePlayerMissile(this.playerMissile, dtMs);
    this.enemyProjectiles = updateEnemyProjectiles(
      this.enemyProjectiles,
      dtMs,
      HEIGHT + 40,
    );
  }

  private handleCollisions(): void {
    this.handlePlayerMissileCollisions();
    this.handleEnemyProjectileCollisions();
  }

  private handlePlayerMissileCollisions(): void {
    if (!this.playerMissile) return;

    const barricadeHit = findBarricadeHit(
      this.playerMissile,
      this.barricadeBlocks,
    );

    if (barricadeHit) {
      this.damageBarricadeBlock(barricadeHit);
      this.playerMissile = null;
      return;
    }

    if (didHitTank(this.playerMissile, this.tank)) {
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

    const enemyHit = findEnemyHit(
      this.playerMissile,
      this.enemies,
      this.formation,
    );

    if (enemyHit) {
      const { enemy, rect: enemyRect } = enemyHit;

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
    }
  }

  private handleEnemyProjectileCollisions(): void {
    const remainingProjectiles: Projectile[] = [];

    for (const projectile of this.enemyProjectiles) {
      const hit = findEnemyProjectileHit(
        projectile,
        this.barricadeBlocks,
        this.getPlayerHitbox(),
        this.player,
      );

      if (hit?.type === "barricade") {
        this.damageBarricadeBlock(hit.block);
        continue;
      }

      if (hit?.type === "player") {
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
    return getPlayerHitbox(this.player);
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

  private getEnemyRect(enemy: Enemy): Rect {
    return getEnemyRect(enemy, this.formation);
  }

  private getFormationBounds(): Rect | null {
    return getFormationBounds(this.enemies, this.formation);
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
    this.explosions = updateExplosions(this.explosions, dtMs);
  }

  private updateFloatingTexts(dtMs: number): void {
    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dtMs);
  }

  private drawBackground(): void {
    this.backgroundRenderer.draw();
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
    const items = this.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({
        enemy,
        rect: this.getEnemyRect(enemy),
      }));

    this.enemyRenderer.draw(items, this.formation.animationFrame);
  }

  private drawTank(): void {
    this.tankRenderer.draw(this.tank);
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
    this.floatingTextRenderer.draw(this.floatingTexts);
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

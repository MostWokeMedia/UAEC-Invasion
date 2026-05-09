import { COLS, HEIGHT, ROWS, TOTAL_ENEMIES, WIDTH } from "./constants";
import { AudioManager } from "./audio";
import { SpriteManager } from "./assets";
import { InputManager } from "./input";
import { clamp, rectsOverlap } from "./utils";
import type {
  BarricadeBlock,
  Direction,
  Enemy,
  EnemyType,
  FloatingText,
  GameMode,
  Player,
  Projectile,
  Rect,
  Tank,
} from "./types";

export class Game {
  private mode: GameMode = "start";
  private score = 0;
  private highScore = Number(localStorage.getItem("uaec-invasion-high-score") || 0);
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
    speed: 310,
    invulnerableMs: 0,
  };

  private enemies: Enemy[] = [];
  private barricadeBlocks: BarricadeBlock[] = [];
  private playerMissile: Projectile | null = null;
  private enemyProjectiles: Projectile[] = [];
  private floatingTexts: FloatingText[] = [];

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
    this.sprites.loadAll();
    this.startWave();
  }

  update(dtMs: number): void {
    if (this.input.consume("KeyM")) {
      this.audio.toggleMute();
    }

    const pausePressed = this.input.consume("KeyP") || this.input.consume("Escape");

    if (pausePressed && this.mode === "playing") {
      this.mode = "paused";
      return;
    }

    if (pausePressed && this.mode === "paused") {
      this.mode = "playing";
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
    this.drawBackground();
    this.drawTank();
    this.drawEnemies();
    this.drawBarricades();
    this.drawProjectiles();
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
  }

  private updatePlaying(dtMs: number): void {
    this.player.invulnerableMs = Math.max(0, this.player.invulnerableMs - dtMs);

    this.updatePlayer(dtMs);
    this.updatePlayerShooting();
    this.updateFormation(dtMs);
    this.updateEnemyShooting(dtMs);
    this.updateTank(dtMs);
    this.updateProjectiles(dtMs);
    this.handleCollisions();
    this.updateFloatingTexts(dtMs);
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
      const direction: Direction = Math.random() < 0.5 ? 1 : -1;

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

      this.playerMissile = null;
      this.tank.active = false;
      this.tank.spawnTimerMs = 21000 + Math.random() * 9000;
      this.audio.playTankHit();
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const enemyRect = this.getEnemyRect(enemy);

      if (rectsOverlap(this.playerMissile, enemyRect)) {
        enemy.alive = false;
        this.addScore(enemy.score);
        this.floatingTexts.push({
          text: `+${enemy.score}`,
          x: enemyRect.x + enemyRect.width / 2,
          y: enemyRect.y,
          lifeMs: 650,
        });

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

      if (this.player.invulnerableMs <= 0 && rectsOverlap(projectile, this.player)) {
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
    if (this.wave <= 2) return 0;

    return Math.min((this.wave - 2) * 6, 72);
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

  private getEnemyRect(enemy: Enemy): Rect {
    const rowY = [170, 240, 315, 405, 500][enemy.row];
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

  private updateFloatingTexts(dtMs: number): void {
    for (const floatingText of this.floatingTexts) {
      floatingText.lifeMs -= dtMs;
      floatingText.y -= 24 * (dtMs / 1000);
    }

    this.floatingTexts = this.floatingTexts.filter((floatingText) => floatingText.lifeMs > 0);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#050817");
    gradient.addColorStop(0.52, "#091225");
    gradient.addColorStop(1, "#03040a");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.fillStyle = "rgba(255, 79, 154, 0.16)";
    this.ctx.fillRect(48, 115, 50, 280);
    this.ctx.fillRect(WIDTH - 98, 135, 50, 260);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillText("NEO", 55, 170);
    this.ctx.fillText("TOKYO", 51, 205);
    this.ctx.fillText("未来", WIDTH - 86, 190);
    this.ctx.fillText("CITY", WIDTH - 90, 230);

    this.ctx.strokeStyle = "rgba(100, 210, 255, 0.16)";
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 18; i++) {
      const x = 130 + i * 44;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 135);
      this.ctx.lineTo(x - 155, HEIGHT);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.20)";
    for (let y = 180; y < HEIGHT; y += 58) {
      this.ctx.beginPath();
      this.ctx.moveTo(120, y);
      this.ctx.lineTo(WIDTH - 120, y + 16);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.23)";
    this.ctx.setLineDash([22, 22]);
    this.ctx.beginPath();
    this.ctx.moveTo(WIDTH / 2, 170);
    this.ctx.lineTo(WIDTH / 2, HEIGHT);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawHud(): void {
    this.ctx.font = "24px 'Courier New', monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("SCORE", 28, 34);
    this.ctx.fillText("HI-SCORE", 286, 34);
    this.ctx.fillText(`WAVE ${String(this.wave).padStart(2, "0")}`, 620, 34);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(String(this.score).padStart(6, "0"), 28, 64);
    this.ctx.fillText(String(this.highScore).padStart(6, "0"), 286, 64);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("LIVES", 810, 34);

    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillRect(812 + i * 36, 48, 24, 18);
      this.ctx.fillStyle = "#111827";
      this.ctx.fillRect(818 + i * 36, 54, 4, 4);
      this.ctx.fillRect(828 + i * 36, 54, 4, 4);
    }

    this.ctx.font = "16px 'Courier New', monospace";
    this.ctx.fillStyle = this.audio.isMuted ? "#ff4f9a" : "#9ee7ff";
    this.ctx.fillText(this.audio.isMuted ? "MUTED [M]" : "AUDIO [M]", 810, 92);
  }

  private drawPlayer(): void {
    if (this.player.invulnerableMs > 0 && Math.floor(this.player.invulnerableMs / 120) % 2 === 0) {
      return;
    }

    this.ctx.fillStyle = "#202838";
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = "#566176";
    this.ctx.fillRect(this.player.x + 12, this.player.y - 22, 24, 24);

    this.ctx.fillStyle = "#c9d3e8";
    this.ctx.fillRect(this.player.x + this.player.width / 2 - 6, this.player.y - 48, 12, 46);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillRect(this.player.x + 14, this.player.y - 30, 20, 5);
  }

  private drawEnemies(): void {
    const frame = this.formation.animationFrame;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const rect = this.getEnemyRect(enemy);
      const bob = frame === 0 ? 0 : rect.height * 0.05;

      if (enemy.type === "officer") {
        this.ctx.fillStyle = "#151d2d";
        this.ctx.fillRect(rect.x, rect.y + bob, rect.width, rect.height - bob);

        this.ctx.fillStyle = "#222b3f";
        this.ctx.fillRect(rect.x + rect.width * 0.18, rect.y - rect.height * 0.14 + bob, rect.width * 0.64, rect.height * 0.24);

        this.ctx.fillStyle = frame === 0 ? "#ff4f9a" : "#9ee7ff";
        this.ctx.fillRect(rect.x + rect.width * 0.16, rect.y + rect.height * 0.28 + bob, rect.width * 0.68, 4);

        this.ctx.fillStyle = "#0d1220";
        this.ctx.fillRect(rect.x - rect.width * 0.14, rect.y + rect.height * 0.74, rect.width * 0.28, rect.height * 0.12);
        this.ctx.fillRect(rect.x + rect.width * 0.86, rect.y + rect.height * 0.74, rect.width * 0.28, rect.height * 0.12);
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
        this.ctx.fillRect(rect.x + rect.width * 0.12, rect.y + rect.height * 0.30 + bob, rect.width * 0.38, 4);
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
        this.ctx.fillRect(rect.x + rect.width * 0.18, rect.y + rect.height * 0.34 + bob, rect.width * 0.64, 5);
      }

      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.font = `${Math.max(8, rect.width * 0.24)}px 'Courier New', monospace`;
      this.ctx.textAlign = "center";
      this.ctx.fillText("UAEC", rect.x + rect.width / 2, rect.y + rect.height * 0.62 + bob);
    }
  }

  private drawTank(): void {
    if (!this.tank.active) return;

    const tankSprite = this.sprites.get("uaecTank");

    if (tankSprite) {
      const drawWidth = this.tank.width;
      const drawHeight = this.tank.height + 26;
      const drawX = this.tank.x;
      const drawY = this.tank.y - 10;

      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.shadowColor = "rgba(255, 79, 154, 0.28)";
      this.ctx.shadowBlur = 12;

      if (this.tank.direction === -1) {
        this.ctx.translate(drawX + drawWidth, drawY);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(tankSprite, 0, 0, drawWidth, drawHeight);
      } else {
        this.ctx.drawImage(tankSprite, drawX, drawY, drawWidth, drawHeight);
      }

      this.ctx.restore();
      return;
    }

    this.drawPlaceholderTank();
  }

  private drawPlaceholderTank(): void {
    this.ctx.fillStyle = "#1a2233";
    this.ctx.fillRect(this.tank.x, this.tank.y + 14, this.tank.width, this.tank.height - 14);

    this.ctx.fillStyle = "#30394f";
    this.ctx.fillRect(this.tank.x + 34, this.tank.y, 54, 24);

    this.ctx.fillStyle = "#111827";
    this.ctx.fillRect(this.tank.x + 8, this.tank.y + this.tank.height - 8, this.tank.width - 16, 10);

    this.ctx.fillStyle = "#c9d3e8";
    const barrelX = this.tank.direction === 1 ? this.tank.x + this.tank.width - 5 : this.tank.x - 48;
    this.ctx.fillRect(barrelX, this.tank.y + 16, 52, 8);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.font = "14px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("UAEC", this.tank.x + this.tank.width / 2, this.tank.y + 36);
  }

  private drawBarricades(): void {
    const fullBlockSprite = this.sprites.get("barricadeFull");
    const damagedBlockSprite = this.sprites.get("barricadeDamaged");

    for (const block of this.barricadeBlocks) {
      if (!block.active) continue;

      const sprite = block.hp === 2 ? fullBlockSprite : damagedBlockSprite;

      if (sprite) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(sprite, block.x, block.y, block.width, block.height);
        this.ctx.restore();
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
      this.ctx.shadowColor = "rgba(255, 122, 61, 0.45)";
      this.ctx.shadowBlur = 12;
      this.ctx.drawImage(
        missileSprite,
        this.playerMissile.x - 7,
        this.playerMissile.y - 4,
        20,
        34,
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
        this.ctx.shadowColor = "rgba(255, 53, 93, 0.45)";
        this.ctx.shadowBlur = 10;
        this.ctx.drawImage(
          enemyProjectileSprite,
          projectile.x - 5,
          projectile.y - 3,
          18,
          28,
        );
        this.ctx.restore();
        continue;
      }

      this.ctx.fillStyle = "#ff355d";
      this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
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
    const titleFlicker = Math.sin(time * 18) > 0.92 ? 0.68 : 1;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;
    const stepFrame = Math.floor(time * 2.2) % 2;

    this.ctx.save();

    const gradient = this.ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#03040c");
    gradient.addColorStop(0.42, "#071020");
    gradient.addColorStop(1, "#020207");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.fillStyle = "rgba(255, 79, 154, 0.10)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.strokeStyle = "rgba(100, 210, 255, 0.16)";
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 18; i++) {
      const x = 90 + i * 52;
      this.ctx.beginPath();
      this.ctx.moveTo(WIDTH / 2, 205);
      this.ctx.lineTo(x - 220, HEIGHT);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.22)";
    for (let y = 250; y < HEIGHT; y += 54) {
      this.ctx.beginPath();
      this.ctx.moveTo(90, y);
      this.ctx.lineTo(WIDTH - 90, y + 18);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = "rgba(10, 15, 30, 0.92)";
    this.ctx.fillRect(WIDTH / 2 - 66, 72, 132, 180);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.55)";
    this.ctx.strokeRect(WIDTH / 2 - 66, 72, 132, 180);

    this.ctx.fillStyle = "rgba(158, 231, 255, 0.16)";
    this.ctx.fillRect(WIDTH / 2 - 36, 104, 72, 18);
    this.ctx.fillRect(WIDTH / 2 - 44, 144, 88, 12);
    this.ctx.fillRect(WIDTH / 2 - 28, 184, 56, 14);

    this.ctx.fillStyle = "rgba(255, 79, 154, 0.15)";
    this.ctx.font = "20px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("THE CITADEL", WIDTH / 2, 286);

    this.ctx.globalAlpha = 0.42;
    this.drawTitleEnemySilhouettes(stepFrame);
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.globalAlpha = titleFlicker;
    this.ctx.font = "76px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("UAEC", WIDTH / 2, 124);

    this.ctx.font = "72px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("INVASION", WIDTH / 2, 194);

    this.ctx.strokeStyle = "#9ee7ff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeText("INVASION", WIDTH / 2, 194);
    this.ctx.globalAlpha = 1;

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS UNDER LOCKDOWN.", WIDTH / 2, 258);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE UAEC ARE ADVANCING.", WIDTH / 2, 292);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("HOLD THE LINE.", WIDTH / 2, 326);

    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "28px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText("PRESS ENTER OR SPACE", WIDTH / 2, 390);
    this.ctx.globalAlpha = 1;

    const panelX = WIDTH / 2 - 235;
    const panelY = 425;
    const panelW = 470;
    const panelH = 152;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.78)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.72)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.textAlign = "left";

    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("A/D or ←/→", panelX + 48, panelY + 42);
    this.ctx.fillText("SPACE", panelX + 48, panelY + 76);
    this.ctx.fillText("P/ESC", panelX + 48, panelY + 110);
    this.ctx.fillText("M", panelX + 48, panelY + 134);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("MOVE", panelX + 278, panelY + 42);
    this.ctx.fillText("FIRE", panelX + 278, panelY + 76);
    this.ctx.fillText("PAUSE", panelX + 278, panelY + 110);
    this.ctx.fillText(this.audio.isMuted ? "UNMUTE" : "MUTE", panelX + 278, panelY + 134);

    this.ctx.textAlign = "center";
    this.ctx.font = "20px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(
      `HIGH SCORE: ${String(this.highScore).padStart(6, "0")}`,
      WIDTH / 2,
      620,
    );

    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("THE CITADEL IS WATCHING...", WIDTH / 2, 664);

    this.ctx.globalAlpha = 0.12;
    this.ctx.fillStyle = "#f5f7ff";
    for (let y = 0; y < HEIGHT; y += 4) {
      this.ctx.fillRect(0, y, WIDTH, 1);
    }

    this.ctx.restore();
  }

  private drawTitleEnemySilhouettes(stepFrame: number): void {
    const baseY = 484;
    const bob = stepFrame === 0 ? 0 : 6;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const x = 210 + col * 68 + (row % 2) * 10;
        const y = baseY + row * 42 + bob;
        const width = row === 0 ? 34 : row === 1 ? 30 : 26;
        const height = row === 0 ? 28 : row === 1 ? 24 : 22;

        this.ctx.fillStyle = row === 0 ? "#30394f" : "#151d2d";
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = row === 0 ? "#ff4f9a" : "#9ee7ff";
        this.ctx.fillRect(x + 5, y + 9, width - 10, 3);
      }
    }
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
      this.ctx.shadowColor = "rgba(255, 79, 154, 0.30)";
      this.ctx.shadowBlur = 18;
      this.ctx.drawImage(portrait, x, y, size, size);
      this.ctx.shadowBlur = 0;
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

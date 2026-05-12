import type { SpriteManager } from "./assets";
import { HEIGHT, WIDTH } from "./constants";
import { BUILD_LABEL } from "./metadata";

export type StartScreenState = {
  highScore: number;
  isMusicMuted: boolean;
  isSfxMuted: boolean;
};

export type GameOverScreenState = {
  score: number;
  highScore: number;
  wave: number;
  earnedNewHighScore: boolean;
};

export class ScreenRenderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteManager;

  constructor(ctx: CanvasRenderingContext2D, sprites: SpriteManager) {
    this.ctx = ctx;
    this.sprites = sprites;
  }

  drawStartScreen(
    state: StartScreenState,
    drawBackground: () => void,
  ): void {
    const time = performance.now() / 1000;
    const titleFlicker = Math.sin(time * 18) > 0.94 ? 0.72 : 1;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;

    this.ctx.save();

    drawBackground();

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

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

    this.ctx.font = "21px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS UNDER LOCKDOWN.", WIDTH / 2, panelY + 218);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE UAEC ARE ADVANCING.", WIDTH / 2, panelY + 252);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("HOLD THE LINE.", WIDTH / 2, panelY + 286);

    this.ctx.save();
    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "28px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText("PRESS ENTER OR SPACE", WIDTH / 2, panelY + 348);
    this.ctx.restore();

    this.drawStartControls(panelY, state);
    this.drawStartFooter(state.highScore);

    this.ctx.restore();
  }

  drawPlayerHitScreen(lives: number): void {
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

    if (lives > 0) {
      this.ctx.font = "54px 'Courier New', monospace";
      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillText("SIGNAL DISRUPTED", WIDTH / 2, HEIGHT / 2 - 70);

      this.ctx.font = "24px 'Courier New', monospace";
      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.fillText(
        `LIVES REMAINING: ${String(lives).padStart(2, "0")}`,
        WIDTH / 2,
        HEIGHT / 2 - 18,
      );

      this.ctx.fillStyle = "#9ee7ff";
      this.ctx.fillText("REDEPLOYING...", WIDTH / 2, HEIGHT / 2 + 34);
      return;
    }

    this.ctx.font = "54px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff355d";
    this.ctx.fillText("SIGNAL COLLAPSING", WIDTH / 2, HEIGHT / 2 - 70);

    this.ctx.font = "24px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("NO LIVES REMAINING", WIDTH / 2, HEIGHT / 2 - 18);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("TRANSMISSION ENDING...", WIDTH / 2, HEIGHT / 2 + 34);
  }

  drawPauseScreen(): void {
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

  drawWaveClearScreen(): void {
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

  drawGameOverScreen(state: GameOverScreenState): void {
    const time = performance.now() / 1000;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;
    const newHighFlash = 0.75 + Math.sin(time * 6.5) * 0.25;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.textAlign = "center";
    this.ctx.font = "62px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("SIGNAL LOST", WIDTH / 2, 88);

    if (state.earnedNewHighScore) {
      this.ctx.save();
      this.ctx.globalAlpha = newHighFlash;
      this.ctx.font = "26px 'Courier New', monospace";
      this.ctx.fillStyle = "#fff7d6";
      this.ctx.fillText("NEW HIGH SCORE", WIDTH / 2, 128);
      this.ctx.restore();
    }

    this.drawGameOverStats(state);
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

  private drawStartControls(panelY: number, state: StartScreenState): void {
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
    this.ctx.fillText(state.isMusicMuted ? "MUSIC ON" : "MUSIC OFF", controlsX + 260, controlsY + 84);
    this.ctx.fillText(state.isSfxMuted ? "SFX ON" : "SFX OFF", controlsX + 260, controlsY + 112);
  }

  private drawStartFooter(highScore: number): void {
    this.ctx.textAlign = "center";
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(
      `HIGH SCORE: ${String(highScore).padStart(6, "0")}`,
      WIDTH / 2,
      660,
    );

    this.ctx.font = "17px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("THE CITADEL IS WATCHING...", WIDTH / 2, 690);

    this.ctx.font = "13px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText(BUILD_LABEL, WIDTH / 2, 716);
  }

  private drawGameOverStats(state: GameOverScreenState): void {
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
    this.ctx.fillText(`FINAL SCORE: ${String(state.score).padStart(6, "0")}`, WIDTH / 2, panelY + 34);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(`HIGH SCORE: ${String(state.highScore).padStart(6, "0")}`, WIDTH / 2, panelY + 66);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(`WAVE REACHED: ${String(state.wave).padStart(2, "0")}`, WIDTH / 2, panelY + 98);
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

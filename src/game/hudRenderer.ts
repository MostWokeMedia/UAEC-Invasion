import type { SpriteManager } from "./assets";
import { CANVAS_WIDTH, PLAYFIELD_X, WIDTH } from "./constants";
import type { SpriteRenderer } from "./spriteRenderer";

export type HudState = {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  isMusicMuted: boolean;
  isSfxMuted: boolean;
};

export class HudRenderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteManager;
  private spriteRenderer: SpriteRenderer;

  constructor(
    ctx: CanvasRenderingContext2D,
    sprites: SpriteManager,
    spriteRenderer: SpriteRenderer,
  ) {
    this.ctx = ctx;
    this.sprites = sprites;
    this.spriteRenderer = spriteRenderer;
  }

  draw(state: HudState): void {
    this.ctx.save();

    this.drawPanel();
    this.drawLabels();
    this.drawValues(state);
    this.drawLives(state.lives);
    this.drawAudioIndicators(state);

    this.ctx.restore();
  }

  private drawPanel(): void {
    this.ctx.fillStyle = "rgba(2, 3, 10, 0.78)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, 86);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.65)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 86);
    this.ctx.lineTo(CANVAS_WIDTH, 86);
    this.ctx.stroke();

    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.25)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, 82);
    this.ctx.lineTo(CANVAS_WIDTH, 82);
    this.ctx.stroke();
  }

  private drawLabels(): void {
    this.ctx.textAlign = "left";
    this.ctx.font = "15px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("SCORE", PLAYFIELD_X + 28, 26);
    this.ctx.fillText("HI-SCORE", PLAYFIELD_X + 224, 26);
    this.ctx.fillText("WAVE", PLAYFIELD_X + 454, 26);
    this.ctx.fillText("LIVES", PLAYFIELD_X + 610, 26);
  }

  private drawValues(state: HudState): void {
    this.ctx.font = "28px 'Courier New', monospace";

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(String(state.score).padStart(6, "0"), PLAYFIELD_X + 28, 62);

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText(String(state.highScore).padStart(6, "0"), PLAYFIELD_X + 224, 62);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(String(state.wave).padStart(2, "0"), PLAYFIELD_X + 454, 62);
  }

  private drawLives(lives: number): void {
    const lifeHeadSprite = this.sprites.get("citizenLifeHead");

    for (let i = 0; i < lives; i++) {
      const x = PLAYFIELD_X + 612 + i * 38;
      const y = 38;

      if (lifeHeadSprite) {
        this.spriteRenderer.drawImage("citizenLifeHead", lifeHeadSprite, x, y, 30, 30);
        continue;
      }

      this.ctx.fillStyle = "#202838";
      this.ctx.fillRect(x, y + 10, 24, 18);

      this.ctx.fillStyle = "#9ee7ff";
      this.ctx.fillRect(x + 7, y, 10, 12);

      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillRect(x + 3, y + 6, 18, 4);
    }
  }

  private drawAudioIndicators(state: HudState): void {
    this.ctx.textAlign = "right";
    this.ctx.font = "15px 'Courier New', monospace";

    this.ctx.fillStyle = state.isMusicMuted ? "#ff4f9a" : "#9ee7ff";
    this.ctx.fillText(state.isMusicMuted ? "MUSIC OFF [M]" : "MUSIC [M]", PLAYFIELD_X + WIDTH - 28, 26);

    this.ctx.fillStyle = state.isSfxMuted ? "#ff4f9a" : "#9ee7ff";
    this.ctx.fillText(state.isSfxMuted ? "SFX OFF [N]" : "SFX [N]", PLAYFIELD_X + WIDTH - 28, 50);
  }
}

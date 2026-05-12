import type { FloatingText } from "./types";

export class FloatingTextRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(floatingTexts: FloatingText[]): void {
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#f5f7ff";

    for (const floatingText of floatingTexts) {
      this.ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    }
  }
}

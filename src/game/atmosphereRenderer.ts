import { CANVAS_WIDTH, HEIGHT, PLAYFIELD_X, WIDTH } from "./constants";

export class AtmosphereRenderer {
  private ctx: CanvasRenderingContext2D;
  private gameplayReadabilityVeil: HTMLCanvasElement;
  private crtOverlay: HTMLCanvasElement;
  private vignetteOverlay: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.gameplayReadabilityVeil = this.createGameplayReadabilityVeil();
    this.crtOverlay = this.createCrtOverlay();
    this.vignetteOverlay = this.createVignetteOverlay();
  }

  drawGameplayReadabilityVeil(): void {
    this.ctx.drawImage(this.gameplayReadabilityVeil, 0, 0);
  }

  drawAtmosphereOverlay(): void {
    this.ctx.save();

    this.drawRainOverlay();
    this.ctx.drawImage(this.crtOverlay, 0, 0);
    this.ctx.drawImage(this.vignetteOverlay, 0, 0);

    this.ctx.restore();
  }

  private createGameplayReadabilityVeil(): HTMLCanvasElement {
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const playfieldTop = 86;
    const verticalVeil = ctx.createLinearGradient(0, playfieldTop, 0, HEIGHT);

    verticalVeil.addColorStop(0, "rgba(2, 5, 15, 0.50)");
    verticalVeil.addColorStop(0.42, "rgba(2, 5, 15, 0.40)");
    verticalVeil.addColorStop(0.72, "rgba(2, 5, 15, 0.28)");
    verticalVeil.addColorStop(1, "rgba(2, 5, 15, 0.18)");

    ctx.fillStyle = verticalVeil;
    ctx.fillRect(0, playfieldTop, CANVAS_WIDTH, HEIGHT - playfieldTop);

    const centerVeil = ctx.createRadialGradient(
      PLAYFIELD_X + WIDTH / 2,
      360,
      60,
      PLAYFIELD_X + WIDTH / 2,
      360,
      470,
    );

    centerVeil.addColorStop(0, "rgba(0, 0, 0, 0.28)");
    centerVeil.addColorStop(0.62, "rgba(0, 0, 0, 0.18)");
    centerVeil.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = centerVeil;
    ctx.fillRect(0, playfieldTop, CANVAS_WIDTH, HEIGHT - playfieldTop);

    return canvas;
  }

  private createCrtOverlay(): HTMLCanvasElement {
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "#f5f7ff";

    for (let y = 0; y < HEIGHT; y += 4) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ff4f9a";

    for (let x = 0; x < CANVAS_WIDTH; x += 6) {
      ctx.fillRect(x, 0, 1, HEIGHT);
    }

    return canvas;
  }

  private createVignetteOverlay(): HTMLCanvasElement {
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      HEIGHT / 2,
      120,
      CANVAS_WIDTH / 2,
      HEIGHT / 2,
      620,
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.62, "rgba(0, 0, 0, 0.10)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.58)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "#ff4f9a";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, HEIGHT - 8);

    return canvas;
  }

  private createOverlayCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = HEIGHT;
    return canvas;
  }

  private rainTile: HTMLCanvasElement | null = null;

  private createRainTile(): HTMLCanvasElement {
    // Pre-render the 90 rain streaks once at time 0; animation is a uniform
    // wrapped translation, so each frame just blits this tile with an offset.
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.strokeStyle = "#9ee7ff";
    ctx.lineWidth = 1;

    for (let i = 0; i < 90; i++) {
      const seedX = (i * 97) % CANVAS_WIDTH;
      const seedY = (i * 53) % HEIGHT;
      const x = (((seedX + Math.sin(i * 12.9898) * 40) % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
      const y = (seedY + i * 17) % HEIGHT;
      const length = 10 + (i % 4) * 4;

      // Draw wrapped copies so streaks crossing tile edges stay seamless.
      for (const dx of [-CANVAS_WIDTH, 0, CANVAS_WIDTH]) {
        for (const dy of [-HEIGHT, 0]) {
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy);
          ctx.lineTo(x + dx - 5, y + dy + length);
          ctx.stroke();
        }
      }
    }

    return canvas;
  }

  private drawRainOverlay(): void {
    if (!this.rainTile) this.rainTile = this.createRainTile();
    const fallSpeed = (performance.now() / 1000) * 360;
    const ox = (fallSpeed * 0.16) % CANVAS_WIDTH;
    const oy = fallSpeed % HEIGHT;

    this.ctx.save();
    this.ctx.globalAlpha = 0.22;
    this.ctx.drawImage(this.rainTile, ox, oy);
    this.ctx.drawImage(this.rainTile, ox - CANVAS_WIDTH, oy);
    this.ctx.drawImage(this.rainTile, ox, oy - HEIGHT);
    this.ctx.drawImage(this.rainTile, ox - CANVAS_WIDTH, oy - HEIGHT);
    this.ctx.restore();
  }
}

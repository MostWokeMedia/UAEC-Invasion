import { HEIGHT, WIDTH } from "./constants";

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
    ctx.fillRect(0, playfieldTop, WIDTH, HEIGHT - playfieldTop);

    const centerVeil = ctx.createRadialGradient(
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

    ctx.fillStyle = centerVeil;
    ctx.fillRect(0, playfieldTop, WIDTH, HEIGHT - playfieldTop);

    return canvas;
  }

  private createCrtOverlay(): HTMLCanvasElement {
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "#f5f7ff";

    for (let y = 0; y < HEIGHT; y += 4) {
      ctx.fillRect(0, y, WIDTH, 1);
    }

    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ff4f9a";

    for (let x = 0; x < WIDTH; x += 6) {
      ctx.fillRect(x, 0, 1, HEIGHT);
    }

    return canvas;
  }

  private createVignetteOverlay(): HTMLCanvasElement {
    const canvas = this.createOverlayCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const gradient = ctx.createRadialGradient(
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

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "#ff4f9a";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

    return canvas;
  }

  private createOverlayCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    return canvas;
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

}

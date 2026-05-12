import { HEIGHT, WIDTH } from "./constants";

export class AtmosphereRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawGameplayReadabilityVeil(): void {
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

  drawAtmosphereOverlay(): void {
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
}

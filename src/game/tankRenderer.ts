import type { SpriteManager } from "./assets";
import { TANK_SPRITE } from "./rendering";
import type { SpriteRenderer } from "./spriteRenderer";
import type { Tank } from "./types";

export class TankRenderer {
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

  draw(tank: Tank): void {
    if (!tank.active) return;

    this.drawDustTrail(tank);

    const tankSprite = this.sprites.get("uaecTank");

    if (tankSprite) {
      this.drawSpriteTank(tank, tankSprite);
      return;
    }

    this.drawPlaceholderTank(tank);
  }

  private drawDustTrail(tank: Tank): void {
    const drawWidth = tank.width * TANK_SPRITE.widthScale;
    const drawHeight = tank.height * TANK_SPRITE.heightScale;
    const drawX = tank.x + TANK_SPRITE.xOffset;
    const drawY = tank.y + TANK_SPRITE.yOffset;
    const time = performance.now() / 1000;
    const rearX =
      tank.direction === 1 ? drawX + drawWidth * 0.08 : drawX + drawWidth * 0.92;
    const baseY = drawY + drawHeight * 0.78;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 7; i++) {
      const drift = ((time * 22 + i * 13) % 44) * -tank.direction;
      const wobble = Math.sin(time * 4.2 + i * 1.9);
      const radius = 4 + (i % 3) * 2;
      const alpha = 0.16 - i * 0.014;
      const x = rearX + drift + wobble * 3;
      const y = baseY + i * 1.3 + Math.cos(time * 3.1 + i) * 2;

      this.ctx.fillStyle = `rgba(190, 177, 148, ${Math.max(0.035, alpha)})`;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, radius * 1.5, radius, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawSpriteTank(tank: Tank, tankSprite: HTMLImageElement): void {
    const drawWidth = tank.width * TANK_SPRITE.widthScale;
    const drawHeight = tank.height * TANK_SPRITE.heightScale;
    const drawX = tank.x + TANK_SPRITE.xOffset;
    const drawY = tank.y + TANK_SPRITE.yOffset;

    this.ctx.save();

    if (tank.direction === -1) {
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

      this.spriteRenderer.drawImage(
        "uaecTank",
        tankSprite,
        0,
        drawY,
        drawWidth,
        drawHeight,
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

      this.spriteRenderer.drawImage(
        "uaecTank",
        tankSprite,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
    }

    this.ctx.restore();
  }

  private drawPlaceholderTank(tank: Tank): void {
    this.ctx.save();

    this.ctx.fillStyle = "#111827";
    this.ctx.fillRect(tank.x, tank.y, tank.width, tank.height);

    this.ctx.fillStyle = "#1f2937";
    this.ctx.fillRect(
      tank.x + 16,
      tank.y - 10,
      tank.width * 0.45,
      tank.height * 0.55,
    );

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillRect(
      tank.x + tank.width * 0.16,
      tank.y + tank.height * 0.36,
      tank.width * 0.22,
      4,
    );

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.font = "16px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("UAEC", tank.x + tank.width / 2, tank.y + 28);

    this.ctx.restore();
  }
}

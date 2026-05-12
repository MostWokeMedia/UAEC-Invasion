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

    const tankSprite = this.sprites.get("uaecTank");

    if (tankSprite) {
      this.drawSpriteTank(tank, tankSprite);
      return;
    }

    this.drawPlaceholderTank(tank);
  }

  private drawSpriteTank(tank: Tank, tankSprite: HTMLImageElement): void {
    const drawWidth = tank.width;
    const drawHeight = tank.height + TANK_SPRITE.extraHeight;
    const drawX = tank.x;
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

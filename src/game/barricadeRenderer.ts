import type { SpriteManager } from "./assets";
import type { SpriteRenderer } from "./spriteRenderer";
import type { BarricadeBlock } from "./types";

export class BarricadeRenderer {
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

  draw(blocks: BarricadeBlock[]): void {
    const fullBlockSprite = this.sprites.get("barricadeFull");
    const damagedBlockSprite = this.sprites.get("barricadeDamaged");

    for (const block of blocks) {
      if (!block.active) continue;

      const sprite = block.hp === 2 ? fullBlockSprite : damagedBlockSprite;

      if (sprite) {
        this.spriteRenderer.drawImage(
          block.hp === 2 ? "barricadeFull" : "barricadeDamaged",
          sprite,
          block.x,
          block.y,
          block.width,
          block.height,
        );
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
}

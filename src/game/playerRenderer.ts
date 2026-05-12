import type { SpriteManager } from "./assets";
import { PLAYER_SPRITE } from "./rendering";
import type { SpriteRenderer } from "./spriteRenderer";
import type { Player } from "./types";

export class PlayerRenderer {
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

  draw(player: Player, fireFlashMs: number): void {
    if (player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 120) % 2 === 0) {
      return;
    }

    const firingSprite = this.sprites.get("playerFire");
    const idleSprite = this.sprites.get("playerIdle");
    const playerSprite = fireFlashMs > 0 && firingSprite ? firingSprite : idleSprite;

    if (playerSprite) {
      const drawWidth = PLAYER_SPRITE.width;
      const drawHeight = PLAYER_SPRITE.height;
      const drawX =
        player.x + player.width / 2 - drawWidth / 2 + PLAYER_SPRITE.xOffset;
      const drawY =
        player.y + player.height - drawHeight + PLAYER_SPRITE.yOffset;

      this.spriteRenderer.drawImage(
        fireFlashMs > 0 && firingSprite ? "playerFire" : "playerIdle",
        playerSprite,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
      return;
    }

    this.drawPlaceholderPlayer(player, fireFlashMs);
  }

  private drawPlaceholderPlayer(player: Player, fireFlashMs: number): void {
    this.ctx.fillStyle = "#202838";
    this.ctx.fillRect(player.x, player.y, player.width, player.height);

    this.ctx.fillStyle = "#566176";
    this.ctx.fillRect(player.x + 12, player.y - 22, 24, 24);

    this.ctx.fillStyle = "#c9d3e8";
    this.ctx.fillRect(player.x + player.width / 2 - 6, player.y - 48, 12, 46);

    this.ctx.fillStyle = fireFlashMs > 0 ? "#fff7d6" : "#ff4f9a";
    this.ctx.fillRect(player.x + 14, player.y - 30, 20, 5);
  }
}

import type { SpriteManager } from "./assets";
import { BALANCE } from "./balance";
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
    if (
      player.invulnerableMs > 0 &&
      Math.floor(player.invulnerableMs / 120) % 2 === 0
    ) {
      return;
    }

    const firingSprite = this.sprites.get("playerFire");
    const idleSprite = this.sprites.get("playerIdle");
    const isFirePoseActive =
      fireFlashMs > PLAYER_SPRITE.firePoseMs && Boolean(firingSprite);
    const playerSprite = isFirePoseActive && firingSprite ? firingSprite : idleSprite;

    if (playerSprite) {
      const drawWidth = PLAYER_SPRITE.width;
      const drawHeight = PLAYER_SPRITE.height;
      const drawX =
        player.x + player.width / 2 - drawWidth / 2 + PLAYER_SPRITE.xOffset;
      const drawY =
        player.y + player.height - drawHeight + PLAYER_SPRITE.yOffset;

      this.spriteRenderer.drawImage(
        isFirePoseActive && firingSprite ? "playerFire" : "playerIdle",
        playerSprite,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );

      if (fireFlashMs > 0) {
        this.drawMuzzleFlash(drawX, drawY, fireFlashMs);
      }

      return;
    }

    this.drawPlaceholderPlayer(player, fireFlashMs);
  }

  private drawMuzzleFlash(drawX: number, drawY: number, fireFlashMs: number): void {
    const flashRatio = Math.min(1, fireFlashMs / PLAYER_SPRITE.muzzleFlashMs);
    const flashX = drawX + PLAYER_SPRITE.width / 2 + PLAYER_SPRITE.muzzleXOffset;
    const flashY = drawY + PLAYER_SPRITE.muzzleYOffset;
    const coreRadius = 5 + flashRatio * 7;
    const glowRadius = 13 + flashRatio * 17;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";

    const glow = this.ctx.createRadialGradient(
      flashX,
      flashY,
      1,
      flashX,
      flashY,
      glowRadius,
    );

    glow.addColorStop(0, `rgba(255, 247, 214, ${0.86 * flashRatio})`);
    glow.addColorStop(0.34, `rgba(255, 79, 154, ${0.42 * flashRatio})`);
    glow.addColorStop(1, "rgba(255, 79, 154, 0)");

    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(flashX, flashY, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 247, 214, ${0.92 * flashRatio})`;
    this.ctx.beginPath();
    this.ctx.ellipse(
      flashX + 2,
      flashY,
      coreRadius,
      coreRadius * 0.42,
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawPlaceholderPlayer(player: Player, fireFlashMs: number): void {
    const bodyY = player.y + BALANCE.player.hitboxYOffset;

    this.ctx.fillStyle = "#202838";
    this.ctx.fillRect(player.x, bodyY, player.width, player.height);

    this.ctx.fillStyle = "#566176";
    this.ctx.fillRect(player.x + 12, bodyY - 22, 24, 24);

    this.ctx.fillStyle = "#c9d3e8";
    this.ctx.fillRect(player.x + player.width / 2 - 6, bodyY - 48, 12, 46);

    this.ctx.fillStyle = fireFlashMs > 0 ? "#fff7d6" : "#ff4f9a";
    this.ctx.fillRect(player.x + 14, bodyY - 30, 20, 5);
  }
}

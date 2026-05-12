import type { SpriteKey, SpriteManager } from "./assets";
import { ENEMY_SPRITE } from "./rendering";
import type { SpriteRenderer } from "./spriteRenderer";
import type { Enemy, Rect } from "./types";

export type EnemyRenderItem = {
  enemy: Enemy;
  rect: Rect;
};

export class EnemyRenderer {
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

  draw(items: EnemyRenderItem[], frame: number): void {
    for (const { enemy, rect } of items) {
      const spriteKey = this.getEnemySpriteKey(enemy, frame);
      const enemySprite = this.sprites.get(spriteKey);

      if (enemySprite) {
        this.drawSpriteEnemy(enemy, rect, frame, spriteKey, enemySprite);
        continue;
      }

      this.drawPlaceholderEnemy(enemy, rect, frame);
    }
  }

  private getEnemySpriteKey(enemy: Enemy, frame: number): SpriteKey {
    if (enemy.type === "officer") {
      return frame === 0 ? "uaecOfficerWalk1" : "uaecOfficerWalk2";
    }

    if (enemy.type === "shield") {
      return frame === 0 ? "uaecShieldWalk1" : "uaecShieldWalk2";
    }

    return frame === 0 ? "uaecArmoredWalk1" : "uaecArmoredWalk2";
  }

  private drawSpriteEnemy(
    enemy: Enemy,
    rect: Rect,
    frame: number,
    spriteKey: SpriteKey,
    enemySprite: HTMLImageElement,
  ): void {
    const bob = frame === 0 ? 0 : rect.height * ENEMY_SPRITE.bobRatio;
    const typeScale = ENEMY_SPRITE.typeScale[enemy.type];
    const typeXOffset = ENEMY_SPRITE.typeXOffset[enemy.type];

    const drawWidth = rect.width * ENEMY_SPRITE.widthScale * typeScale;
    const drawHeight = rect.height * ENEMY_SPRITE.heightScale * typeScale;

    const drawX =
      rect.x +
      rect.width / 2 -
      drawWidth / 2 +
      ENEMY_SPRITE.xOffset +
      typeXOffset;

    const drawY = rect.y + rect.height - drawHeight + bob;

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    this.ctx.globalAlpha = 0.32;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      rect.x + rect.width / 2,
      rect.y + rect.height * 0.96,
      drawWidth * 0.36,
      Math.max(4, drawHeight * 0.09),
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();

    this.ctx.globalAlpha = 0.72;
    const enemyGlowColor =
      enemy.type === "officer"
        ? "rgba(158, 231, 255, 0.62)"
        : enemy.type === "shield"
          ? "rgba(255, 79, 154, 0.68)"
          : "rgba(255, 79, 154, 0.82)";
    const enemyGlowBlur = enemy.type === "armored" ? 11 : enemy.type === "shield" ? 9 : 7;

    this.spriteRenderer.drawImageWithGlow(
      spriteKey,
      enemySprite,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      enemyGlowColor,
      enemyGlowBlur,
      0.72,
    );

    this.ctx.globalAlpha = 1;
    this.ctx.filter = "brightness(1.17) contrast(1.13) saturate(1.05)";
    this.spriteRenderer.drawImage(spriteKey, enemySprite, drawX, drawY, drawWidth, drawHeight);
    this.ctx.filter = "none";
    this.ctx.restore();
  }

  private drawPlaceholderEnemy(enemy: Enemy, rect: Rect, frame: number): void {
    const bob = frame === 0 ? 0 : rect.height * 0.05;

    if (enemy.type === "officer") {
      this.ctx.fillStyle = "#151d2d";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width, rect.height - bob);

      this.ctx.fillStyle = "#222b3f";
      this.ctx.fillRect(
        rect.x + rect.width * 0.18,
        rect.y - rect.height * 0.14 + bob,
        rect.width * 0.64,
        rect.height * 0.24,
      );

      this.ctx.fillStyle = frame === 0 ? "#ff4f9a" : "#9ee7ff";
      this.ctx.fillRect(
        rect.x + rect.width * 0.16,
        rect.y + rect.height * 0.28 + bob,
        rect.width * 0.68,
        4,
      );

      this.ctx.fillStyle = "#0d1220";
      this.ctx.fillRect(
        rect.x - rect.width * 0.14,
        rect.y + rect.height * 0.74,
        rect.width * 0.28,
        rect.height * 0.12,
      );
      this.ctx.fillRect(
        rect.x + rect.width * 0.86,
        rect.y + rect.height * 0.74,
        rect.width * 0.28,
        rect.height * 0.12,
      );
    }

    if (enemy.type === "shield") {
      const shieldShift = frame === 0 ? 0 : rect.width * 0.08;

      this.ctx.fillStyle = "#151d2d";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width * 0.62, rect.height - bob);

      this.ctx.fillStyle = "#3b4356";
      this.ctx.fillRect(
        rect.x + rect.width * 0.48 + shieldShift,
        rect.y + rect.height * 0.12,
        rect.width * 0.52,
        rect.height * 0.78,
      );

      this.ctx.strokeStyle = frame === 0 ? "#9ca3af" : "#9ee7ff";
      this.ctx.strokeRect(
        rect.x + rect.width * 0.48 + shieldShift,
        rect.y + rect.height * 0.12,
        rect.width * 0.52,
        rect.height * 0.78,
      );

      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillRect(
        rect.x + rect.width * 0.12,
        rect.y + rect.height * 0.30 + bob,
        rect.width * 0.38,
        4,
      );
    }

    if (enemy.type === "armored") {
      const shoulderPush = frame === 0 ? rect.width * 0.1 : rect.width * 0.18;

      this.ctx.fillStyle = "#1d2436";
      this.ctx.fillRect(rect.x, rect.y + bob, rect.width, rect.height - bob);

      this.ctx.fillStyle = "#30394f";
      this.ctx.fillRect(
        rect.x - shoulderPush,
        rect.y + rect.height * 0.18 + bob,
        rect.width + shoulderPush * 2,
        rect.height * 0.56,
      );

      this.ctx.fillStyle = frame === 0 ? "#ff4f9a" : "#9ee7ff";
      this.ctx.fillRect(
        rect.x + rect.width * 0.18,
        rect.y + rect.height * 0.34 + bob,
        rect.width * 0.64,
        5,
      );
    }

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.font = `${Math.max(8, rect.width * 0.24)}px 'Courier New', monospace`;
    this.ctx.textAlign = "center";
    this.ctx.fillText("UAEC", rect.x + rect.width / 2, rect.y + rect.height * 0.62 + bob);
  }
}

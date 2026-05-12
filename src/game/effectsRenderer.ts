import type { SpriteKey, SpriteManager } from "./assets";
import { PROJECTILE_SPRITE } from "./rendering";
import type { Explosion, Projectile } from "./types";

export class EffectsRenderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteManager;

  constructor(ctx: CanvasRenderingContext2D, sprites: SpriteManager) {
    this.ctx = ctx;
    this.sprites = sprites;
  }

  drawProjectiles(
    playerMissile: Projectile | null,
    enemyProjectiles: Projectile[],
  ): void {
    this.drawPlayerMissile(playerMissile);
    this.drawEnemyProjectiles(enemyProjectiles);
  }

  drawExplosions(explosions: Explosion[]): void {
    for (const explosion of explosions) {
      const progress = 1 - explosion.lifeMs / explosion.totalLifeMs;
      const spriteKey = this.getExplosionSpriteKey(progress);
      const sprite = this.sprites.get(spriteKey);

      if (sprite) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = Math.max(0, explosion.lifeMs / explosion.totalLifeMs);
        this.ctx.drawImage(sprite, explosion.x, explosion.y, explosion.width, explosion.height);
        this.ctx.restore();
        continue;
      }

      this.drawPlaceholderExplosion(explosion, progress);
    }
  }

  private drawPlayerMissile(playerMissile: Projectile | null): void {
    if (!playerMissile) return;

    const missileSprite = this.sprites.get("playerMissile");

    if (missileSprite) {
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(
        missileSprite,
        playerMissile.x + PROJECTILE_SPRITE.playerXOffset,
        playerMissile.y + PROJECTILE_SPRITE.playerYOffset,
        PROJECTILE_SPRITE.playerWidth,
        PROJECTILE_SPRITE.playerHeight,
      );
      this.ctx.restore();
      return;
    }

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillRect(
      playerMissile.x,
      playerMissile.y,
      playerMissile.width,
      playerMissile.height,
    );

    this.ctx.fillStyle = "#ff7a3d";
    this.ctx.fillRect(playerMissile.x - 2, playerMissile.y + 14, 10, 8);
  }

  private drawEnemyProjectiles(enemyProjectiles: Projectile[]): void {
    const enemyProjectileSprite = this.sprites.get("enemyProjectile");

    for (const projectile of enemyProjectiles) {
      if (enemyProjectileSprite) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(
          enemyProjectileSprite,
          projectile.x + PROJECTILE_SPRITE.enemyXOffset,
          projectile.y + PROJECTILE_SPRITE.enemyYOffset,
          PROJECTILE_SPRITE.enemyWidth,
          PROJECTILE_SPRITE.enemyHeight,
        );
        this.ctx.restore();
        continue;
      }

      this.ctx.fillStyle = "#ff355d";
      this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  }

  private getExplosionSpriteKey(progress: number): SpriteKey {
    if (progress < 0.34) return "explosion1";
    if (progress < 0.67) return "explosion2";

    return "explosion3";
  }

  private drawPlaceholderExplosion(explosion: Explosion, progress: number): void {
    const centerX = explosion.x + explosion.width / 2;
    const centerY = explosion.y + explosion.height / 2;
    const alpha = Math.max(0, explosion.lifeMs / explosion.totalLifeMs);
    const radius = 8 + progress * Math.max(explosion.width, explosion.height) * 0.42;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillRect(centerX - 6, centerY - 6, 12, 12);

    this.ctx.fillStyle = "#ff7a3d";
    this.ctx.fillRect(centerX - radius * 0.9, centerY - 4, 14, 8);
    this.ctx.fillRect(centerX + radius * 0.55, centerY - 4, 14, 8);
    this.ctx.fillRect(centerX - 4, centerY - radius * 0.75, 8, 14);
    this.ctx.fillRect(centerX - 4, centerY + radius * 0.55, 8, 14);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillRect(centerX - radius * 0.55, centerY - radius * 0.45, 12, 12);
    this.ctx.fillRect(centerX + radius * 0.35, centerY - radius * 0.38, 12, 12);
    this.ctx.fillRect(centerX - radius * 0.35, centerY + radius * 0.32, 12, 12);
    this.ctx.fillRect(centerX + radius * 0.18, centerY + radius * 0.38, 12, 12);

    this.ctx.restore();
  }
}

import type { FormationGeometry } from "./geometry";
import { getEnemyHurtbox, getEnemyRect } from "./geometry";
import type { BarricadeBlock, Enemy, Player, Projectile, Rect, Tank } from "./types";
import { rectsOverlap } from "./utils";

export type EnemyHit = {
  enemy: Enemy;
  rect: Rect;
};

export type EnemyProjectileHit =
  | { type: "barricade"; block: BarricadeBlock }
  | { type: "player" };

export function findBarricadeHit(
  projectile: Projectile,
  blocks: BarricadeBlock[],
): BarricadeBlock | null {
  return blocks.find((block) => block.active && rectsOverlap(projectile, block)) ?? null;
}

export function didHitTank(projectile: Projectile, tank: Tank): boolean {
  return tank.active && rectsOverlap(projectile, tank);
}

export function findEnemyHit(
  projectile: Projectile,
  enemies: Enemy[],
  formation: FormationGeometry,
): EnemyHit | null {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const rect = getEnemyRect(enemy, formation);
    const hurtbox = getEnemyHurtbox(enemy, rect);

    if (rectsOverlap(projectile, hurtbox)) {
      return { enemy, rect };
    }
  }

  return null;
}

export function findEnemyProjectileHit(
  projectile: Projectile,
  blocks: BarricadeBlock[],
  playerHitbox: Rect,
  player: Player,
): EnemyProjectileHit | null {
  const block = findBarricadeHit(projectile, blocks);

  if (block) {
    return { type: "barricade", block };
  }

  if (player.invulnerableMs <= 0 && rectsOverlap(projectile, playerHitbox)) {
    return { type: "player" };
  }

  return null;
}

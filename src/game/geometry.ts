import { BALANCE } from "./balance";
import { COLS, WIDTH } from "./constants";
import type { Enemy, EnemyType, Player, Rect } from "./types";

export type FormationGeometry = {
  xOffset: number;
  yAdvance: number;
};

const ENEMY_ROW_Y = [130, 200, 275, 365, 455];
const ENEMY_ROW_BASE_SCALE = [0.72, 0.84, 0.96, 1.1, 1.25];
const ENEMY_ADVANCE_SCALE = 0.0017;
const ENEMY_SPACING = 78;

const ENEMY_HURTBOX_PADDING: Record<
  EnemyType,
  { xRatio: number; yRatio: number }
> = {
  officer: { xRatio: 0.06, yRatio: 0.04 },
  shield: { xRatio: 0.08, yRatio: 0.04 },
  armored: { xRatio: 0.24, yRatio: 0.10 },
};

export function getPlayerHitbox(player: Player): Rect {
  return {
    x: player.x,
    y: player.y + BALANCE.player.hitboxYOffset,
    width: player.width,
    height: player.height,
  };
}

export function getEnemyHurtbox(enemy: Enemy, rect: Rect): Rect {
  const padding = ENEMY_HURTBOX_PADDING[enemy.type];
  const padX = rect.width * padding.xRatio;
  const padY = rect.height * padding.yRatio;

  return {
    x: rect.x - padX,
    y: rect.y - padY,
    width: rect.width + padX * 2,
    height: rect.height + padY * 2,
  };
}

export function getEnemyRect(
  enemy: Enemy,
  formation: FormationGeometry,
): Rect {
  const rowY = ENEMY_ROW_Y[enemy.row] ?? ENEMY_ROW_Y[0];
  const baseScale =
    ENEMY_ROW_BASE_SCALE[enemy.row] ?? ENEMY_ROW_BASE_SCALE[0];
  const advanceScale = formation.yAdvance * ENEMY_ADVANCE_SCALE;
  const scale = baseScale + advanceScale;

  const spacing = ENEMY_SPACING * scale;
  const centerX = WIDTH / 2 + formation.xOffset;
  const x = centerX + (enemy.col - (COLS - 1) / 2) * spacing;

  const baseWidth =
    enemy.type === "armored" ? 42 : enemy.type === "shield" ? 40 : 34;
  const baseHeight =
    enemy.type === "armored" ? 46 : enemy.type === "shield" ? 48 : 40;

  return {
    x: x - (baseWidth * scale) / 2,
    y: rowY + formation.yAdvance,
    width: baseWidth * scale,
    height: baseHeight * scale,
  };
}

export function getFormationBounds(
  enemies: Enemy[],
  formation: FormationGeometry,
): Rect | null {
  const alive = enemies.filter((enemy) => enemy.alive);
  if (alive.length === 0) return null;

  const rects = alive.map((enemy) => getEnemyRect(enemy, formation));
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

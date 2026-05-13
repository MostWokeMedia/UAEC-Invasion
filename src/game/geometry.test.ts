import { describe, expect, it } from "vitest";
import {
  getEnemyHurtbox,
  getEnemyRect,
  getFormationBounds,
  getPlayerHitbox,
} from "./geometry";
import type { Enemy, Player, Rect } from "./types";

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: "0-0",
    type: "officer",
    row: 0,
    col: 0,
    alive: true,
    score: 10,
    ...overrides,
  };
}

describe("getPlayerHitbox", () => {
  it("keeps the player body hitbox lower than the visual sprite", () => {
    const player: Player = {
      x: 100,
      y: 600,
      width: 48,
      height: 38,
      speed: 310,
      invulnerableMs: 0,
    };

    expect(getPlayerHitbox(player)).toEqual({
      x: 100,
      y: 622,
      width: 48,
      height: 38,
    });
  });
});

describe("getEnemyHurtbox", () => {
  it("pads armored enemy hurtboxes more than visual bounds", () => {
    const rect: Rect = { x: 100, y: 120, width: 50, height: 60 };

    expect(getEnemyHurtbox(enemy({ type: "armored" }), rect)).toEqual({
      x: 88,
      y: 114,
      width: 74,
      height: 72,
    });
  });
});

describe("getEnemyRect", () => {
  it("places enemies from row, column, type, and formation offset", () => {
    const rect = getEnemyRect(
      enemy({ type: "shield", row: 1, col: 3 }),
      { xOffset: 20, yAdvance: 10 },
    );

    expect(rect.x).toBeCloseTo(482.86);
    expect(rect.y).toBe(210);
    expect(rect.width).toBeCloseTo(34.28);
    expect(rect.height).toBeCloseTo(41.136);
  });
});

describe("getFormationBounds", () => {
  it("returns null when no enemies are alive", () => {
    expect(
      getFormationBounds([enemy({ alive: false })], {
        xOffset: 0,
        yAdvance: 0,
      }),
    ).toBeNull();
  });

  it("wraps all alive enemy rects", () => {
    const bounds = getFormationBounds(
      [
        enemy({ type: "armored", row: 0, col: 0 }),
        enemy({ type: "officer", row: 4, col: 6 }),
      ],
      { xOffset: 0, yAdvance: 0 },
    );

    expect(bounds?.x).toBeCloseTo(296.4);
    expect(bounds?.y).toBe(130);
    expect(bounds?.width).toBeCloseTo(497.35);
    expect(bounds?.height).toBe(375);
  });
});

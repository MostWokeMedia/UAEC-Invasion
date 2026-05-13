import { describe, expect, it } from "vitest";
import {
  didHitTank,
  findBarricadeHit,
  findEnemyHit,
  findEnemyProjectileHit,
} from "./collision";
import type { BarricadeBlock, Enemy, Player, Projectile, Tank } from "./types";

function projectile(overrides: Partial<Projectile> = {}): Projectile {
  return {
    owner: "player",
    x: 0,
    y: 0,
    width: 4,
    height: 16,
    speedY: -250,
    ...overrides,
  };
}

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: "0-0",
    type: "officer",
    row: 0,
    col: 3,
    alive: true,
    score: 10,
    ...overrides,
  };
}

describe("findBarricadeHit", () => {
  it("returns the first active block hit by a projectile", () => {
    const inactive: BarricadeBlock = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      hp: 2,
      active: false,
    };
    const active: BarricadeBlock = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      hp: 2,
      active: true,
    };

    expect(findBarricadeHit(projectile({ x: 12, y: 12 }), [inactive, active]))
      .toBe(active);
  });
});

describe("didHitTank", () => {
  it("requires the tank to be active and overlapping", () => {
    const tank: Tank = {
      active: true,
      x: 100,
      y: 100,
      width: 80,
      height: 32,
      direction: 1,
      speed: 72,
      spawnTimerMs: 0,
    };

    expect(didHitTank(projectile({ x: 120, y: 110 }), tank)).toBe(true);
    expect(didHitTank(projectile({ x: 120, y: 110 }), { ...tank, active: false }))
      .toBe(false);
  });
});

describe("findEnemyHit", () => {
  it("returns the alive enemy and visual rect when a hurtbox is hit", () => {
    const hit = findEnemyHit(
      projectile({ x: 478, y: 130 }),
      [enemy({ alive: false }), enemy()],
      { xOffset: 0, yAdvance: 0 },
    );

    expect(hit?.enemy.id).toBe("0-0");
    expect(hit?.rect.x).toBeCloseTo(467.76);
    expect(hit?.rect.y).toBe(130);
  });
});

describe("findEnemyProjectileHit", () => {
  it("prioritizes barricade hits before player hits", () => {
    const block: BarricadeBlock = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      hp: 2,
      active: true,
    };
    const player: Player = {
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      speed: 310,
      invulnerableMs: 0,
    };

    expect(
      findEnemyProjectileHit(
        projectile({ owner: "enemy", x: 12, y: 12 }),
        [block],
        player,
        player,
      ),
    ).toEqual({ type: "barricade", block });
  });

  it("ignores player hits while the player is invulnerable", () => {
    const player: Player = {
      x: 10,
      y: 10,
      width: 30,
      height: 30,
      speed: 310,
      invulnerableMs: 100,
    };

    expect(
      findEnemyProjectileHit(
        projectile({ owner: "enemy", x: 12, y: 12 }),
        [],
        player,
        player,
      ),
    ).toBeNull();
  });
});

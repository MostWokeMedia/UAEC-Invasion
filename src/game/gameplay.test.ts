import { describe, expect, it } from "vitest";
import {
  chooseEnemyShooter,
  createBarricades,
  createEnemies,
  getEnemyShotCooldown,
  getFormationStepDelay,
  getTankScore,
  getWaveStartingAdvance,
  updateEnemyProjectiles,
  updateExplosions,
  updateFloatingTexts,
  updatePlayerMissile,
} from "./gameplay";

describe("createEnemies", () => {
  it("creates the full enemy formation with stable ids", () => {
    const enemies = createEnemies();

    expect(enemies).toHaveLength(35);
    expect(enemies[0]).toMatchObject({
      id: "0-0",
      type: "armored",
      row: 0,
      col: 0,
      alive: true,
      score: 30,
    });
    expect(enemies[34]).toMatchObject({
      id: "4-6",
      type: "officer",
      row: 4,
      col: 6,
      alive: true,
      score: 10,
    });
  });

  it("assigns enemy rows to the intended types", () => {
    const enemies = createEnemies();

    expect(enemies.filter((enemy) => enemy.type === "armored")).toHaveLength(7);
    expect(enemies.filter((enemy) => enemy.type === "shield")).toHaveLength(14);
    expect(enemies.filter((enemy) => enemy.type === "officer")).toHaveLength(14);
  });
});

describe("createBarricades", () => {
  it("creates four barricades with bottom center gaps", () => {
    const blocks = createBarricades();

    expect(blocks).toHaveLength(64);
    expect(blocks).toContainEqual({
      x: 142,
      y: 592,
      width: 14,
      height: 14,
      hp: 2,
      active: true,
    });
    expect(blocks).not.toContainEqual(
      expect.objectContaining({
        x: 174,
        y: 624,
      }),
    );
    expect(blocks).not.toContainEqual(
      expect.objectContaining({
        x: 190,
        y: 624,
      }),
    );
  });
});

describe("getFormationStepDelay", () => {
  it("speeds up as fewer enemies remain", () => {
    expect(getFormationStepDelay(35, 1)).toBeGreaterThan(
      getFormationStepDelay(7, 1),
    );
  });

  it("never goes below the configured minimum", () => {
    expect(getFormationStepDelay(1, 99)).toBeGreaterThanOrEqual(80);
  });
});

describe("getWaveStartingAdvance", () => {
  it("keeps early waves at the initial starting height", () => {
    expect(getWaveStartingAdvance(1)).toBe(0);
    expect(getWaveStartingAdvance(2)).toBe(0);
  });
});

describe("getTankScore", () => {
  it("awards 300 points on the perfect shot cadence", () => {
    expect(getTankScore(23)).toBe(300);
    expect(getTankScore(38)).toBe(300);
  });

  it("uses fallback scores otherwise", () => {
    expect(getTankScore(1, () => 0)).toBe(50);
    expect(getTankScore(1, () => 1)).toBe(100);
    expect(getTankScore(1, () => 2)).toBe(150);
  });
});

describe("chooseEnemyShooter", () => {
  it("chooses the lowest alive enemy in the selected column", () => {
    const enemies = createEnemies();
    enemies.find((enemy) => enemy.id === "4-2")!.alive = false;

    expect(chooseEnemyShooter(enemies, () => 2)?.id).toBe("3-2");
  });

  it("returns null when no enemies are alive", () => {
    const enemies = createEnemies().map((enemy) => ({
      ...enemy,
      alive: false,
    }));

    expect(chooseEnemyShooter(enemies)).toBeNull();
  });
});

describe("getEnemyShotCooldown", () => {
  it("reduces cooldown as enemies are destroyed", () => {
    expect(getEnemyShotCooldown(35, 0)).toBeGreaterThan(
      getEnemyShotCooldown(10, 0),
    );
  });

  it("does not go below the minimum cooldown before random bonus", () => {
    expect(getEnemyShotCooldown(0, 0)).toBe(620);
  });

  it("adds the random cooldown bonus", () => {
    expect(getEnemyShotCooldown(35, 123)).toBe(1723);
  });
});

describe("updateExplosions", () => {
  it("reduces explosion life and removes expired entries", () => {
    expect(
      updateExplosions(
        [
          {
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            lifeMs: 100,
            totalLifeMs: 100,
          },
          {
            x: 20,
            y: 20,
            width: 10,
            height: 10,
            lifeMs: 20,
            totalLifeMs: 100,
          },
        ],
        50,
      ),
    ).toEqual([
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        lifeMs: 50,
        totalLifeMs: 100,
      },
    ]);
  });
});

describe("updateFloatingTexts", () => {
  it("moves text upward, reduces life, and removes expired entries", () => {
    expect(
      updateFloatingTexts(
        [
          { text: "+10", x: 100, y: 200, lifeMs: 800 },
          { text: "+20", x: 120, y: 220, lifeMs: 20 },
        ],
        500,
      ),
    ).toEqual([{ text: "+10", x: 100, y: 188, lifeMs: 300 }]);

    expect(
      updateFloatingTexts(
        [{ text: "+10", x: 100, y: 200, lifeMs: 800 }],
        250,
      ),
    ).toEqual([{ text: "+10", x: 100, y: 194, lifeMs: 550 }]);
  });
});

describe("updatePlayerMissile", () => {
  it("moves the player missile by speed and dt", () => {
    expect(
      updatePlayerMissile(
        {
          owner: "player",
          x: 50,
          y: 100,
          width: 6,
          height: 18,
          speedY: -300,
        },
        100,
      ),
    ).toEqual({
      owner: "player",
      x: 50,
      y: 70,
      width: 6,
      height: 18,
      speedY: -300,
    });
  });

  it("removes the missile once it leaves the top of the screen", () => {
    expect(
      updatePlayerMissile(
        {
          owner: "player",
          x: 50,
          y: -20,
          width: 6,
          height: 18,
          speedY: -300,
        },
        100,
      ),
    ).toBeNull();
  });
});

describe("updateEnemyProjectiles", () => {
  it("moves enemy projectiles and removes entries below the cleanup line", () => {
    expect(
      updateEnemyProjectiles(
        [
          {
            owner: "enemy",
            x: 10,
            y: 100,
            width: 8,
            height: 18,
            speedY: 200,
          },
          {
            owner: "enemy",
            x: 20,
            y: 760,
            width: 8,
            height: 18,
            speedY: 200,
          },
        ],
        100,
        760,
      ),
    ).toEqual([
      {
        owner: "enemy",
        x: 10,
        y: 120,
        width: 8,
        height: 18,
        speedY: 200,
      },
    ]);
  });
});

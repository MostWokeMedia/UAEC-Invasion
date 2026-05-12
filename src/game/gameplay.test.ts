import { describe, expect, it } from "vitest";
import {
  createBarricades,
  createEnemies,
  getFormationStepDelay,
  getTankScore,
  getWaveStartingAdvance,
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

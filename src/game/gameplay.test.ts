import { describe, expect, it } from "vitest";
import {
  getFormationStepDelay,
  getTankScore,
  getWaveStartingAdvance,
} from "./gameplay";

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

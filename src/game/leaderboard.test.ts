import { describe, expect, it } from "vitest";
import { isNightmareLeaderboardEntry, sanitizeInitials } from "./leaderboard";

describe("sanitizeInitials", () => {
  it("keeps only the first three uppercase letters or numbers", () => {
    expect(sanitizeInitials("neo")).toBe("NEO");
    expect(sanitizeInitials("r5i9")).toBe("R5I");
  });

  it("removes unsupported characters", () => {
    expect(sanitizeInitials(" a-*b_c ")).toBe("ABC");
  });
});


describe("isNightmareLeaderboardEntry", () => {
  it("detects nightmare entries from build metadata", () => {
    expect(
      isNightmareLeaderboardEntry({
        id: 1,
        initials: "NEO",
        score: 1000,
        wave: 3,
        buildLabel: "UAEC Invasion v0.2.0 [nightmare]",
        createdAt: "2026-05-20T00:00:00Z",
      }),
    ).toBe(true);
  });
});

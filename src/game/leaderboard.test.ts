import { describe, expect, it } from "vitest";
import { sanitizeInitials } from "./leaderboard";

describe("sanitizeInitials", () => {
  it("keeps only the first three uppercase letters or numbers", () => {
    expect(sanitizeInitials("neo")).toBe("NEO");
    expect(sanitizeInitials("r5i9")).toBe("R5I");
  });

  it("removes unsupported characters", () => {
    expect(sanitizeInitials(" a-*b_c ")).toBe("ABC");
  });
});

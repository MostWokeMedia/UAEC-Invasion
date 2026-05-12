import { beforeEach, describe, expect, it } from "vitest";
import {
  readBoolean,
  readNumber,
  readString,
  writeBoolean,
  writeNumber,
  writeString,
} from "./storage";

describe("storage helpers", () => {
  beforeEach(() => {
    const values = new Map<string, string>();

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
      },
    });
  });

  it("round-trips strings, numbers, and booleans when storage is available", () => {
    writeString("uaec-test-string", "value");
    writeNumber("uaec-test-number", 42);
    writeBoolean("uaec-test-boolean", true);

    expect(readString("uaec-test-string", "fallback")).toBe("value");
    expect(readNumber("uaec-test-number", 0)).toBe(42);
    expect(readBoolean("uaec-test-boolean", false)).toBe(true);
  });

  it("returns fallbacks for missing values", () => {
    expect(readString("uaec-test-missing-string", "fallback")).toBe("fallback");
    expect(readNumber("uaec-test-missing-number", 7)).toBe(7);
    expect(readBoolean("uaec-test-missing-boolean", true)).toBe(true);
  });

  it("falls back when storage throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });

    expect(readString("uaec-test-blocked-string", "fallback")).toBe("fallback");
    expect(readNumber("uaec-test-blocked-number", 7)).toBe(7);
    expect(readBoolean("uaec-test-blocked-boolean", true)).toBe(true);
    expect(() => writeString("uaec-test-blocked-string", "value")).not.toThrow();
  });
});

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readString(key: string, fallback: string): string {
  try {
    return getStorage()?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string): void {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // Storage can be blocked in private or restricted browser contexts.
  }
}

export function readNumber(key: string, fallback: number): number {
  const value = Number(readString(key, String(fallback)));

  return Number.isFinite(value) ? value : fallback;
}

export function writeNumber(key: string, value: number): void {
  writeString(key, String(value));
}

export function readBoolean(key: string, fallback: boolean): boolean {
  const value = readString(key, String(fallback));

  if (value === "true") return true;
  if (value === "false") return false;

  return fallback;
}

export function writeBoolean(key: string, value: boolean): void {
  writeString(key, String(value));
}

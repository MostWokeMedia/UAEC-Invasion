export class InputManager {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private handledKeys = new Set([
    "KeyA",
    "KeyD",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "Enter",
    "KeyM",
    "KeyN",
    "KeyT",
    "KeyP",
    "KeyH",
    "Backspace",
    "Escape",
  ]);

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.keys.clear();
    this.pressed.clear();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.handledKeys.has(event.code)) {
      event.preventDefault();
    }

    if (!this.keys.has(event.code) && !event.repeat) {
      this.pressed.add(event.code);
    }

    this.keys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (this.handledKeys.has(event.code)) {
      event.preventDefault();
    }

    this.keys.delete(event.code);
  };

  isLeftHeld(): boolean {
    return this.keys.has("KeyA") || this.keys.has("ArrowLeft");
  }

  isRightHeld(): boolean {
    return this.keys.has("KeyD") || this.keys.has("ArrowRight");
  }

  consume(code: string): boolean {
    if (!this.pressed.has(code)) return false;

    this.pressed.delete(code);
    return true;
  }

  consumeAny(...codes: string[]): boolean {
    for (const code of codes) {
      if (this.consume(code)) {
        return true;
      }
    }

    return false;
  }

  consumePressedCodes(): string[] {
    const codes = [...this.pressed];
    this.pressed.clear();
    return codes;
  }

  clearPressed(): void {
    this.pressed.clear();
  }
}

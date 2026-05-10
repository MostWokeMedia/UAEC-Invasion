export class InputManager {
  private keys = new Set<string>();
  private pressed = new Set<string>();

  constructor() {
    const handledKeys = new Set([
      "KeyA",
      "KeyD",
      "ArrowLeft",
      "ArrowRight",
      "Space",
      "Enter",
      "KeyM",
      "KeyP",
      "Escape",
    ]);

    window.addEventListener("keydown", (event) => {
      if (handledKeys.has(event.code)) {
        event.preventDefault();
      }

      if (!this.keys.has(event.code) && !event.repeat) {
        this.pressed.add(event.code);
      }

      this.keys.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      if (handledKeys.has(event.code)) {
        event.preventDefault();
      }

      this.keys.delete(event.code);
    });
  }

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

  clearPressed(): void {
    this.pressed.clear();
  }
}

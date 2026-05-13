export class InputManager {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private virtualHeld = new Set<string>();
  private scrollSteps = 0;
  private pointerX = 0;
  private pointerY = 0;
  private pointerDown = false;
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
    window.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this.keys.clear();
    this.pressed.clear();
    this.virtualHeld.clear();
    this.scrollSteps = 0;
    this.pointerDown = false;
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

  private handleWheel = (event: WheelEvent): void => {
    if (event.deltaY === 0) return;

    event.preventDefault();
    this.scrollSteps += event.deltaY > 0 ? 1 : -1;
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown = true;
    this.updatePointerPosition(event);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    this.updatePointerPosition(event);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    this.pointerDown = false;
    this.updatePointerPosition(event);
  };

  private updatePointerPosition(event: PointerEvent): void {
    const target = event.target;

    if (!(target instanceof HTMLCanvasElement)) {
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      return;
    }

    const rect = target.getBoundingClientRect();
    this.pointerX = ((event.clientX - rect.left) / rect.width) * target.width;
    this.pointerY = ((event.clientY - rect.top) / rect.height) * target.height;
  }

  isLeftHeld(): boolean {
    return (
      this.keys.has("KeyA") ||
      this.keys.has("ArrowLeft") ||
      this.virtualHeld.has("ArrowLeft")
    );
  }

  isRightHeld(): boolean {
    return (
      this.keys.has("KeyD") ||
      this.keys.has("ArrowRight") ||
      this.virtualHeld.has("ArrowRight")
    );
  }

  setVirtualHeld(code: string, isHeld: boolean): void {
    if (isHeld) {
      this.virtualHeld.add(code);
      return;
    }

    this.virtualHeld.delete(code);
  }

  pressVirtual(code: string): void {
    this.pressed.add(code);
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

  consumeScrollSteps(): number {
    const steps = this.scrollSteps;
    this.scrollSteps = 0;
    return steps;
  }

  getPointerState(): { x: number; y: number; isDown: boolean } {
    return {
      x: this.pointerX,
      y: this.pointerY,
      isDown: this.pointerDown,
    };
  }

  clearPressed(): void {
    this.pressed.clear();
  }
}

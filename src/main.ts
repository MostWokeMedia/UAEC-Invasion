import "./style.css";
import { HEIGHT, WIDTH } from "./game/constants";
import { Game } from "./game/Game";
import { AudioManager } from "./game/audio";
import { InputManager } from "./game/input";
import { BUILD_LABEL } from "./game/metadata";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Could not find #app element.");
}

app.innerHTML = `
  <div id="game-shell">
    <canvas id="game" width="${WIDTH}" height="${HEIGHT}"></canvas>
    <div class="touch-controls" aria-hidden="false">
      <button class="touch-button" type="button" data-hold-code="ArrowLeft" aria-label="Move left">◀</button>
      <button class="touch-button touch-button-primary" type="button" data-press-code="Space" aria-label="Fire">●</button>
      <button class="touch-button" type="button" data-hold-code="ArrowRight" aria-label="Move right">▶</button>
      <button class="touch-button touch-button-small" type="button" data-press-code="KeyP" aria-label="Pause">Ⅱ</button>
    </div>
    <p class="help">${BUILD_LABEL} — prototype build</p>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#game");

if (!canvas) {
  throw new Error("Could not find game canvas.");
}

const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Could not create canvas context.");
}

ctx.imageSmoothingEnabled = false;

const input = new InputManager();
const audio = new AudioManager();
const game = new Game(ctx, input, audio);
let animationFrameId = 0;

const touchButtons = document.querySelectorAll<HTMLButtonElement>(".touch-button");

for (const button of touchButtons) {
  const holdCode = button.dataset.holdCode;
  const pressCode = button.dataset.pressCode;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);

    if (holdCode) {
      input.setVirtualHeld(holdCode, true);
    }

    if (pressCode) {
      input.pressVirtual(pressCode);
    }
  });

  const release = (event: PointerEvent): void => {
    event.preventDefault();

    if (holdCode) {
      input.setVirtualHeld(holdCode, false);
    }
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", () => {
    if (holdCode) {
      input.setVirtualHeld(holdCode, false);
    }
  });
}

let lastTimestamp = performance.now();

function loop(timestamp: number): void {
  const dtMs = Math.min(50, timestamp - lastTimestamp);
  lastTimestamp = timestamp;

  game.update(dtMs);
  input.clearPressed();
  game.render();

  animationFrameId = requestAnimationFrame(loop);
}

animationFrameId = requestAnimationFrame(loop);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(animationFrameId);
    game.dispose();
    input.dispose();
    audio.dispose();
  });
}

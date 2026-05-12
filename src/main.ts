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

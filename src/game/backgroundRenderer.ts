import { HEIGHT, WIDTH } from "./constants";

const BACKGROUND_IMAGE_SRC = "/assets/backgrounds/citadel_street_hud_bg.png";

export class BackgroundRenderer {
  private ctx: CanvasRenderingContext2D;
  private backgroundImage = new Image();
  private backgroundLoaded = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.backgroundImage.src = BACKGROUND_IMAGE_SRC;
    this.backgroundImage.onload = () => {
      this.backgroundLoaded = true;
    };
  }

  draw(): void {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    if (this.backgroundLoaded) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, WIDTH, HEIGHT);

      // Small tint so sprites and background feel unified without hiding the art.
      this.ctx.fillStyle = "rgba(2, 4, 10, 0.18)";
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
      this.ctx.fillStyle = "#050713";
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    this.ctx.restore();
  }
}

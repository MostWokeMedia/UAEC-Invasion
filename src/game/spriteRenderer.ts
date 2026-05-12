export class SpriteRenderer {
  private cache = new Map<string, HTMLCanvasElement>();
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawImage(
    cacheKeyBase: string,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const drawWidth = Math.max(1, Math.round(width));
    const drawHeight = Math.max(1, Math.round(height));
    const cacheKey = `${cacheKeyBase}:${drawWidth}x${drawHeight}`;

    let cachedCanvas = this.cache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement("canvas");
      cachedCanvas.width = drawWidth;
      cachedCanvas.height = drawHeight;

      const cachedCtx = cachedCanvas.getContext("2d");

      if (!cachedCtx) return;

      cachedCtx.imageSmoothingEnabled = false;
      cachedCtx.drawImage(image, 0, 0, drawWidth, drawHeight);

      this.cache.set(cacheKey, cachedCanvas);
    }

    this.ctx.drawImage(
      cachedCanvas,
      Math.round(x),
      Math.round(y),
      drawWidth,
      drawHeight,
    );
  }

  drawImageWithGlow(
    cacheKeyBase: string,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    glowColor: string,
    glowBlur: number,
    glowAlpha: number,
  ): void {
    const drawWidth = Math.max(1, Math.round(width));
    const drawHeight = Math.max(1, Math.round(height));
    const padding = Math.ceil(glowBlur * 2);
    const cacheKey = `${cacheKeyBase}:glow:${drawWidth}x${drawHeight}:${glowColor}:${glowBlur}:${glowAlpha}`;

    let cachedCanvas = this.cache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement("canvas");
      cachedCanvas.width = drawWidth + padding * 2;
      cachedCanvas.height = drawHeight + padding * 2;

      const cachedCtx = cachedCanvas.getContext("2d");

      if (!cachedCtx) return;

      cachedCtx.imageSmoothingEnabled = false;

      cachedCtx.save();
      cachedCtx.globalAlpha = glowAlpha;
      cachedCtx.shadowColor = glowColor;
      cachedCtx.shadowBlur = glowBlur;
      cachedCtx.drawImage(image, padding, padding, drawWidth, drawHeight);
      cachedCtx.restore();

      cachedCtx.drawImage(image, padding, padding, drawWidth, drawHeight);

      this.cache.set(cacheKey, cachedCanvas);
    }

    this.ctx.drawImage(
      cachedCanvas,
      Math.round(x) - padding,
      Math.round(y) - padding,
    );
  }
}

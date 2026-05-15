import type { SpriteManager } from "./assets";
import { HEIGHT, WIDTH } from "./constants";
import { BARRICADE_ART } from "./rendering";
import type { SpriteRenderer } from "./spriteRenderer";
import type { BarricadeBlock } from "./types";

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GridPosition = {
  row: number;
  col: number;
};

type CellMetrics = {
  sourceWidth: number;
  sourceHeight: number;
  destinationWidth: number;
  destinationHeight: number;
};

export class BarricadeRenderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteManager;
  private spriteRenderer: SpriteRenderer;
  private cacheCanvas: HTMLCanvasElement;
  private cacheCtx: CanvasRenderingContext2D | null;
  private cacheSignature = "";

  constructor(
    ctx: CanvasRenderingContext2D,
    sprites: SpriteManager,
    spriteRenderer: SpriteRenderer,
  ) {
    this.ctx = ctx;
    this.sprites = sprites;
    this.spriteRenderer = spriteRenderer;
    this.cacheCanvas = document.createElement("canvas");
    this.cacheCanvas.width = WIDTH;
    this.cacheCanvas.height = HEIGHT;
    this.cacheCtx = this.cacheCanvas.getContext("2d");
  }

  draw(blocks: BarricadeBlock[]): void {
    const barricadeCells = this.sprites.get("barricadeCells");
    const signature = this.getCacheSignature(blocks, Boolean(barricadeCells));

    if (!this.cacheCtx) {
      this.drawUncached(blocks, barricadeCells);
      return;
    }

    if (signature !== this.cacheSignature) {
      const mainCtx = this.ctx;

      this.cacheCtx.clearRect(0, 0, WIDTH, HEIGHT);
      try {
        this.ctx = this.cacheCtx;
        this.drawUncached(blocks, barricadeCells);
      } finally {
        this.ctx = mainCtx;
      }
      this.cacheSignature = signature;
    }

    this.ctx.drawImage(this.cacheCanvas, 0, 0);
  }

  private drawUncached(
    blocks: BarricadeBlock[],
    barricadeCells: HTMLImageElement | null,
  ): void {
    if (barricadeCells) {
      this.drawSpriteBarricades(blocks, barricadeCells);
      return;
    }

    this.drawTileBarricades(blocks);
  }

  private getCacheSignature(
    blocks: BarricadeBlock[],
    hasBarricadeCells: boolean,
  ): string {
    return `${hasBarricadeCells ? "sprite" : "tile"}:${blocks
      .map((block) => (block.active ? block.hp : 0))
      .join("")}`;
  }

  private drawSpriteBarricades(
    blocks: BarricadeBlock[],
    barricadeCells: HTMLImageElement,
  ): void {
    const sourceWidth =
      barricadeCells.naturalWidth /
      (BARRICADE_ART.variants * BARRICADE_ART.columns);
    const sourceHeight = barricadeCells.naturalHeight / BARRICADE_ART.rows;

    for (
      let blockIndex = 0, barricadeIndex = 0;
      blockIndex < blocks.length;
      blockIndex += BARRICADE_ART.blocksPerBarricade, barricadeIndex++
    ) {
      const group = blocks.slice(
        blockIndex,
        blockIndex + BARRICADE_ART.blocksPerBarricade,
      );

      if (group.length === 0 || group.every((block) => !block.active)) {
        continue;
      }

      const bounds = this.getBounds(group);
      const visualBounds = this.getVisualBounds(bounds);
      const metrics = {
        sourceWidth,
        sourceHeight,
        destinationWidth: visualBounds.width / BARRICADE_ART.columns,
        destinationHeight: visualBounds.height / BARRICADE_ART.rows,
      };
      const variant = barricadeIndex % BARRICADE_ART.variants;

      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;

      this.drawGroundShadow(visualBounds);

      for (const block of group) {
        const { row, col } = this.getGridPosition(block, bounds);
        const destinationX = visualBounds.x + col * metrics.destinationWidth;
        const destinationY = visualBounds.y + row * metrics.destinationHeight;

        if (!block.active) {
          this.drawMissingCellShadow(
            destinationX,
            destinationY,
            metrics.destinationWidth,
            metrics.destinationHeight,
          );
          continue;
        }

        this.drawCellSprite(
          barricadeCells,
          variant,
          row,
          col,
          destinationX,
          destinationY,
          metrics,
        );

        this.drawWeathering(
          block,
          destinationX,
          destinationY,
          metrics.destinationWidth,
          metrics.destinationHeight,
        );

        if (block.hp === 1) {
          this.drawDamagedCell(
            block,
            destinationX,
            destinationY,
            metrics.destinationWidth,
            metrics.destinationHeight,
          );
        }
      }

      this.ctx.restore();
    }
  }

  private drawTileBarricades(blocks: BarricadeBlock[]): void {
    const fullBlockSprite = this.sprites.get("barricadeFull");
    const damagedBlockSprite = this.sprites.get("barricadeDamaged");

    for (const block of blocks) {
      if (!block.active) continue;

      const sprite = block.hp === 2 ? fullBlockSprite : damagedBlockSprite;

      if (sprite) {
        this.spriteRenderer.drawImage(
          block.hp === 2 ? "barricadeFull" : "barricadeDamaged",
          sprite,
          block.x,
          block.y,
          block.width,
          block.height,
        );
        continue;
      }

      this.ctx.fillStyle = block.hp === 2 ? "#6b7280" : "#3f4654";
      this.ctx.fillRect(block.x, block.y, block.width, block.height);

      if (block.hp === 1) {
        this.ctx.fillStyle = `rgba(255, 79, 154, ${BARRICADE_ART.damagedGlowAlpha})`;
        this.ctx.fillRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
      }
    }
  }

  private drawGroundShadow(bounds: Bounds): void {
    this.ctx.globalAlpha = 0.38;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height * 0.94,
      bounds.width * 0.42,
      Math.max(5, bounds.height * 0.12),
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawCellSprite(
    barricadeCells: HTMLImageElement,
    variant: number,
    row: number,
    col: number,
    destinationX: number,
    destinationY: number,
    metrics: CellMetrics,
  ): void {
    const clampedRow = Math.max(0, Math.min(BARRICADE_ART.rows - 1, row));
    const clampedCol = Math.max(0, Math.min(BARRICADE_ART.columns - 1, col));
    const sourceX =
      (variant * BARRICADE_ART.columns + clampedCol) * metrics.sourceWidth;
    const sourceY = clampedRow * metrics.sourceHeight;
    const overlap = BARRICADE_ART.cellOverlap;

    this.ctx.drawImage(
      barricadeCells,
      sourceX,
      sourceY,
      metrics.sourceWidth,
      metrics.sourceHeight,
      destinationX - overlap,
      destinationY - overlap,
      metrics.destinationWidth + overlap * 2,
      metrics.destinationHeight + overlap * 2,
    );
  }

  private drawMissingCellShadow(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "multiply";
    this.ctx.fillStyle = `rgba(2, 4, 10, ${BARRICADE_ART.missingCellShadowAlpha})`;
    this.ctx.beginPath();
    this.ctx.ellipse(
      x + width / 2,
      y + height * 0.62,
      width * 0.32,
      height * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    this.ctx.fill();
    this.ctx.restore();
  }

  private getBounds(blocks: BarricadeBlock[]): Bounds {
    const minX = Math.min(...blocks.map((block) => block.x));
    const minY = Math.min(...blocks.map((block) => block.y));
    const maxX = Math.max(...blocks.map((block) => block.x + block.width));
    const maxY = Math.max(...blocks.map((block) => block.y + block.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private getVisualBounds(bounds: Bounds): Bounds {
    return {
      x: bounds.x - BARRICADE_ART.visualXPadding,
      y: bounds.y - BARRICADE_ART.visualTopPadding,
      width: bounds.width + BARRICADE_ART.visualXPadding * 2,
      height:
        bounds.height +
        BARRICADE_ART.visualTopPadding +
        BARRICADE_ART.visualBottomPadding,
    };
  }

  private getGridPosition(block: BarricadeBlock, bounds: Bounds): GridPosition {
    const columnStride =
      (bounds.width - block.width) / Math.max(1, BARRICADE_ART.columns - 1);
    const rowStride =
      (bounds.height - block.height) / Math.max(1, BARRICADE_ART.rows - 1);

    return {
      col: Math.round((block.x - bounds.x) / columnStride),
      row: Math.round((block.y - bounds.y) / rowStride),
    };
  }

  private drawDamagedCell(
    block: BarricadeBlock,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "multiply";
    this.ctx.fillStyle = "rgba(7, 10, 18, 0.54)";
    this.drawChipShape(
      this.ctx,
      {
        x: x + width * 0.2,
        y: y + height * 0.22,
        width: width * 0.64,
        height: height * 0.58,
      },
      this.getChipSeed(block),
    );
    this.ctx.fill();

    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.strokeStyle = "rgba(255, 230, 170, 0.34)";
    this.ctx.lineWidth = 1;
    this.drawCracks(this.ctx, block, x + width / 2, y + height / 2);
    this.ctx.restore();
  }

  private drawWeathering(
    block: BarricadeBlock,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const seed = this.getChipSeed(block);
    const damageRatio = block.hp === 1 ? 1 : 0.48;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "multiply";

    const grime = this.ctx.createLinearGradient(x, y, x, y + height);
    grime.addColorStop(0, "rgba(7, 10, 18, 0)");
    grime.addColorStop(
      0.62,
      `rgba(7, 10, 18, ${BARRICADE_ART.grimeAlpha * damageRatio})`,
    );
    grime.addColorStop(
      1,
      `rgba(0, 0, 0, ${BARRICADE_ART.grimeAlpha * 1.55 * damageRatio})`,
    );
    this.ctx.fillStyle = grime;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.fillStyle = `rgba(1, 3, 9, ${BARRICADE_ART.chipAlpha * damageRatio})`;
    this.drawChipShape(
      this.ctx,
      {
        x: x + width * (0.08 + this.seededUnit(seed, 1) * 0.2),
        y: y + height * (0.08 + this.seededUnit(seed, 2) * 0.38),
        width: width * (0.18 + this.seededUnit(seed, 3) * 0.2),
        height: height * (0.14 + this.seededUnit(seed, 4) * 0.2),
      },
      seed + 11,
    );
    this.ctx.fill();

    if (this.seededUnit(seed, 5) > 0.42) {
      this.drawChipShape(
        this.ctx,
        {
          x: x + width * (0.54 + this.seededUnit(seed, 6) * 0.18),
          y: y + height * (0.16 + this.seededUnit(seed, 7) * 0.46),
          width: width * (0.16 + this.seededUnit(seed, 8) * 0.22),
          height: height * (0.12 + this.seededUnit(seed, 9) * 0.2),
        },
        seed + 23,
      );
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.strokeStyle = `rgba(238, 224, 193, ${BARRICADE_ART.crackAlpha * damageRatio})`;
    this.ctx.lineWidth = block.hp === 1 ? 1.35 : 0.9;
    this.drawHairlineCrack(this.ctx, seed, x, y, width, height);

    this.ctx.restore();
  }

  private getChipSeed(block: BarricadeBlock): number {
    return Math.abs(Math.round(block.x * 31 + block.y * 17));
  }

  private seededUnit(seed: number, step: number): number {
    return (Math.sin(seed + step * 12.9898) + 1) / 2;
  }

  private drawChipShape(
    ctx: CanvasRenderingContext2D,
    bounds: Bounds,
    seed: number,
  ): void {
    const jitter = (step: number, amount: number) =>
      ((Math.sin(seed + step * 12.9898) + 1) / 2 - 0.5) * amount;

    ctx.beginPath();
    ctx.moveTo(bounds.x + jitter(1, 5), bounds.y + bounds.height * 0.18);
    ctx.lineTo(bounds.x + bounds.width * 0.33, bounds.y + jitter(2, 5));
    ctx.lineTo(
      bounds.x + bounds.width * 0.78 + jitter(3, 5),
      bounds.y + bounds.height * 0.14,
    );
    ctx.lineTo(
      bounds.x + bounds.width + jitter(4, 5),
      bounds.y + bounds.height * 0.52,
    );
    ctx.lineTo(
      bounds.x + bounds.width * 0.72,
      bounds.y + bounds.height + jitter(5, 5),
    );
    ctx.lineTo(
      bounds.x + bounds.width * 0.22 + jitter(6, 5),
      bounds.y + bounds.height * 0.88,
    );
    ctx.closePath();
  }

  private drawCracks(
    ctx: CanvasRenderingContext2D,
    block: BarricadeBlock,
    centerX: number,
    centerY: number,
  ): void {
    const seed = this.getChipSeed(block);
    const angle = Math.sin(seed) * 0.8;

    ctx.beginPath();
    ctx.moveTo(centerX - 5, centerY - 4);
    ctx.lineTo(centerX + Math.cos(angle) * 8, centerY + 2);
    ctx.lineTo(centerX + 3, centerY + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + 2, centerY);
    ctx.lineTo(centerX - 7, centerY + 5);
    ctx.stroke();
  }

  private drawHairlineCrack(
    ctx: CanvasRenderingContext2D,
    seed: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const startX = x + width * (0.2 + this.seededUnit(seed, 10) * 0.48);
    const startY = y + height * (0.12 + this.seededUnit(seed, 11) * 0.24);
    const bendX = startX + width * (this.seededUnit(seed, 12) - 0.5) * 0.34;
    const bendY = startY + height * (0.18 + this.seededUnit(seed, 13) * 0.24);
    const endX = bendX + width * (this.seededUnit(seed, 14) - 0.5) * 0.28;
    const endY = bendY + height * (0.18 + this.seededUnit(seed, 15) * 0.28);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(bendX, bendY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (this.seededUnit(seed, 16) > 0.58) {
      ctx.beginPath();
      ctx.moveTo(bendX, bendY);
      ctx.lineTo(
        bendX + width * (this.seededUnit(seed, 17) - 0.5) * 0.34,
        bendY + height * 0.16,
      );
      ctx.stroke();
    }
  }
}

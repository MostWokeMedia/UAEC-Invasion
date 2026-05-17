import type { LeaderboardEntry } from "./leaderboard";
import { CANVAS_WIDTH, HEIGHT } from "./constants";
import { BUILD_LABEL } from "./metadata";

export type StartScreenState = {
  highScore: number;
  isMusicMuted: boolean;
  isSfxMuted: boolean;
};

export type GameOverScreenState = {
  score: number;
  highScore: number;
  wave: number;
  earnedNewHighScore: boolean;
  leaderboardInitials: string;
  leaderboardEntries: LeaderboardEntry[];
  highlightedLeaderboardEntryId: number | null;
  leaderboardScrollOffset: number;
  leaderboardStatus:
    | "disabled"
    | "entering"
    | "submitting"
    | "submitted"
    | "failed";
};

export class ScreenRenderer {
  private static readonly LEADERBOARD_VISIBLE_ROWS = 6;
  private static readonly LEADERBOARD_SCROLLBAR = {
    xOffset: 624,
    yOffset: 70,
    width: 6,
    height: 176,
  };

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawStartScreen(
    state: StartScreenState,
    drawBackground: () => void,
  ): void {
    const time = performance.now() / 1000;
    const titleFlicker = Math.sin(time * 18) > 0.94 ? 0.72 : 1;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;

    this.ctx.save();

    drawBackground();

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    const panelX = CANVAS_WIDTH / 2 - 320;
    const panelY = 104;
    const panelW = 640;
    const panelH = 530;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.76)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.72)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.30)";
    this.ctx.strokeRect(panelX + 8, panelY + 8, panelW - 16, panelH - 16);

    this.ctx.textAlign = "center";

    this.ctx.save();
    this.ctx.globalAlpha = titleFlicker;
    this.ctx.font = "76px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("UAEC", CANVAS_WIDTH / 2, panelY + 92);

    this.ctx.font = "68px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("INVASION", CANVAS_WIDTH / 2, panelY + 156);

    this.ctx.strokeStyle = "#9ee7ff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeText("INVASION", CANVAS_WIDTH / 2, panelY + 156);
    this.ctx.restore();

    this.ctx.font = "21px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS UNDER LOCKDOWN.", CANVAS_WIDTH / 2, panelY + 218);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE UAEC ARE ADVANCING.", CANVAS_WIDTH / 2, panelY + 252);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("HOLD THE LINE.", CANVAS_WIDTH / 2, panelY + 286);

    this.ctx.save();
    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "28px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText("PRESS ENTER OR SPACE", CANVAS_WIDTH / 2, panelY + 348);
    this.ctx.restore();

    this.drawStartControls(panelY, state);
    this.drawStartFooter(state.highScore);

    this.ctx.restore();
  }

  drawPlayerHitScreen(lives: number): void {
    const time = performance.now() / 1000;
    const pulse = 0.62 + Math.sin(time * 8) * 0.28;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    this.ctx.textAlign = "center";

    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeStyle = "#ff355d";
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(70, 70, CANVAS_WIDTH - 140, HEIGHT - 140);
    this.ctx.restore();

    if (lives > 0) {
      this.ctx.font = "54px 'Courier New', monospace";
      this.ctx.fillStyle = "#ff4f9a";
      this.ctx.fillText("SIGNAL DISRUPTED", CANVAS_WIDTH / 2, HEIGHT / 2 - 70);

      this.ctx.font = "24px 'Courier New', monospace";
      this.ctx.fillStyle = "#f5f7ff";
      this.ctx.fillText(
        `LIVES REMAINING: ${String(lives).padStart(2, "0")}`,
        CANVAS_WIDTH / 2,
        HEIGHT / 2 - 18,
      );

      this.ctx.fillStyle = "#9ee7ff";
      this.ctx.fillText("REDEPLOYING...", CANVAS_WIDTH / 2, HEIGHT / 2 + 34);
      return;
    }

    this.ctx.font = "54px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff355d";
    this.ctx.fillText("SIGNAL COLLAPSING", CANVAS_WIDTH / 2, HEIGHT / 2 - 70);

    this.ctx.font = "24px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("NO LIVES REMAINING", CANVAS_WIDTH / 2, HEIGHT / 2 - 18);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("TRANSMISSION ENDING...", CANVAS_WIDTH / 2, HEIGHT / 2 + 34);
  }

  drawPauseScreen(): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    this.ctx.textAlign = "center";
    this.ctx.font = "60px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("PAUSED", CANVAS_WIDTH / 2, HEIGHT / 2 - 52);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("THE CITADEL IS WATCHING...", CANVAS_WIDTH / 2, HEIGHT / 2 + 4);

    this.ctx.font = "20px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("PRESS P OR ESC TO RESUME", CANVAS_WIDTH / 2, HEIGHT / 2 + 54);
  }

  drawWaveClearScreen(): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.70)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    this.ctx.textAlign = "center";
    this.ctx.font = "58px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("WAVE CLEARED", CANVAS_WIDTH / 2, HEIGHT / 2 - 44);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("UAEC FORMATION BROKEN.", CANVAS_WIDTH / 2, HEIGHT / 2 + 10);

    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("NEXT WAVE INCOMING..", CANVAS_WIDTH / 2, HEIGHT / 2 + 46);
  }

  drawGameOverScreen(state: GameOverScreenState): void {
    const time = performance.now() / 1000;
    const promptPulse = 0.62 + Math.sin(time * 4.2) * 0.28;
    const newHighFlash = 0.75 + Math.sin(time * 6.5) * 0.25;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, HEIGHT);

    this.ctx.textAlign = "center";
    this.ctx.font = "62px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("SIGNAL LOST", CANVAS_WIDTH / 2, 88);

    if (state.earnedNewHighScore) {
      this.ctx.save();
      this.ctx.globalAlpha = newHighFlash;
      this.ctx.font = "26px 'Courier New', monospace";
      this.ctx.fillStyle = "#fff7d6";
      this.ctx.fillText("NEW HIGH SCORE", CANVAS_WIDTH / 2, 128);
      this.ctx.restore();
    }

    this.drawGameOverStats(state);
    this.drawLeaderboardPanel(state);

    this.ctx.textAlign = "center";
    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("THE CITADEL HAS WITNESSED", CANVAS_WIDTH / 2, 628);

    this.ctx.save();
    this.ctx.globalAlpha = promptPulse;
    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";
    this.ctx.fillText(this.getGameOverPrompt(state), CANVAS_WIDTH / 2, 672);
    this.ctx.restore();
  }

  private drawStartControls(panelY: number, state: StartScreenState): void {
    const controlsX = CANVAS_WIDTH / 2 - 195;
    const controlsY = panelY + 386;

    this.ctx.textAlign = "left";
    this.ctx.font = "17px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("A/D or ←/→", controlsX, controlsY);
    this.ctx.fillText("SPACE", controlsX, controlsY + 28);
    this.ctx.fillText("P/ESC", controlsX, controlsY + 56);
    this.ctx.fillText("M", controlsX, controlsY + 84);
    this.ctx.fillText("N", controlsX, controlsY + 112);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText("MOVE", controlsX + 260, controlsY);
    this.ctx.fillText("FIRE", controlsX + 260, controlsY + 28);
    this.ctx.fillText("PAUSE", controlsX + 260, controlsY + 56);
    this.ctx.fillText(state.isMusicMuted ? "MUSIC ON" : "MUSIC OFF", controlsX + 260, controlsY + 84);
    this.ctx.fillText(state.isSfxMuted ? "SFX ON" : "SFX OFF", controlsX + 260, controlsY + 112);
  }

  private drawStartFooter(highScore: number): void {
    this.ctx.textAlign = "center";
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(
      `HIGH SCORE: ${String(highScore).padStart(6, "0")}`,
      CANVAS_WIDTH / 2,
      660,
    );

    this.ctx.font = "17px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText("THE CITADEL IS WATCHING...", CANVAS_WIDTH / 2, 690);

    this.ctx.font = "13px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText(BUILD_LABEL, CANVAS_WIDTH / 2, 716);
  }

  private drawGameOverStats(state: GameOverScreenState): void {
    const panelX = CANVAS_WIDTH / 2 - 210;
    const panelY = 150;
    const panelW = 420;
    const panelH = 112;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.78)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(255, 79, 154, 0.72)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText(`FINAL SCORE: ${String(state.score).padStart(6, "0")}`, CANVAS_WIDTH / 2, panelY + 34);

    this.ctx.fillStyle = "#f5f7ff";
    this.ctx.fillText(`HIGH SCORE: ${String(state.highScore).padStart(6, "0")}`, CANVAS_WIDTH / 2, panelY + 66);

    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(`WAVE REACHED: ${String(state.wave).padStart(2, "0")}`, CANVAS_WIDTH / 2, panelY + 98);
  }

  private drawLeaderboardPanel(state: GameOverScreenState): void {
    const panelX = CANVAS_WIDTH / 2 - 330;
    const panelY = 286;
    const panelW = 660;
    const panelH = 286;

    this.ctx.fillStyle = "rgba(3, 4, 10, 0.78)";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);

    this.ctx.strokeStyle = "rgba(158, 231, 255, 0.45)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.textAlign = "center";
    this.ctx.font = "22px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("CITADEL LEADERBOARD", CANVAS_WIDTH / 2, panelY + 34);

    this.drawInitialsEntry(state, panelX, panelY);
    this.drawLeaderboardRows(state, panelX, panelY);
  }

  private drawInitialsEntry(
    state: GameOverScreenState,
    panelX: number,
    panelY: number,
  ): void {
    const entryCenterX = panelX + 188;

    this.ctx.textAlign = "center";
    this.ctx.font = "18px 'Courier New', monospace";
    this.ctx.fillStyle = "#f5f7ff";

    const label =
      state.leaderboardStatus === "disabled"
        ? "ONLINE SCOREBOARD OFFLINE"
        : "ENTER INITIALS";

    this.ctx.fillText(label, entryCenterX, panelY + 78);

    this.ctx.font = "34px 'Courier New', monospace";
    this.ctx.fillStyle = "#fff7d6";

    const initials = state.leaderboardInitials.padEnd(3, "_");
    this.ctx.fillText(initials, entryCenterX, panelY + 122);

    this.ctx.font = "16px 'Courier New', monospace";
    this.ctx.fillStyle = "#ff4f9a";
    this.ctx.fillText(
      this.getLeaderboardStatusText(state),
      entryCenterX,
      panelY + 156,
    );
  }

  private drawLeaderboardRows(
    state: GameOverScreenState,
    panelX: number,
    panelY: number,
  ): void {
    const startX = panelX + 356;
    const startY = panelY + 72;

    this.ctx.textAlign = "left";
    this.ctx.font = "15px 'Courier New', monospace";
    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillText("#", startX, startY);
    this.ctx.fillText("TAG", startX + 54, startY);
    this.ctx.fillText("SCORE", startX + 154, startY);

    this.ctx.fillStyle = "#f5f7ff";

    const visibleRows = ScreenRenderer.LEADERBOARD_VISIBLE_ROWS;
    const scrollOffset = Math.max(0, state.leaderboardScrollOffset);
    const rows = state.leaderboardEntries.slice(
      scrollOffset,
      scrollOffset + visibleRows,
    );

    if (rows.length === 0) {
      this.ctx.fillText("NO SIGNAL YET", startX, startY + 34);
      return;
    }

    rows.forEach((entry, index) => {
      const y = startY + 34 + index * 28;
      const isHighlighted = entry.id === state.highlightedLeaderboardEntryId;

      if (isHighlighted) {
        this.drawHighlightedLeaderboardRow(startX, y);
        this.ctx.fillStyle = "#fff0a8";
        this.ctx.shadowColor = "#ffd35a";
        this.ctx.shadowBlur = 12;
      } else {
        this.ctx.fillStyle = "#f5f7ff";
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillText(String(scrollOffset + index + 1).padStart(3, "0"), startX, y);
      this.ctx.fillText(entry.initials, startX + 54, y);
      this.ctx.fillText(String(entry.score).padStart(6, "0"), startX + 154, y);

      if (isHighlighted) {
        this.ctx.shadowBlur = 0;
      }
    });

    if (state.leaderboardEntries.length > visibleRows) {
      this.drawLeaderboardScrollbar(
        panelX,
        panelY,
        state.leaderboardEntries.length,
        visibleRows,
        scrollOffset,
      );
    }
  }

  private drawHighlightedLeaderboardRow(startX: number, textY: number): void {
    this.ctx.save();
    this.ctx.shadowColor = "#ffd35a";
    this.ctx.shadowBlur = 18;
    this.ctx.fillStyle = "rgba(255, 211, 90, 0.16)";
    this.ctx.fillRect(startX - 12, textY - 19, 250, 24);

    this.ctx.strokeStyle = "rgba(255, 211, 90, 0.65)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(startX - 12, textY - 19, 250, 24);
    this.ctx.restore();
  }

  private drawLeaderboardScrollbar(
    panelX: number,
    panelY: number,
    totalRows: number,
    visibleRows: number,
    scrollOffset: number,
  ): void {
    const trackX = panelX + ScreenRenderer.LEADERBOARD_SCROLLBAR.xOffset;
    const trackY = panelY + ScreenRenderer.LEADERBOARD_SCROLLBAR.yOffset;
    const trackHeight = ScreenRenderer.LEADERBOARD_SCROLLBAR.height;
    const thumbHeight = Math.max(24, trackHeight * (visibleRows / totalRows));
    const maxOffset = Math.max(1, totalRows - visibleRows);
    const thumbY =
      trackY + (trackHeight - thumbHeight) * (scrollOffset / maxOffset);

    this.ctx.fillStyle = "rgba(158, 231, 255, 0.18)";
    this.ctx.fillRect(
      trackX,
      trackY,
      ScreenRenderer.LEADERBOARD_SCROLLBAR.width,
      trackHeight,
    );

    this.ctx.fillStyle = "#9ee7ff";
    this.ctx.fillRect(trackX - 1, thumbY, 8, thumbHeight);
  }

  private getLeaderboardStatusText(state: GameOverScreenState): string {
    if (state.leaderboardStatus === "disabled") return "SET SUPABASE ENV TO ENABLE";
    if (state.leaderboardStatus === "submitting") return "TRANSMITTING...";
    if (state.leaderboardStatus === "submitted") return "SCORE TRANSMITTED";
    if (state.leaderboardStatus === "failed") return "TRANSMISSION FAILED";
    if (state.leaderboardInitials.length < 3) return "TYPE 3 LETTERS OR NUMBERS";
    return "PRESS ENTER TO TRANSMIT";
  }

  private getGameOverPrompt(state: GameOverScreenState): string {
    if (state.leaderboardStatus === "entering") return "SUBMIT INITIALS TO REDEPLOY";
    if (state.leaderboardStatus === "submitting") return "TRANSMISSION IN PROGRESS";
    return "PRESS ENTER OR SPACE TO REDEPLOY";
  }

}

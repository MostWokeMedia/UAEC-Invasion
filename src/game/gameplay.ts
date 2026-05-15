import { BALANCE } from "./balance";
import { COLS, ROWS, TOTAL_ENEMIES } from "./constants";
import type {
  BarricadeBlock,
  Enemy,
  EnemyType,
  Explosion,
  FloatingText,
  Projectile,
} from "./types";

const BARRICADE_CENTERS = [190, 385, 575, 770];
const BARRICADE_BLOCK_SIZE = 16;
const BARRICADE_START_Y = 592;

export function createEnemies(): Enemy[] {
  const enemies: Enemy[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const type: EnemyType = row === 0 ? "armored" : row <= 2 ? "shield" : "officer";
      const score =
        type === "armored"
          ? BALANCE.scoring.armored
          : type === "shield"
            ? BALANCE.scoring.shield
            : BALANCE.scoring.officer;

      enemies.push({
        id: `${row}-${col}`,
        type,
        row,
        col,
        alive: true,
        score,
      });
    }
  }

  return enemies;
}

export function createBarricades(): BarricadeBlock[] {
  const blocks: BarricadeBlock[] = [];

  for (const centerX of BARRICADE_CENTERS) {
    const startX = centerX - BARRICADE_BLOCK_SIZE * 3;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        blocks.push({
          x: startX + col * BARRICADE_BLOCK_SIZE,
          y: BARRICADE_START_Y + row * BARRICADE_BLOCK_SIZE,
          width: BARRICADE_BLOCK_SIZE - 2,
          height: BARRICADE_BLOCK_SIZE - 2,
          hp: 2,
          active: true,
        });
      }
    }
  }

  return blocks;
}

export function getFormationStepDelay(aliveCount: number, wave: number): number {
  const wavePressure = Math.min(
    Math.max(wave - BALANCE.formation.waveSpeedStartsOnWave, 0) *
      BALANCE.formation.waveSpeedPressurePerWave,
    BALANCE.formation.maxWaveSpeedPressure,
  );

  const delay = BALANCE.formation.stepDelayByAliveCount;
  let baseDelay: number;

  if (aliveCount <= 1) baseDelay = delay.oneOrLess;
  else if (aliveCount <= 3) baseDelay = delay.threeOrLess;
  else if (aliveCount <= 7) baseDelay = delay.sevenOrLess;
  else if (aliveCount <= 14) baseDelay = delay.fourteenOrLess;
  else if (aliveCount <= 21) baseDelay = delay.twentyOneOrLess;
  else if (aliveCount <= 28) baseDelay = delay.twentyEightOrLess;
  else baseDelay = delay.default;

  return Math.max(BALANCE.formation.minimumStepDelayMs, baseDelay - wavePressure);
}

export function getWaveStartingAdvance(wave: number): number {
  const waveOffset = Math.max(
    wave - BALANCE.formation.waveAdvanceStartsOnWave,
    0,
  );

  return Math.min(
    waveOffset * BALANCE.formation.waveAdvancePerWave,
    BALANCE.formation.maxStartingAdvance,
  );
}

export function getTankScore(
  playerShotCount: number,
  randomIndex: (length: number) => number = (length) =>
    Math.floor(Math.random() * length),
): number {
  const { tankFallbackScores, tankFirstPerfectShot, tankPerfectShotInterval } =
    BALANCE.scoring;

  if (playerShotCount === tankFirstPerfectShot) return 300;

  if (
    playerShotCount > tankFirstPerfectShot &&
    (playerShotCount - tankFirstPerfectShot) % tankPerfectShotInterval === 0
  ) {
    return 300;
  }

  const index = randomIndex(tankFallbackScores.length);

  return tankFallbackScores[index] ?? tankFallbackScores[0];
}

export function chooseEnemyShooter(
  enemies: Enemy[],
  randomIndex: (length: number) => number = (length) =>
    Math.floor(Math.random() * length),
): Enemy | null {
  const alive = enemies.filter((enemy) => enemy.alive);
  if (alive.length === 0) return null;

  const columns = [...new Set(alive.map((enemy) => enemy.col))];
  const selectedColumn = columns[randomIndex(columns.length)];
  const candidates = alive.filter((enemy) => enemy.col === selectedColumn);

  candidates.sort((a, b) => b.row - a.row);

  return candidates[0] ?? null;
}

export function getEnemyShotCooldown(
  aliveCount: number,
  randomBonusMs: number = Math.random() * BALANCE.enemies.randomCooldownBonusMs,
): number {
  const baseCooldown = Math.max(
    BALANCE.enemies.minimumShotCooldownMs,
    BALANCE.enemies.startingShotCooldownMs -
      (TOTAL_ENEMIES - aliveCount) *
        BALANCE.enemies.cooldownReductionPerEnemyKilledMs,
  );

  return baseCooldown + randomBonusMs;
}

export function updateExplosions(
  explosions: Explosion[],
  dtMs: number,
): Explosion[] {
  return explosions
    .map((explosion) => ({
      ...explosion,
      lifeMs: explosion.lifeMs - dtMs,
    }))
    .filter((explosion) => explosion.lifeMs > 0);
}

export function updateFloatingTexts(
  floatingTexts: FloatingText[],
  dtMs: number,
): FloatingText[] {
  const dy = 24 * (dtMs / 1000);

  return floatingTexts
    .map((floatingText) => ({
      ...floatingText,
      lifeMs: floatingText.lifeMs - dtMs,
      y: floatingText.y - dy,
    }))
    .filter((floatingText) => floatingText.lifeMs > 0);
}

export function updatePlayerMissile(
  playerMissile: Projectile | null,
  dtMs: number,
): Projectile | null {
  if (!playerMissile) return null;

  const dt = dtMs / 1000;
  const updatedMissile = {
    ...playerMissile,
    y: playerMissile.y + playerMissile.speedY * dt,
  };

  if (updatedMissile.y + updatedMissile.height < 0) return null;

  return updatedMissile;
}

export function updateEnemyProjectiles(
  enemyProjectiles: Projectile[],
  dtMs: number,
  maxY: number,
): Projectile[] {
  const dt = dtMs / 1000;

  return enemyProjectiles
    .map((projectile) => ({
      ...projectile,
      y: projectile.y + projectile.speedY * dt,
    }))
    .filter((projectile) => projectile.y < maxY);
}

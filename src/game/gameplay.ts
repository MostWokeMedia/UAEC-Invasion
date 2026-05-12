import { BALANCE } from "./balance";

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

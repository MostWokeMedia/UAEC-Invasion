export const BALANCE = {
  player: {
    speed: 310,
    missileSpeed: -285,
    fireFlashMs: 140,
    respawnInvulnerableMs: 1200,
    hitInvulnerableMs: 1600,
  },

  formation: {
    sideStep: 20,
    advanceStep: 20,
    leftBoundary: 44,
    rightBoundaryPadding: 44,

    // Later waves start closer, but this is capped.
    waveAdvanceStartsOnWave: 3,
    waveAdvancePerWave: 6,
    maxStartingAdvance: 72,

    // Later waves move a little faster, but this is capped.
    waveSpeedStartsOnWave: 4,
    waveSpeedPressurePerWave: 8,
    maxWaveSpeedPressure: 80,
    minimumStepDelayMs: 80,

    stepDelayByAliveCount: {
      oneOrLess: 90,
      threeOrLess: 160,
      sevenOrLess: 260,
      fourteenOrLess: 430,
      twentyOneOrLess: 600,
      twentyEightOrLess: 750,
      default: 900,
    },
  },

  enemies: {
    baseProjectileSpeed: 130,
    projectileSpeedPerWave: 8,
    maxActiveProjectiles: 3,
    startingShotCooldownMs: 1600,
    minimumShotCooldownMs: 480,
    cooldownReductionPerEnemyKilledMs: 28,
    randomCooldownBonusMs: 650,
  },

  tank: {
    firstSpawnMinMs: 12000,
    firstSpawnRandomBonusMs: 8000,
    respawnMinMs: 20000,
    respawnRandomBonusMs: 9000,
    baseSpeed: 72,
    speedPerWave: 4,
  },

  screens: {
    playerHitPauseMs: 1100,
    waveClearPauseMs: 1600,
  },

  danger: {
    playerDangerLineOffset: 105,
  },

  scoring: {
    officer: 10,
    shield: 20,
    armored: 30,
    tankFallbackScores: [50, 100, 150],
    tankFirstPerfectShot: 23,
    tankPerfectShotInterval: 15,
  },
} as const;

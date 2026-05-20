export const BALANCE = {
  player: {
    speed: 310,
    missileSpeed: -430,
    fireFlashMs: 140,
    respawnInvulnerableMs: 1200,
    hitInvulnerableMs: 1600,

    // Visual sprite is large and shows upper body/launcher.
    // Collision should sit lower so enemy shots must hit the player's body zone.
    hitboxYOffset: 40,
  },

  formation: {
    sideStep: 20,
    advanceStep: 20,
    leftBoundary: 44,
    rightBoundaryPadding: 44,

    // Later waves start closer, but this is capped.
    waveAdvanceStartsOnWave: 2,
    waveAdvancePerWave: 6,
    maxStartingAdvance: 42,

    // Later waves move a little faster, but this is capped.
    waveSpeedStartsOnWave: 3,
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

export type DifficultyMode = "classic" | "hard" | "nightmare";

export type DifficultySettings = {
  label: string;
  lives: number;
  enemyProjectileSpeedMultiplier: number;
  enemyShotCooldownMultiplier: number;
  maxEnemyProjectiles: number;
  formationStepDelayMultiplier: number;
  formationSpeedIncreasePerWave: number;
  tankSpawnTimerMultiplier: number;
  waveAdvanceStartsOnWave: number;
  waveAdvancePerWave: number;
  maxStartingAdvance: number;
};

export const DIFFICULTY_MODES: DifficultyMode[] = [
  "classic",
  "hard",
  "nightmare",
];

export const DIFFICULTY_PRESETS: Record<DifficultyMode, DifficultySettings> = {
  classic: {
    label: "Classic",
    lives: 3,
    enemyProjectileSpeedMultiplier: 1,
    enemyShotCooldownMultiplier: 1,
    maxEnemyProjectiles: BALANCE.enemies.maxActiveProjectiles,
    formationStepDelayMultiplier: 1,
    formationSpeedIncreasePerWave: 0,
    tankSpawnTimerMultiplier: 1,
    waveAdvanceStartsOnWave: BALANCE.formation.waveAdvanceStartsOnWave,
    waveAdvancePerWave: BALANCE.formation.waveAdvancePerWave,
    maxStartingAdvance: BALANCE.formation.maxStartingAdvance,
  },
  hard: {
    label: "Hard",
    lives: 3,
    enemyProjectileSpeedMultiplier: 1.15,
    enemyShotCooldownMultiplier: 0.8,
    maxEnemyProjectiles: 4,
    formationStepDelayMultiplier: 0.92,
    formationSpeedIncreasePerWave: 0,
    tankSpawnTimerMultiplier: 0.85,
    waveAdvanceStartsOnWave: BALANCE.formation.waveAdvanceStartsOnWave,
    waveAdvancePerWave: BALANCE.formation.waveAdvancePerWave,
    maxStartingAdvance: BALANCE.formation.maxStartingAdvance,
  },
  nightmare: {
    label: "Nightmare",
    lives: 1,
    enemyProjectileSpeedMultiplier: 1.35,
    enemyShotCooldownMultiplier: 0.45,
    maxEnemyProjectiles: 5,
    formationStepDelayMultiplier: 0.5884615384615385,
    formationSpeedIncreasePerWave: 0.05,
    tankSpawnTimerMultiplier: 0.7,
    waveAdvanceStartsOnWave: 1,
    waveAdvancePerWave: 10,
    maxStartingAdvance: 70,
  },
};

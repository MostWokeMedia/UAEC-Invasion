export const PLAYER_SPRITE = {
  width: 94,
  height: 123,
  xOffset: -2,
  yOffset: 42,
  firePoseMs: 72,
  muzzleFlashMs: 128,
  muzzleXOffset: 22,
  muzzleYOffset: 42,
};

export const TANK_SPRITE = {
  widthScale: 1.16,
  heightScale: 1.68,
  xOffset: -10,
  yOffset: -18,
};

export const ENEMY_SPRITE = {
  xPaddingRatio: 0.8,
  yTopPaddingRatio: 0.14,
  widthScale: 1.36,
  heightScale: 1.45,
  bobRatio: 0.032,
  xOffset: 8,

  typeScale: {
    officer: 1.16,
    shield: 0.98,
    armored: 1.24,
  },

  typeXOffset: {
    officer: 0,
    shield: -3,
    armored: 1,
  },

  typeYOffset: {
    officer: 0,
    shield: 1,
    armored: -1,
  },
};

export const BARRICADE_ART = {
  variants: 4,
  columns: 6,
  rows: 3,
  blocksPerBarricade: 18,
  visualXPadding: 22,
  visualTopPadding: 44,
  visualBottomPadding: 6,
  cellOverlap: 1.25,
  damagedGlowAlpha: 0.26,
  missingCellShadowAlpha: 0.22,
  grimeAlpha: 0.28,
  chipAlpha: 0.34,
  crackAlpha: 0.46,
};

export const PROJECTILE_SPRITE = {
  playerWidth: 24,
  playerHeight: 48,
  playerXOffset: -9,
  playerYOffset: -18,

  enemyCollisionWidth: 10,
  enemyCollisionHeight: 14,
  enemySpriteWidth: 20,
  enemySpriteHeight: 18,
  enemySpriteXOffset: -5,
  enemySpriteYOffset: -2,
};

export const EXPLOSION_SPRITE = {
  enemyWidth: 56,
  enemyHeight: 56,

  tankWidth: 170,
  tankHeight: 125,

  playerWidth: 96,
  playerHeight: 96,
};

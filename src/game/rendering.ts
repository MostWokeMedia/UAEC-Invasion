export const PLAYER_SPRITE = {
  width: 110,
  height: 143,
  xOffset: 0,
  yOffset: 50,
};

export const TANK_SPRITE = {
  extraHeight: 26,
  yOffset: -10,
};

export const ENEMY_SPRITE = {
  xPaddingRatio: 0.8,
  yTopPaddingRatio: 0.14,
  widthScale: 1.42,
  heightScale: 1.48,
  bobRatio: 0.04,
  xOffset: 13,

  typeScale: {
    officer: 1.00,
    shield: 1.14,
    armored: 1.24,
  },

  typeXOffset: {
    officer: 0,
    shield: -5,
    armored: 0,
  },
};

export const PROJECTILE_SPRITE = {
  playerWidth: 30,
  playerHeight: 52,
  playerXOffset: -12,
  playerYOffset: -13,

  enemyWidth: 20,
  enemyHeight: 32,
  enemyXOffset: -6,
  enemyYOffset: -5,
};

export const EXPLOSION_SPRITE = {
  enemyWidth: 56,
  enemyHeight: 56,

  tankWidth: 170,
  tankHeight: 125,

  playerWidth: 96,
  playerHeight: 96,
};

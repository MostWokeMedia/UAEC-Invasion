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
    officer: 1.18,
    shield: 0.96,
    armored: 1.30,
  },

  typeXOffset: {
    officer: 0,
    shield: -5,
    armored: 0,
  },
};

export const PROJECTILE_SPRITE = {
  playerWidth: 48,
  playerHeight: 80,
  playerXOffset: -21,
  playerYOffset: -28,

  enemyWidth: 36,
  enemyHeight: 58,
  enemyXOffset: -14,
  enemyYOffset: -18,
};

export const EXPLOSION_SPRITE = {
  enemyWidth: 56,
  enemyHeight: 56,

  tankWidth: 170,
  tankHeight: 125,

  playerWidth: 96,
  playerHeight: 96,
};

export type GameMode =
  | "start"
  | "playing"
  | "paused"
  | "player-hit"
  | "wave-clear"
  | "game-over";

export type EnemyType = "officer" | "shield" | "armored";

export type Direction = -1 | 1;

export type ProjectileOwner = "player" | "enemy";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Enemy = {
  id: string;
  type: EnemyType;
  row: number;
  col: number;
  alive: boolean;
  score: number;
};

export type Projectile = Rect & {
  owner: ProjectileOwner;
  speedY: number;
};

export type BarricadeBlock = Rect & {
  hp: number;
  active: boolean;
};

export type Tank = Rect & {
  active: boolean;
  direction: Direction;
  speed: number;
  spawnTimerMs: number;
};

export type Player = Rect & {
  speed: number;
  invulnerableMs: number;
};

export type FloatingText = {
  text: string;
  x: number;
  y: number;
  lifeMs: number;
};

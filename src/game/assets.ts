export type SpriteKey =
  | "citadelWitness"
  | "citizenLifeHead"
  | "playerIdle"
  | "playerFire"
  | "uaecOfficerWalk1"
  | "uaecOfficerWalk2"
  | "uaecShieldWalk1"
  | "uaecShieldWalk2"
  | "uaecArmoredWalk1"
  | "uaecArmoredWalk2"
  | "uaecTank"
  | "playerMissile"
  | "enemyProjectile"
  | "barricadeFull"
  | "barricadeDamaged"
  | "explosion1"
  | "explosion2"
  | "explosion3";

const SPRITE_PATHS: Record<SpriteKey, string> = {
  citadelWitness: "/assets/citadel-witness.png",
  citizenLifeHead: "/assets/sprites/ui/citizen_life_head.png",

  playerIdle: "/assets/sprites/player/citizen_launcher_idle.png",
  playerFire: "/assets/sprites/player/citizen_launcher_fire.png",

  uaecOfficerWalk1: "/assets/sprites/enemies/uaec_officer_walk_01.png",
  uaecOfficerWalk2: "/assets/sprites/enemies/uaec_officer_walk_02.png",

  uaecShieldWalk1: "/assets/sprites/enemies/uaec_shield_walk_01.png",
  uaecShieldWalk2: "/assets/sprites/enemies/uaec_shield_walk_02.png",

  uaecArmoredWalk1: "/assets/sprites/enemies/uaec_armored_walk_01.png",
  uaecArmoredWalk2: "/assets/sprites/enemies/uaec_armored_walk_02.png",

  uaecTank: "/assets/sprites/tank/uaec_tank.png",

  playerMissile: "/assets/sprites/projectiles/player_missile.png",
  enemyProjectile: "/assets/sprites/projectiles/enemy_projectile.png",

  barricadeFull: "/assets/sprites/barricades/concrete_block_full.png",
  barricadeDamaged: "/assets/sprites/barricades/concrete_block_damaged.png",

  explosion1: "/assets/sprites/effects/explosion_01.png",
  explosion2: "/assets/sprites/effects/explosion_02.png",
  explosion3: "/assets/sprites/effects/explosion_03.png",
};

export class SpriteManager {
  private sprites = new Map<SpriteKey, HTMLImageElement>();
  private failedSprites = new Set<SpriteKey>();
  private enabled = true;

  get isEnabled(): boolean {
    return this.enabled;
  }

  toggleEnabled(): void {
    this.enabled = !this.enabled;
  }

  loadAll(): void {
    for (const key of Object.keys(SPRITE_PATHS) as SpriteKey[]) {
      this.load(key);
    }
  }

  load(key: SpriteKey): HTMLImageElement {
    const existingSprite = this.sprites.get(key);

    if (existingSprite) {
      return existingSprite;
    }

    const image = new Image();

    image.onload = () => {
      this.failedSprites.delete(key);
    };

    image.onerror = () => {
      this.failedSprites.add(key);
    };

    image.src = SPRITE_PATHS[key];
    this.sprites.set(key, image);

    return image;
  }

  get(key: SpriteKey): HTMLImageElement | null {
    if (!this.enabled) {
      return null;
    }

    if (this.failedSprites.has(key)) {
      return null;
    }

    const image = this.sprites.get(key) ?? this.load(key);

    if (!image.complete || image.naturalWidth === 0) {
      return null;
    }

    return image;
  }

  has(key: SpriteKey): boolean {
    return this.get(key) !== null;
  }
}

# UAEC Invasion Sprite Specs

## Goal

Create clean individual pixel-art sprites for UAEC Invasion.

These sprites should replace the temporary test sprites that were sliced from a concept sheet.

## Global Style Rules

- Pixel art
- Transparent PNG backgrounds
- No boxed-in background artifacts
- Strong silhouettes
- Readable at small sizes
- Cyberpunk / Neo Tokyo / Citadel mood
- Dark navy / black armor base
- Neon pink accents
- Cyan highlights
- Limited palette preferred
- Readability first, decorative detail second

## Camera / Perspective Rules

The game uses a pseudo-3D street perspective.

Sprites should feel slightly front-facing / street-facing rather than perfectly flat side-view.

## Player

### citizen_launcher_idle.png

Path:

```text
public/assets/sprites/player/citizen_launcher_idle.png
Size:

96x96 px

Description:

Neo Tokyo citizen with missile launcher in idle street-defense stance.

Notes:

Strong launcher silhouette
Resistance citizen, not UAEC
Readable legs and stance
Dark clothing with subtle neon pink/cyan accents
citizen_launcher_fire.png

Path:

public/assets/sprites/player/citizen_launcher_fire.png

Size:

96x96 px

Description:

Same player character firing the missile launcher.

Notes:

Same proportions as idle
Small muzzle flash or recoil emphasis
Should clearly read as the firing state
UAEC Officer
uaec_officer_walk_01.png / uaec_officer_walk_02.png

Path:

public/assets/sprites/enemies/

Size:

48x48 px

Description:

Small basic UAEC invader.

Notes:

Clear helmet silhouette
Dark armor
Neon pink visor/accent
Two subtle walking frames
UAEC Riot Shield Unit
uaec_shield_walk_01.png / uaec_shield_walk_02.png

Path:

public/assets/sprites/enemies/

Size:

56x56 px

Description:

Medium UAEC unit carrying a riot shield.

Notes:

Shield must be obvious immediately
Slightly larger than officer
Two subtle walking frames
UAEC Armored Class
uaec_armored_walk_01.png / uaec_armored_walk_02.png

Path:

public/assets/sprites/enemies/

Size:

64x64 px

Description:

Large heavy UAEC armored invader.

Notes:

Broad shoulders
Heavy armor silhouette
Larger than shield unit
Two subtle walking frames
UAEC Tank
uaec_tank.png

Path:

public/assets/sprites/tank/uaec_tank.png

Size:

160x80 px

Description:

Mystery target / bonus target.

Notes:

Long readable tank silhouette
Dark UAEC armor
Neon pink UAEC mark
Should read clearly even while moving across the background
Projectiles
player_missile.png

Path:

public/assets/sprites/projectiles/player_missile.png

Size:

24x32 px

Description:

Bright upward missile.

Notes:

Easy to see
Distinct from enemy projectile
Should feel slow, deliberate, and powerful
enemy_projectile.png

Path:

public/assets/sprites/projectiles/enemy_projectile.png

Size:

16x24 px

Description:

Red/pink enemy projectile.

Notes:

Visually distinct from player missile
Easy to see against the dark background
Barricades
concrete_block_full.png

Path:

public/assets/sprites/barricades/concrete_block_full.png

Size:

16x16 px

Description:

Undamaged barricade block.

concrete_block_damaged.png

Path:

public/assets/sprites/barricades/concrete_block_damaged.png

Size:

16x16 px

Description:

Damaged barricade block.

Notes:

Should tile cleanly into barricades
Damaged version must look weaker but still readable
Explosions
explosion_01.png / explosion_02.png / explosion_03.png

Path:

public/assets/sprites/effects/

Size:

64x64 px

Description:

Three-frame pixel explosion animation.

Notes:

Frame 1: ignition / bright flash
Frame 2: full explosion
Frame 3: smoke and debris
Transparent background
Priority Order
Player idle
Player fire
UAEC Officer frame 1
UAEC Officer frame 2
UAEC Shield frame 1
UAEC Shield frame 2
UAEC Armored frame 1
UAEC Armored frame 2
Tank
Player missile
Enemy projectile
Barricade full
Barricade damaged
Explosion 01
Explosion 02
Explosion 03
Final Note

Do not create the final sprites as one large poster sheet.

Create each sprite as its own clean transparent PNG.

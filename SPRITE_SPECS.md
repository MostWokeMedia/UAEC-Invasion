# UAEC Invasion Sprite Specs

## Goal

Create clean individual pixel-art sprites for UAEC Invasion.

These sprites should replace the temporary test sprites that were sliced from a concept sheet.

## Global Style Rules

- Pixel art
- Clean transparent PNG backgrounds
- No boxed-in background artifacts
- Strong silhouettes
- Readable at small sizes
- Cyberpunk / Neo Tokyo / Citadel mood
- Dark navy / black armor base
- Neon pink accents
- Cyan highlights
- Limited palette preferred
- Avoid over-detailing tiny sprites
- Sprites should be readable first, decorative second

## Camera / Perspective Rules

The game uses a pseudo-3D street perspective.

That means sprites should feel slightly front-facing / street-facing rather than perfectly flat side-view.

However:
- readability is more important than realism
- silhouettes must stay clear
- enemy types must be distinguishable instantly

## Sprite File Specs

---

## Player

### File
`public/assets/sprites/player/citizen_launcher_idle.png`

### Size
96x96 px

### Description
Neo Tokyo citizen with missile launcher.
Player-facing street-defense stance.
Should read clearly as the player character.

### Notes
- Strong launcher silhouette
- Legs/stance readable
- Slight cyberpunk armor/clothing detail
- Should feel like a resistance citizen, not UAEC

---

### File
`public/assets/sprites/player/citizen_launcher_fire.png`

### Size
96x96 px

### Description
Same character as idle, but in a firing pose.

### Notes
- Same silhouette and proportions as idle
- Small muzzle flash or firing emphasis
- Should clearly read as the firing state

---

## UAEC Officer

### File
`public/assets/sprites/enemies/uaec_officer_walk_01.png`

### Size
48x48 px

### Description
Small invader class.
Basic UAEC officer.

### Notes
- Simplest UAEC enemy type
- Clear helmet / armor silhouette
- Walk frame 1

---

### File
`public/assets/sprites/enemies/uaec_officer_walk_02.png`

### Size
48x48 px

### Description
Same as above, walk frame 2.

### Notes
- Slight step variation
- Keep silhouette very similar
- Should animate cleanly with frame 1

---

## UAEC Riot Shield Unit

### File
`public/assets/sprites/enemies/uaec_shield_walk_01.png`

### Size
56x56 px

### Description
Medium invader class.
UAEC unit carrying a riot shield.

### Notes
- Shield must be obvious immediately
- Frame 1
- More defensive silhouette than officer

---

### File
`public/assets/sprites/enemies/uaec_shield_walk_02.png`

### Size
56x56 px

### Description
Same as above, walk frame 2.

### Notes
- Slight walk cycle change
- Shield remains prominent

---

## UAEC Armored Class

### File
`public/assets/sprites/enemies/uaec_armored_walk_01.png`

### Size
64x64 px

### Description
Large invader class.
Heavy UAEC armored unit.

### Notes
- Biggest standard enemy
- Broad shoulders / heavy armor silhouette
- Frame 1

---

### File
`public/assets/sprites/enemies/uaec_armored_walk_02.png`

### Size
64x64 px

### Description
Same as above, walk frame 2.

### Notes
- Slight walk variation
- Must remain heavy and imposing

---

## UAEC Tank

### File
`public/assets/sprites/tank/uaec_tank.png`

### Size
160x80 px

### Description
Mystery target / bonus target.
UAEC tank unit.

### Notes
- Long readable silhouette
- Must feel different from marching enemies
- Slight cyberpunk armored vehicle styling

---

## Projectiles

### File
`public/assets/sprites/projectiles/player_missile.png`

### Size
24x32 px

### Description
Player missile.

### Notes
- Bright
- Easy to see
- Should read as a deliberate upward missile

---

### File
`public/assets/sprites/projectiles/enemy_projectile.png`

### Size
16x24 px

### Description
Enemy projectile.

### Notes
- Distinct from player missile
- Easy to read against dark background

---

## Barricades

### File
`public/assets/sprites/barricades/concrete_block_full.png`

### Size
16x16 px

### Description
Undamaged barricade block.

### Notes
- Should feel like road/concrete defense cover
- Readable in a grid arrangement

---

### File
`public/assets/sprites/barricades/concrete_block_damaged.png`

### Size
16x16 px

### Description
Damaged barricade block.

### Notes
- Same silhouette as full block
- Clearly more damaged / weakened

---

## Explosions

### File
`public/assets/sprites/effects/explosion_01.png`

### Size
64x64 px

### Description
Explosion frame 1.

---

### File
`public/assets/sprites/effects/explosion_02.png`

### Size
64x64 px

### Description
Explosion frame 2.

---

### File
`public/assets/sprites/effects/explosion_03.png`

### Size
64x64 px

### Description
Explosion frame 3.

---

## Priority Order

Create sprites in this order:

1. Player idle
2. Player fire
3. UAEC officer frame 1
4. UAEC officer frame 2
5. UAEC shield frame 1
6. UAEC shield frame 2
7. UAEC armored frame 1
8. UAEC armored frame 2
9. Tank
10. Player missile
11. Enemy projectile
12. Barricade full
13. Barricade damaged
14. Explosion 01
15. Explosion 02
16. Explosion 03

## Final Notes

These should be made as clean individual transparent PNGs.

Do not create them as one large concept poster first.

They should be designed for in-game readability first.

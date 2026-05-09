# UAEC Invasion — Product Requirements Document

## 1. Product Summary

**UAEC Invasion** is a browser-based arcade shooter inspired by the core mechanics of classic Space Invaders, reimagined through a Neo Tokyo cyberpunk street-defense perspective.

The player controls a Neo Tokyo citizen armed with a missile launcher at the bottom of the screen. UAEC forces march down the street toward the player in organized formation. The game should feel mechanically close to the original Space Invaders while presenting a fresh visual identity.

## 2. Target Platform

### Primary Platform
- Desktop browser

### Secondary Platform
- Mobile browser, added after desktop version feels good

### Desktop Controls
- `A` = move left
- `D` = move right
- `Left Arrow` = move left
- `Right Arrow` = move right
- `Spacebar` = shoot
- `M` = mute/unmute audio
- `Enter` = start/restart game

## 3. Core Design Pillars

### 3.1 Classic Arcade Feel
The game should preserve the tension and rhythm of classic Space Invaders:
- formation movement
- one player missile on screen at a time
- slow deliberate shots
- enemies speeding up as their numbers decrease
- destructible barricades
- three lives
- score chasing
- hidden mystery tank bonus

### 3.2 Neo Tokyo Identity
The game should not look like a clone. The setting should feel like a cyberpunk street battle:
- rainy neon city
- wet reflective street
- UAEC police/military enemies
- missile-launcher citizen protagonist
- concrete barricades and street debris
- mystery tank crossing in the background

### 3.3 Readability First
Because the camera angle is more cinematic than classic Space Invaders, we will use fewer enemies than the original 55-enemy rack.

Version 1 target:
- 7 columns × 5 rows = 35 enemies

## 4. Game Objective

The player must destroy all UAEC enemies before they reach the player’s danger line.

The player loses a life when hit by enemy fire.

The game ends when:
- the player loses all 3 lives, or
- any UAEC invader reaches the player danger line

The player clears a wave when:
- all UAEC enemies are destroyed

## 5. Enemy Types

### 5.1 Small Invader — UAEC Officer
- Role: basic enemy
- Score: 10 points
- Visual: small UAEC officer
- Formation rows: lower/front rows

### 5.2 Medium Invader — UAEC Riot Shield Unit
- Role: middle-tier enemy
- Score: 20 points
- Visual: UAEC officer with riot shield
- Formation rows: middle rows

### 5.3 Large Invader — UAEC Armored Class
- Role: high-value enemy
- Score: 30 points
- Visual: larger armored UAEC unit
- Formation rows: upper/back rows

### 5.4 Mystery Ship Equivalent — UAEC Tank
- Role: bonus enemy
- Score: hidden variable score
- Visual: UAEC tank crossing the far background
- Appears close to the original mystery ship rhythm
- Should not display its score before being destroyed

## 6. Recommended Formation Layout

Version 1 formation:

```text
Top/deep row:      7 UAEC Armored Class units   30 pts
Second row:        7 UAEC Riot Shield units     20 pts
Third row:         7 UAEC Riot Shield units     20 pts
Fourth row:        7 UAEC Officer units         10 pts
Front/bottom row:  7 UAEC Officer units         10 pts
```

Total enemies:
```text
35
```

Maximum possible regular enemy score per wave:
```text
7 × 30 = 210
14 × 20 = 280
14 × 10 = 140

Total = 630 points before tank bonuses
```

## 7. Player Rules

### 7.1 Movement
- Player can only move horizontally.
- No vertical movement in Version 1.
- Player should remain near the bottom of the screen.

### 7.2 Shooting
- Infinite ammo.
- No ammo UI.
- One player missile may be active at a time.
- If the player presses shoot while a missile is already active, nothing happens.
- Only successful missile launches increment the hidden shot count.

### 7.3 Lives
- Player starts with 3 lives.
- Lives are shown in the HUD.
- When hit, player loses one life.
- After losing a life, projectiles clear and the player briefly respawns.

## 8. Enemy Movement

Enemies move as one synchronized formation.

Classic translation:

```text
Original Space Invaders:
Move left/right → hit edge → drop downward

UAEC Invasion:
Move left/right across street lanes → hit boundary → advance toward player
```

### 8.1 Formation Behavior
- The whole formation shifts left/right.
- When the formation hits its lane boundary, it reverses direction.
- After reversing, the formation advances one depth step toward the player.
- The formation speeds up as enemies are destroyed.

### 8.2 Speed Curve
Suggested Version 1 speed table:

```text
35 enemies alive: 900 ms per step
28 enemies alive: 750 ms per step
21 enemies alive: 600 ms per step
14 enemies alive: 430 ms per step
7 enemies alive: 260 ms per step
3 enemies alive: 160 ms per step
1 enemy alive: 90 ms per step
```

## 9. Enemy Shooting

### 9.1 Projectile Rules
- Max 3 enemy projectiles active at a time.
- Shots come from living enemies.
- Prefer frontmost/lower surviving enemies in a column.
- Fire rate increases as fewer enemies remain.

### 9.2 Shot Types
Version 1 can use one simple enemy shot type:
- red projectile moving toward the player

Future versions may add:
- aimed shot
- slow shot
- fast shot
- shield-piercing shot for higher waves

## 10. Barricades

Barricades replace classic Space Invaders shields.

### 10.1 Barricade Rules
- Barricades absorb player and enemy shots.
- Barricades visually degrade as they take damage.
- No shield health meter is shown.
- If enemies advance into the barricade zone, barricades are destroyed/crushed.

### 10.2 Version 1 Placeholder
Use simple gray rectangles with damage states.

Future art:
- concrete barriers
- vending machines
- street construction blocks
- wrecked vehicles
- debris piles

## 11. UAEC Tank / Mystery Ship Rules

The UAEC Tank is the mystery ship equivalent.

### 11.1 Appearance
- Appears at the far background/top of the street.
- Crosses left-to-right or right-to-left.
- Should appear close to original mystery ship timing, roughly every 20–30 seconds.
- Does not appear during menus or game-over state.

### 11.2 Hidden Score Logic
The tank should use a hidden shot-count Easter egg.

Recommended implementation:

```text
If tank is destroyed on player shot 23: award 300 points.
After that, every 15th valid player shot also awards 300 points.

Examples:
Shot 23 = 300
Shot 38 = 300
Shot 53 = 300
Shot 68 = 300
```

If the shot does not match the 300-point pattern, the tank awards a lower hidden value:
- 50 points
- 100 points
- 150 points

### 11.3 UI Rule
Do not show:
- shot count
- next 300-point shot
- Easter egg box
- tank score before hit

Only show the awarded score after the tank is destroyed.

## 12. HUD Requirements

Show:
- Score
- High score
- Wave
- Lives
- Mute/unmute indicator, small and unobtrusive

Do not show:
- shot count
- ammo count
- weapon box
- shield integrity
- Easter egg information
- tank score before destruction

## 13. Audio Requirements

### 13.1 Heartbeat / March Pulse
Version 1 should include a Space Invaders-inspired heartbeat pulse.

Rules:
- Pulse plays with each formation step.
- Pulse gets faster as the formation speeds up.
- Pulse should feel cyberpunk/mechanical, not a direct copy.
- Audio starts only after player interaction because browsers block autoplay.

### 13.2 Mute/Unmute
- `M` toggles mute.
- Optional small icon in HUD.
- Mute should affect heartbeat and future music.

### 13.3 Cyberpunk Music
Cyberpunk background music is a later addition.

Recommendation:
- Version 1: heartbeat only
- Version 2: optional background loop
- Music volume should be lower than sound effects

## 14. Visual Requirements

Version 1:
- Placeholder rectangles
- Simple color-coded enemy types
- Basic dark street background
- Basic projectiles
- Basic score UI

Later visual pass:
- pixel-art UAEC Officer
- pixel-art Riot Shield Unit
- pixel-art Armored Class
- pixel-art Tank
- pixel-art Neo Tokyo citizen
- neon signs
- rain
- reflections
- explosions
- CRT effect

## 15. MVP Scope

Version 1 MVP must include:
- start screen
- player movement
- player shooting
- 35-enemy formation
- enemies moving left/right and advancing forward
- enemy shots
- barricades
- score
- high score
- 3 lives
- wave clear
- game over
- tank bonus enemy
- hidden 300-point tank logic
- heartbeat audio
- mute/unmute

Version 1 should not include:
- final art
- final music
- mobile controls
- boss fights
- power-ups
- online leaderboard
- wallet/NFT integration
- complex menus

## 16. Success Criteria

The prototype is successful when:
- the player can start a game
- the player can move left and right
- the player can shoot one missile at a time
- the enemies move as a formation
- the enemies advance toward the player
- the game gets faster as enemies are destroyed
- enemies can shoot the player
- barricades block shots and degrade
- the tank appears and can be destroyed
- scoring works
- the hidden 300-point tank mechanic works
- player can win, lose, and restart
- heartbeat audio works and can be muted

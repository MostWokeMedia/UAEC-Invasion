# UAEC Invasion Release and Revert Checklist

## Current Target

Desktop browser release candidate. Mobile support is postponed until after the desktop version feels finished.

## Pre-Change Safety

- [ ] Confirm `git status --short` is clean or only contains expected work.
- [ ] Record the planned change in `CHANGELOG.md`.
- [ ] Keep cleanup-only changes separate from behavior changes when committing.
- [ ] Run `npm run verify` before refactors when Node is available.

## Automated Verification

- [ ] `npm install` has been run after dependency changes.
- [ ] `npm run typecheck`
- [ ] `npm run test:run`
- [ ] `npm run build`
- [ ] `npm run verify`

## Manual Smoke Test

- [ ] Game starts from title screen.
- [ ] Player moves with A/D.
- [ ] Player moves with arrow keys.
- [ ] Spacebar fires.
- [ ] One player missile appears at a time.
- [ ] Enemies move side-to-side.
- [ ] Enemies advance toward the player.
- [ ] Enemy speed increases as enemies are destroyed.
- [ ] Enemies shoot back.
- [ ] Barricades block shots and take damage.
- [ ] Barricades rebuild between waves.
- [ ] Player loses lives correctly.
- [ ] Game over works.
- [ ] Restart works from game over.
- [ ] Wave clear works.
- [ ] UAEC Tank appears.
- [ ] UAEC Tank can be destroyed.
- [ ] Hidden 300-point tank scoring works.
- [ ] Score and high score work.
- [ ] High score persists after reload.
- [ ] Music toggles with M.
- [ ] SFX toggles with N.
- [ ] Music and SFX mute settings persist after reload.
- [ ] Pause works with P / Escape.
- [ ] Sprites can toggle with T as a hidden dev tool.
- [ ] Sprite-on and sprite-off rendering both remain readable.

## Visual Review

- [ ] Player is positioned correctly at bottom.
- [ ] Player appears hips-up.
- [ ] Officers read as front/small enemies.
- [ ] Shield units read as medium enemies.
- [ ] Armored units read as heavy enemies.
- [ ] Tank reads as mystery target.
- [ ] Projectiles are readable.
- [ ] Explosions feel good.
- [ ] Background does not distract.
- [ ] HUD is readable.

## Balance Review

- [ ] Waves 1-5 feel good.
- [ ] Wave 6 is challenging but fair.
- [ ] Wave 7 is challenging but fair.
- [ ] Wave 8 speed increase feels good.
- [ ] Wave 9 is hard but not unfair.
- [ ] Enemy shot frequency feels fair.
- [ ] Player missile feels good.
- [ ] Player hitbox feels fair.
- [ ] Tank appears often enough.

## Revert Notes

- To revert a whole phase, prefer `git revert <commit>` once changes are committed.
- To restore archived source snapshots manually, move files from `archive/source-snapshots/` back to their original `src/` paths.
- To revert starter-file cleanup, restore the deleted files from git history.
- To revert storage helper changes, restore direct `localStorage` reads/writes in `Game` and `AudioManager`.
- To revert listener cleanup, remove `dispose()` calls and restore constructor-only event registration.
- To revert renderer extractions, either use the matching checkpoint commit or inline the renderer call back into `Game`:
  - `1d45bc5` sprite cache
  - `7c40bf7` HUD
  - `41a0c7c` screen overlays
  - `7c95a6c` atmosphere overlays
  - `a01e598` projectiles/explosions
  - `d32530b` barricades
  - `49e065a` player
  - `5339725` tank
  - `2300b88` enemies
  - `66dfa5f` floating text and audio unlock
  - `1e02e47` background
- To revert gameplay helper extractions, use the matching checkpoint commit or inline the helper back into `Game`:
  - `5175662` entity setup
  - `2e0ac1b` geometry helpers
  - `98374af` collision helpers
  - `661b75b` enemy shooting helpers
  - `3448b93` transient lifecycle helpers
  - `3941e78` projectile update helpers
- After reverting any rendering or gameplay-helper extraction, run the full automated verification and repeat the manual smoke test sections above.

## Known Deferred Items

- [ ] Mobile controls
- [ ] Advanced settings menu
- [ ] Online leaderboard
- [ ] Final trailer/GIF
- [ ] Full release landing page

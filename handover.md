# MapleWorld Asset Handover

Project folder:

The repo lives under the user's OneDrive Desktop folder and is named `MapleWorld_FABLEandGPTimage2`.

Codex cwd during this handover:

`MapleWorld_FABLEandGPTimage2`

This file is intentionally ASCII-only so future agents do not hit Windows PowerShell encoding issues.

## Current Asset State

The project now has the PNG hooks and generated assets requested by `assets/ASSET_REQUESTS.md`.

Static asset pass already completed:

- 6 player hero PNGs in `assets/sprites/player/hero-*.png`
- 36 weapon PNGs in `assets/sprites/weapons/weapon_*.png`
- 27 monster PNGs in `assets/sprites/mob_*.png`
- 7 projectile PNGs in `assets/sprites/fx/proj/*.png`
- UI frame/button/bar PNGs in `assets/ui/*.png`
- 85 item icons in `assets/ui/items/*.png`
- Map backgrounds as `assets/backgrounds/<mapId>-bg.png`

Combat animation pass completed in this turn:

- 64 monster animation sheets in `assets/sprites/monsters/anim/*.png`
  - Naming: `mob_<type>_idle.png`
  - Naming: `mob_<type>_hit.png`
  - Each sheet is 4 horizontal frames.
- 36 weapon swing sheets in `assets/sprites/weapons/anim/*.png`
  - Naming: `weapon_<itemId>_swing.png`
  - Each sheet is 6 horizontal frames.
- Layered hit FX in `assets/sprites/fx/impact/<style>/`
  - Styles: `physical`, `fire`, `ice`, `magic`, `shadow`, `holy`, `bullet`
  - Files per style: `sheet-transparent.png`, `core.png`, `sparks.png`, `ring.png`
- Skill explosion FX in `assets/sprites/fx/explosion/<style>/sheet-transparent.png`
  - Styles: `fire`, `ice`, `arcane`, `shadow`
  - Each sheet is 6 horizontal frames.

## Scripts

### `scripts/generate_requested_assets.py`

Generates the bulk static PNG set:

```powershell
py scripts\generate_requested_assets.py
```

Notes:

- Existing player and monster variants are protected from overwrite.
- Existing map backgrounds are protected from overwrite.
- Weapon, projectile, UI, and item icon PNGs are regenerated from current data.
- Item icons read `icon` and `color` from `js/data/items.js`.

### `scripts/split_hero_sheet.py`

Splits a 5-character hero contact sheet into the hero PNGs used by the game:

```powershell
py scripts\split_hero_sheet.py <sheet.png>
```

The image used for the current polished heroes was generated here:

`C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e5a8ad8348191a847b9993f59f76b.png`

Output order:

1. `hero-adventurer.png`
2. `hero-magician.png`
3. `hero-archer.png`
4. `hero-thief.png`
5. `hero-pirate.png`

The script also copies `hero-adventurer.png` to `hero-warrior.png`.

### `scripts/generate_combat_animation_assets.py`

Generates monster animation sheets, weapon swing sheets, layered impact FX, and explosion FX:

```powershell
py scripts\generate_combat_animation_assets.py
```

Important behavior:

- Reads existing `assets/sprites/mob_*.png` and creates idle/hit sheets.
- Adds type aliases for database names like `snail`, `slime`, `mushroom`, `purpleMush`, `golem`, and `boss`.
- Reads existing `assets/sprites/weapons/weapon_*.png` and creates swing sheets.
- Generates impact FX layers and explosion sheets procedurally with transparent backgrounds.

## Runtime Loading Rules

The runtime now prefers animation sheets when they exist, with static PNG fallback.

Monster rendering in `js/sprites.js`:

- First tries `assets/sprites/monsters/anim/mob_<monsterType>_idle.png`
- Uses `mob_<monsterType>_hit.png` while `m.flash > 0`
- Falls back to sheets based on the existing static monster asset name
- Falls back to the old static `assets/sprites/mob_*.png` if no sheet is ready

Weapon rendering in `js/sprites.js`:

- During player attacks, first tries `assets/sprites/weapons/anim/<weaponStem>_swing.png`
- Falls back to the old static weapon PNG draw if no swing sheet is ready

World FX in `js/effects.js`:

- `Effects.spark()` now prefers `assets/sprites/fx/impact/physical/sheet-transparent.png`
- `Effects.poof()` now prefers `assets/sprites/fx/explosion/arcane/sheet-transparent.png`
- New `Effects.explosion(x, y, style, size)` loads:
  - `assets/sprites/fx/explosion/<style>/sheet-transparent.png`

Projectile collision in `js/game.js`:

- Player projectiles trigger `Effects.explosion(...)` on hit.
- `fire` projectiles use fire explosions.
- `ice` projectiles use ice explosions.
- `star` projectiles use shadow explosions.
- Other projectile styles use arcane explosions.
- Boss projectile hits also trigger an explosion.

## Windows Filename Warning

Windows filenames are case-insensitive. Do not try to keep both:

- `mob_darkLord.png`
- `mob_darklord.png`

The code maps the `darkLord` boss to the existing lowercase file:

`assets/sprites/mob_darklord.png`

This same caution applies to animation sheets.

## Verification

Latest verification command:

```powershell
node tests\smoke.test.js
```

Latest result:

```text
Smoke test result: 54 passed, 0 failed
```

The smoke test now checks these new paths:

- `assets/sprites/monsters/anim/mob_snail_idle.png`
- `assets/sprites/weapons/anim/weapon_wood_sword_swing.png`
- `assets/sprites/fx/impact/physical/sheet-transparent.png`
- `assets/sprites/fx/explosion/fire/sheet-transparent.png`

## Review Pass (Claude, 2026-06-14)

Reviewed this handover, verified integration in a real browser (headless Edge
screenshots of meadow / forest / cave / snowField / lavaPath / castleGate /
throneRoom), and fixed issues.

### Bug found and fixed: monster double-tint (wrong colors)

- Root cause: monster defs in `js/data/monsters.js` carry a `tint` (CSS filter,
  e.g. `hue-rotate(150deg)`) that was only meant for the procedural fallback
  shape. `js/sprites.js drawMonster()` applied `d.tint` to `ctx.filter`
  unconditionally, before choosing asset vs procedural. Now that every monster
  has a dedicated PNG, the tint was layered on top of the already-colored sprite.
- Symptom: ice slime rendered purple (its PNG is correct blue + hue-rotate(150)),
  lava slime / snowman / zombie / skeleton / etc. all shifted to wrong colors.
- Fix: in `drawMonster()`, only apply `d.tint` when no PNG asset is ready
  (`usingArt = this._readyImage(this._monsterAsset(m))`). Flash brightness still
  applies. Verified: ice slime is blue, lava slime is red after the fix.

### Verified working
- All 6 theme backgrounds + per-map backgrounds render; background falls back
  from `<mapId>-bg.png` to the theme background correctly.
- Hero PNGs (5 classes), weapon PNGs, monster idle/hit sheets, and bosses
  (darkLord etc.) all load and render.
- Projectile-hit explosion FX wiring in `js/game.js` is correct (fire/ice/shadow/
  arcane styles by projectile style; boss projectiles use fire/arcane).
- `node tests\smoke.test.js` -> 54 passed, 0 failed.

### Notes (not bugs, optional follow-ups)
- Item icons (`assets/ui/items/*.png`, 85) and UI frames (`assets/ui/*.png`) were
  generated but are NOT wired into the runtime. The game still uses procedural
  item icons and a procedural HUD. The generic-type icons (rings/capes/materials)
  are plain colored gems, visually about the same as the procedural fallback, so
  wiring them gives little benefit and would also require updating the smoke
  test's weapon-icon assertion. Left unwired on purpose; can wire on request.
- Pre-existing cosmetic mismatch (NOT from this handover): the monster named
  "green slime" uses a purple sprite (`mob_bubbling.png`, unchanged from the
  original repo). Rename or recolor if desired.

## Recommended Next Steps

The new animation sheets are functional and integrated, but most are generated from static PNGs. Good follow-up work:

- Replace high-value monsters with hand-authored or image-generated idle/walk/attack/death sheets.
- Add separate monster attack sheets and wire them to boss states.
- Add weapon-specific element trails instead of the shared swing treatment.
- Add projectile loop sheets, not just static projectile PNGs.
- Add skill-specific impact style selection for every skill in `js/data/skills.js`.
- Add a small visual preview page for browsing all sprite sheets.

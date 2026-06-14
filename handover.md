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

### Notes (follow-ups) -> RESOLVED in the Wiring Pass below
- Item icons + UI frames were generated but not wired -> now wired (see Wiring Pass).
- Green-slime purple sprite -> recolored to green (see Wiring Pass).

## Wiring Pass (Claude, 2026-06-14)

Per user request, wired the remaining generated assets into the runtime and fixed
the green-slime color. All changes have procedural fallbacks (missing PNG -> old
look), so nothing breaks if a file is absent.

### Item icons (now wired)
- `js/sprites.js drawItemIcon()` now prefers `assets/ui/items/<id>.png`
  (and `assets/ui/icon_meso.png` for meso), falling back to the procedural icon.
- All 85 item ids have a matching PNG, so inventory / equip / HUD now show the
  authored icons.

### UI skin frames (now wired in `js/ui.js`, with fallback)
- `ui_panel.png`   -> all windows / tooltips / map-name / boss bar (9-slice, corner 16).
- `ui_titlebar.png`-> window title bar.
- `ui_btn_close.png`-> window close button.
- `ui_btn_plus.png`-> skill add-point button (2 frames: left=disabled, right=enabled).
- `ui_slot.png`    -> inventory + equip slot background.
- `icon_meso.png`  -> meso coin icon (via drawItemIcon('meso')).
- `ui_cursor.png`  -> custom cursor via `css/style.css` (#game canvas).

### Green slime color fix
- `scripts/recolor_slime.py` hue-shifts the slime art from purple to green
  (the monster is named "green slime"). Recolored in place:
  - `assets/sprites/mob_bubbling.png`
  - `assets/sprites/monsters/anim/mob_slime_idle.png`
  - `assets/sprites/monsters/anim/mob_slime_hit.png`
  Re-run with `py scripts/recolor_slime.py [degrees]` (default -160).

### Assets present but intentionally NOT wired
- `assets/ui/ui_bar_hp.png`, `ui_bar_mp.png`, `ui_bar_exp.png`: these are solid
  pre-rendered bars, but the HUD bars are dynamic-fill (ratio + gloss + tick
  marks + icon badge) and the procedural version looks better than a clipped
  solid bar. Left on the procedural bars to avoid a visual regression. Can wire
  as a clipped fill on request.

### Verification
- Smoke test: 58 passed, 0 failed (added checks for ui_panel / ui_slot /
  ui_titlebar / icon_meso load + item-icon load).
- Headless browser preview of all three windows (inventory / skill / character)
  confirms panel skin, slots, item icons, and + buttons render correctly; meadow
  confirms the slime is now green and the HUD meso icon loads.

### Nothing missing
- All item ids (85/85) have icons; all referenced UI files exist; per-class hero
  PNGs (6), weapon PNGs, monster sheets, projectile PNGs, impact/explosion FX all
  present. No missing-asset gaps found in this pass.

## Gameplay Pass (Claude, 2026-06-14) + NEW ASSET REQUESTS

Added gameplay systems requested by the user. All new art has a procedural
fallback, so the game runs without the PNGs; drop a matching file to upgrade.

### New systems wired
- Hold-Z continuous pickup (auto-grabs nearby drops while Z is held).
- Pet system: every player starts with one pet (`Game.pet`). It follows the
  hero and periodically auto-attacks a nearby monster for ~30% of player ATK.
- Inventory tabs: 全部 / 消耗 / 裝備 / 材料 (All / Use / Equip / Material).
- Expandable inventory: starts 24 slots, up to `CONFIG.INV_MAX` (36); locked
  slots show a lock icon; bought from the shop.
- Merchant NPC on every map (`map.npc`, on a small platform near the entrance).
  Press Up next to it to open the shop.
- Shop with 3 tabs: 購買 (buy curated consumables), 賣出 (sell any item at 60%),
  背包格 (buy +4 inventory slots, cost scales 800 * (n+1)).

### NEW ASSET REQUESTS (please produce; ASCII filenames below)

1) BETTER ITEM ICONS (current ones are too plain)
   - Path: `assets/ui/items/<itemId>.png`, 32x32 (or 64x64), transparent.
   - These are already wired and override the procedural icons. Replace the
     85 existing flat-gem icons with detailed, MapleStory-style icons.
   - One file per item id. Full id list is in `js/data/items.js` (keys of
     ItemDB). Examples: `redPotion.png`, `dragonSlayer.png`, `arcaneStaff.png`,
     `dragonHelm.png`, `powerRing.png`, `snailShell.png`, `dragonScale.png`.
   - Style guidance: clear silhouette, rarity-tinted border optional, readable
     at 32px, consistent lighting (top-left), drop shadow optional.
   - Meso coin icon: `assets/ui/icon_meso.png` (32x32).

2) CLIMBING / ROPE POSE (per class)
   - Path: `assets/sprites/player/hero-<job>-climb.png` where job is one of
     warrior / magician / archer / thief / pirate (warrior may reuse adventurer).
   - Single static back-view climbing pose, ~220x260, facing the rope, arms up
     gripping. Engine auto-uses it while climbing; otherwise it reuses the normal
     standing hero and just rotates it.
   - (Optional) a rope/ladder tile is already drawn procedurally; if you want a
     custom rope sprite, say so and I will add a hook.

3) PET ART ("Baroque"-style companion the user described)
   - Path: `assets/sprites/pet/pet-default.png`, single static sprite, ~64x64,
     facing right, transparent. Engine flips / bobs / lunges it on attack.
   - Current placeholder is a small round orange winged creature (procedural).
   - For more pet types later: `pet-<type>.png` and set the type in
     `new Pet('<type>')` (currently always 'default').

4) MERCHANT NPC ART
   - Path: `assets/sprites/npc/npc-merchant.png`, single static sprite, ~?x74,
     facing right, transparent. Engine adds the floating "Up = shop" bubble.
   - Current placeholder is a procedural hooded merchant.

5) (Optional) SHOP / TAB UI ART
   - Tabs and shop rows are procedural (match the panel skin). If you want
     dedicated tab button art or a shopkeeper portrait, provide specs and I will
     wire them.

### Verification
- `node tests\smoke.test.js` -> 65 passed, 0 failed (added checks for hold-Z
  pickup, pet auto-attack, inventory expand cap, shop open/draw, plus the UI /
  item-icon load checks from the previous pass).
- Headless preview confirms: inventory tabs + locked slots, shop buy/sell/expand
  tabs, merchant NPC with bubble, pet following the hero, green slime fixed.

## New Gameplay Asset Production Pass (Codex, 2026-06-14)

Completed the "NEW ASSET REQUESTS" listed above. The runtime hooks were already
present, so this pass focused on producing correctly named PNG assets and adding
regression coverage.

### Assets produced

- Rebuilt all item icons:
  - Path: `assets/ui/items/<itemId>.png`
  - Count: 85 item icons, matching the keys in `js/data/items.js`
  - Size: 32x32 transparent PNG
  - Style: more detailed item silhouettes by category: potions, scrolls,
    weapons, armor slots, accessories, and named materials.
- Rebuilt meso icon:
  - Path: `assets/ui/icon_meso.png`
  - Size: 32x32 transparent PNG
- Added climb poses:
  - `assets/sprites/player/hero-warrior-climb.png`
  - `assets/sprites/player/hero-adventurer-climb.png`
  - `assets/sprites/player/hero-magician-climb.png`
  - `assets/sprites/player/hero-archer-climb.png`
  - `assets/sprites/player/hero-thief-climb.png`
  - `assets/sprites/player/hero-pirate-climb.png`
  - Each is a back-view climbing pose with arms raised for the existing
    `hero-<job>-climb.png` hook.
- Added pet art:
  - Path: `assets/sprites/pet/pet-default.png`
  - Baroque-style small red companion creature, transparent PNG.
- Added merchant NPC art:
  - Path: `assets/sprites/npc/npc-merchant.png`
  - Hooded travelling merchant sprite, transparent PNG.

### New script

Added:

```powershell
py scripts\generate_new_gameplay_assets.py <raw-sheet.png>
```

Script behavior:

- Rebuilds all item icons from `js/data/items.js`.
- Rebuilds `assets/ui/icon_meso.png`.
- If a raw magenta-background sprite sheet path is provided, splits it into:
  - hero climb sprites
  - `pet-default.png`
  - `npc-merchant.png`

The raw image_gen sheet used for this pass was:

`C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e7a0d73e08191be77f11d0241bb0c.png`

Keep that generated original in place; the project only uses the processed PNGs
under `assets/`.

### Smoke test additions

`tests/smoke.test.js` now also checks these hooks:

- `assets/ui/items/redPotion.png`
- `assets/sprites/player/hero-warrior-climb-sheet.png`
- `assets/sprites/pet/pet-default.png`
- `assets/sprites/npc/npc-merchant.png`

Latest verification:

```powershell
node tests\smoke.test.js
```

Result:

```text
Smoke test result: 69 passed, 0 failed
```

## Climb Animation Upgrade (Codex, 2026-06-14)

The single climb pose was not enough to feel like climbing. This pass upgrades
climbing to 6-frame per-class animation sheets while keeping the old single PNGs
as fallback.

### Assets produced

- 6 horizontal-frame climb sheets:
  - `assets/sprites/player/hero-warrior-climb-sheet.png`
  - `assets/sprites/player/hero-adventurer-climb-sheet.png`
  - `assets/sprites/player/hero-magician-climb-sheet.png`
  - `assets/sprites/player/hero-archer-climb-sheet.png`
  - `assets/sprites/player/hero-thief-climb-sheet.png`
  - `assets/sprites/player/hero-pirate-climb-sheet.png`
- 36 individual frame PNGs:
  - `assets/sprites/player/hero-<job>-climb-1.png` through
    `hero-<job>-climb-6.png`
- The old single-frame hook files still exist:
  - `assets/sprites/player/hero-<job>-climb.png`
  - These are now frame 1 fallback images.

### New script

Added:

```powershell
py scripts\split_climb_animation_sheets.py job=raw.png ...
```

The script:

- Takes one or more `job=raw.png` arguments.
- Expects each raw image to be a `1x6` magenta-background climb sheet.
- Chroma-keys the magenta background.
- Trims long rope-only margins so the hero does not shrink in-game.
- Outputs a 6-frame sheet at 220x260 per frame.
- Also writes individual frame PNGs and the single-frame fallback.
- Copies warrior output to adventurer output for compatibility.

### Runtime change

`js/sprites.js _drawPlayerAsset()` now prefers:

`assets/sprites/player/hero-<job>-climb-sheet.png`

while `p.climbing` is true. It plays 6 frames using `p.animT`.

Fallback order:

1. `hero-<job>-climb-sheet.png`
2. `hero-<job>-climb.png`
3. normal `hero-<job>.png`
4. `hero-adventurer.png`

The smoke test now checks:

- `assets/sprites/player/hero-warrior-climb-sheet.png`

Latest verification:

```powershell
node tests\smoke.test.js
```

Result:

```text
Smoke test result: 69 passed, 0 failed
```

## Recommended Next Steps

The new animation sheets are functional and integrated, but most are generated from static PNGs. Good follow-up work:

- Replace high-value monsters with hand-authored or image-generated idle/walk/attack/death sheets.
- Add separate monster attack sheets and wire them to boss states.
- Add weapon-specific element trails instead of the shared swing treatment.
- Add projectile loop sheets, not just static projectile PNGs.
- Add skill-specific impact style selection for every skill in `js/data/skills.js`.
- Add a small visual preview page for browsing all sprite sheets.

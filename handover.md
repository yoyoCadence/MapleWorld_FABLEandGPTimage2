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

## ITEM ICON SPEC REQUEST (user: current icons too plain) - 85 icons

The procedural / current item icons look too plain. Please produce detailed,
MapleStory-style icons. They are ALREADY wired: drop a PNG at the path below and
it auto-replaces the icon in inventory / equip / shop / HUD.

- Path / name : `assets/ui/items/<itemId>.png` (exact id, case-sensitive)
- Size        : 64x64 master (will be drawn down to ~40px in slots; 32x32 also OK)
- Format      : PNG, transparent background (no opaque tile behind the item)
- Style       : clear readable silhouette at 32px; top-left light source; soft
                drop shadow; optional rarity rim (white/green/blue/purple/gold).
- Meso coin   : `assets/ui/icon_meso.png` (32x32) - gold coin.
- The Chinese display name + stats for each id are in `js/data/items.js` (ItemDB).
  Use them to decide what each icon depicts.

TOTAL = 85 icons. Counts by category:

### Consumables - 8 (icon_meso not counted)
redPotion, orangePotion, whitePotion, bluePotion, manaElixir, elixir,
powerElixir, returnScroll
  - Potions: glass bottle, liquid color by name (red/orange/white/blue/purple/gold).
  - returnScroll: a rolled parchment scroll.

### Materials - 12 (crafting drops; gem/ore/part look)
snailShell, slimeGel, mushSpore, hardLeather, crystalShard, iceShard, fireOre,
boneFrag, darkEssence, dragonScale, goldOre, mapleLeafMat

### Weapons - 32 (shape MUST match weapon type in parentheses)
- sword: woodSword, ironSword, mapleSword, kingSword, darkBlade
- axe:   battleAxe, dragonSlayer
- mace:  warMace
- wand:  beginnerWand, mapleWand
- staff: crystalStaff, flameStaff, arcaneStaff, voidStaff
- bow:   beginnerBow, hunterBow, mapleBow, windBow, phoenixBow
- crossbow: stormCrossbow
- dagger: beginnerDagger, steelDagger, mapleDagger, venomDagger
- claw:  shadowClaw, darkClaw
- knuckle: beginnerKnuckle, ironKnuckle, mapleKnuckle, krakenKnuckle
- gun:   pirateGun, cannonGun
  - Tier hint by name: beginner/wood < iron/steel/hunter < maple < element/storm
    < king/dragon/dark/void/phoenix/kraken (legendary - add glow/fx).

### Armor + Accessories - 33 (shape MUST match the slot in brackets)
- hat:     leafHat, ironHelm, wizardHat, kingCrown, dragonHelm
- top:     travelTop, ironArmor, mageRobe, dragonMail
- bottom:  clothPants, ironGreaves, dragonGreaves
- shoes:   strawShoes, leatherBoots, windBoots, dragonBoots
- gloves:  clothGloves, battleGloves, dragonGloves
- cape:    travelCape, mapleCape, dragonCape
- shield:  woodShield, ironShield, dragonShield
- earring: jadeEarring, rubyEarring
- ring:    powerRing, dragonRing
- pendant: moonPendant, dragonPendant
- belt:    leatherBelt, dragonBelt
  - "dragon*" set is the top tier (red dragon-scale theme); "king*" is gold.

If you also produce a matching weapon in-hand sprite, that is a separate file:
`assets/sprites/weapons/weapon_<itemId>.png` (vertical, blade up). Item icon and
in-hand sprite are independent.

## Image2 Item Icon Production Pass (Codex, 2026-06-14)

Completed the item icon request above using built-in image generation / image2
contact sheets. The final icons are generated artwork, not procedural geometry.
The only local processing was chroma-key removal, equal-cell cutting, fitting,
and writing PNG files to the already-wired runtime paths.

### Assets produced

- 85 item icons:
  - Path: `assets/ui/items/<itemId>.png`
  - Size: `64x64`
  - Format: transparent `RGBA` PNG
  - Coverage: every key in `js/data/items.js`
- Meso coin:
  - Path: `assets/ui/icon_meso.png`
  - Size: `32x32`
  - Format: transparent `RGBA` PNG
- Manifest:
  - Path: `assets/ui/item-icon-manifest.json`
  - Records the sheet groups and output file list.

### Image2 sheet groups

The image2 prompts were split into six contact sheets so each icon had enough
visual detail:

- `consumables`: red/orange/white/blue potions, mana elixir, elixir,
  power elixir, return scroll, meso coin.
- `materials`: snail shell, slime gel, mushroom spores, leather, crystals,
  ores, bone, dark essence, dragon scale, maple leaf material.
- `weapons_a`: warrior and magician weapons plus beginner/hunter bows.
- `weapons_b`: advanced bows, dagger/claw/knuckle/gun weapons.
- `armor_a`: hats, tops, bottoms, shoes, gloves, travel cape.
- `armor_b`: capes, shields, earrings, rings, pendants, belts.

Raw image2 outputs used for the current cut:

```text
consumables = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e904e22f881918477ad9205438d29.png
materials   = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e90b0c56081918ab7123a89b57ce2.png
weapons_a   = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e9114a2a481919ffe7a52fb6afaef.png
weapons_b   = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e9186d52c819196d128076ed8fd0f.png
armor_a     = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e91f50fe48191bf256b0bf93e055a.png
armor_b     = C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e925c3c148191bd961b7675f7e9ee.png
```

Keep those originals in place. The game only consumes the processed PNGs under
`assets/ui/`.

### New script

Added:

```powershell
py scripts\split_item_icon_contact_sheets.py group=raw.png ...
```

Supported group names:

- `consumables`
- `materials`
- `weapons_a`
- `weapons_b`
- `armor_a`
- `armor_b`

Example rerun command:

```powershell
py scripts\split_item_icon_contact_sheets.py consumables=<raw.png> materials=<raw.png> weapons_a=<raw.png> weapons_b=<raw.png> armor_a=<raw.png> armor_b=<raw.png>
```

### Verification

Checked:

- `assets/ui/items/*.png` count is 85.
- Every item icon is `64x64 RGBA`.
- `assets/ui/icon_meso.png` is `32x32 RGBA`.
- Alpha coverage sanity check found no empty or fully opaque icons.
- A temporary visual preview contact sheet was created for inspection and then
  deleted.

Latest smoke test:

```powershell
node tests\smoke.test.js
```

Result:

```text
Smoke test result: 72 passed, 0 failed
```

## RPG Systems Pass (Claude, 2026-06-14): quests / village / crafting / BGM

Added four systems. New data file: `js/data/quests.js` (NpcDB, QuestDB, CraftDB).

### Village + NPCs
- Maps now use `map.npcs = [{id,x,y}]`. Every map has a merchant on a safe
  floating platform. The town (`town`) also has elder / hunter / herbalist /
  blacksmith. Press Up next to an NPC to interact (shop / craft / dialogue by type).
- NPC art: `assets/sprites/npc/<sprite>.png` per NpcDB entry. Procedural fallback
  is a colored merchant. See asset request below.

### Quests
- 8 quests chained across the 4 bosses. Kill quests count via
  `Player.onKill(type)` (hooked in `Game.onMonsterDeath`); collect quests check
  inventory at turn-in. HUD shows an active-quest tracker (top-left).
- Quest state saved in the player save (`quests`).

### Crafting
- Blacksmith craft window: 8 recipes (materials + meso -> item). `Player.craft(id)`.

### BGM (js/sound.js)
- Procedural per-theme background music (WebAudio), starts on first map after a
  user gesture; M key mutes everything (SFX + BGM).
- Real audio hook: drop `assets/audio/bgm_<theme>.mp3` (themes: meadow, forest,
  cave, altar, snow, lava, castle) and it auto-plays instead of the synth.

### NEW ASSET REQUESTS

1) NPC sprites - `assets/sprites/npc/<sprite>.png` (single static, facing right,
   ~?x74, transparent). Needed (merchant already exists):
   - `npc-blacksmith.png`  (gruff smith, apron, hammer)
   - `npc-elder.png`       (village elder, robe, white beard)
   - `npc-hunter.png`      (ranger, bow on back, green)
   - `npc-herbalist.png`   (young herbalist girl, basket, pink)
   (Names/colors are in `js/data/quests.js` NpcDB.)

2) BGM audio - `assets/audio/bgm_<theme>.mp3` x7 (meadow, forest, cave, altar,
   snow, lava, castle). Looping tracks; ~0.4 volume in-game. Optional - the
   synth BGM plays until these exist.

### Verification
- `node tests\smoke.test.js` -> 83 passed, 0 failed (added quest accept/complete,
  collect-quest material consumption, crafting success + insufficient-material,
  craft/dialogue window draw, town npc count).
- Headless preview confirms: town with 5 NPCs + name plates + interaction bubbles,
  dialogue window with quest list/accept/complete, craft window with recipes, and
  the HUD quest tracker.

## NPC + BGM Asset Fill Pass (Codex, 2026-06-14)

Filled the new RPG-system asset gaps from the previous section.

### NPC sprites

Created these image2-generated NPC sprites and exported them as transparent PNGs:

- `assets/sprites/npc/npc-blacksmith.png`
- `assets/sprites/npc/npc-elder.png`
- `assets/sprites/npc/npc-hunter.png`
- `assets/sprites/npc/npc-herbalist.png`

Source image2 sheet used for the split:

```text
C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e9e244a0881918a35e34b9a00ae9c.png
```

Rebuild command:

```powershell
py scripts\split_npc_contact_sheet.py "C:\Users\memor\.codex\generated_images\019ec3d4-a43f-7b30-ad38-da5b15fb37c5\ig_026b3f84c90619d9016a2e9e244a0881918a35e34b9a00ae9c.png"
```

Notes:

- Output canvas is `120x180 RGBA`, transparent, bottom-aligned.
- Runtime still draws NPCs at in-game height ~74px via `Sprites.drawNpc`.
- Smoke test now draws merchant + blacksmith + elder + hunter + herbalist and
  verifies the corresponding sprite paths are requested.

### BGM audio fallback

Created 7 lightweight loopable WAV tracks:

- `assets/audio/bgm_meadow.wav`
- `assets/audio/bgm_forest.wav`
- `assets/audio/bgm_cave.wav`
- `assets/audio/bgm_altar.wav`
- `assets/audio/bgm_snow.wav`
- `assets/audio/bgm_lava.wav`
- `assets/audio/bgm_castle.wav`

Rebuild command:

```powershell
py scripts\generate_bgm_assets.py
```

Implementation note:

- `js/sound.js` now tries `assets/audio/bgm_<theme>.mp3` first and falls back
  to `assets/audio/bgm_<theme>.wav`.
- MP3 files were not generated because this Windows environment has no `ffmpeg`
  or `lame`, and downloading `imageio-ffmpeg` failed with a local SSL certificate
  verification error.
- If a future agent has an MP3 encoder, export the same 7 filenames as
  `bgm_<theme>.mp3`; no code change is needed because MP3 is already preferred.

## Recommended Next Steps

The new animation sheets are functional and integrated, but most are generated from static PNGs. Good follow-up work:

- Replace high-value monsters with hand-authored or image-generated idle/walk/attack/death sheets.
- Add separate monster attack sheets and wire them to boss states.
- Add weapon-specific element trails instead of the shared swing treatment.
- Add projectile loop sheets, not just static projectile PNGs.
- Add skill-specific impact style selection for every skill in `js/data/skills.js`.
- Add a small visual preview page for browsing all sprite sheets.

## UX / Systems Pass (2026-06-14)

This pass added 14 gameplay/UX features requested by the player. All are wired and
covered by `node tests/smoke.test.js` (99 checks passing). No NEW art assets are
required by this pass -- the previously delivered NPC PNGs and BGM WAVs are now
fully integrated.

What changed (no assets needed):

- Cache-busting: every <script> in index.html now has `?v=<BUILD>`, and dynamic
  asset loads (sprites/sound) append `?v=<BUILD>` too. BUILD lives in js/config.js.
  IMPORTANT: when you ship an update, bump BUILD in js/config.js AND the `?v=`
  query strings in index.html (keep both identical) so players never get stale cache.
  There is also a "Reload latest" button in the in-game Settings page.
- Random equipment stats: every dropped/crafted/quest/bought equip rolls stats in
  a range with 4 rarity tiers (normal/fine/rare/legendary). Inventory shows a
  colored border for fine+; tooltips show the rolled values and the +/- difference
  vs the currently equipped item. See `rollEquip`/`statVal` in js/data/items.js.
- Multi-slot saves (3 slots) -> title now goes Title -> Slot Select -> (empty slot
  picks a class) -> play. Settings page can return to title to switch character or
  delete a save (with confirm). Legacy single-save is auto-migrated to slot 0.
- Minimap top-right (click to enlarge), green EXP bar with %, draggable windows,
  customizable consumable hotkeys (1/2/3), sell confirmation window, collapsible
  quest tracker, basic per-job weapons sold in shop.

Optional future art (still all have procedural/empty fallbacks, nothing is broken):

- bgm_<theme>.mp3 x7 (MP3 is preferred over the existing WAVs if provided).
- Hand-authored monster/skill sheets as noted in "Recommended Next Steps" above.

## Asset Spec Request -- Animation / Effects / Skill Icons (2026-06-15)

Player walking currently reuses a single static hero PNG with a small bob, so it
reads as "hopping". The code now auto-loads a dedicated WALK SHEET when present,
and every skill / class effect can be given its own art. None of these block play
(all have procedural fallbacks), but they are the biggest visual upgrades left.

All sheets: horizontal strip, equal-width frames, transparent background (corner
alpha 0), trimmed consistently so the character/effect does not jitter between
frames. PNG, sRGB.

### 1. Character WALK animation sheets (fixes the "hopping" look)
Path: assets/sprites/player/hero-<job>-walk-sheet.png   (6 frames, left-to-right)
  jobs: warrior, magician, archer, thief, pirate
Frame size approx 80x96 (same proportion as existing hero-<job>.png). Side view,
facing RIGHT (engine mirrors for left). A natural 6-frame walk cycle: contact ->
pass -> contact, legs alternating, only a few px vertical travel (NOT a jump).
Code reads it at ~10 fps; falls back to the static hero PNG if missing.

### 2. Per-class / per-weapon MELEE swing effects (stop everyone swinging a sword)
Today all melee classes share one slash arc. Give each weapon family its own:
Path: assets/sprites/fx/swing/<style>-sheet.png   (5-6 frames, ~96x96, additive-friendly)
  - sword   : wide bright slash arc (current style is fine as the sword one)
  - axe     : heavier, thicker arc
  - mace    : blunt shock/dust burst
  - dagger  : short fast double-slit (thief)
  - claw    : 3 parallel claw streaks (thief)
  - knuckle : circular fist impact / shock ring (pirate punch)
Mapping is by the equipped weapon's wtype (see js/data/items.js WTYPE_NAMES).

### 3. PROJECTILE sprites (per style; e.g. cannon should be a cannonball)
Path: assets/sprites/proj/<style>.png  (single sprite, ~40x20, pointing RIGHT)
 and optional trail sheet assets/sprites/fx/proj/<style>-sheet.png (4-6 frames).
Styles in use: magic, arrow, star, bullet, energy, fire, ice, arcane.
  - bullet : metal cannonball + muzzle spark (pirate cannonBlast / cannonBarrage)
  - star   : steel throwing star/dart (thief luckySeven / tripleThrow)
  - arrow  : feathered arrow (archer)
  - fire   : flaming orb (mage fireball / phoenix)
  - ice    : ice shard (mage iceSpike / frostNova)
  - energy : blue energy wave (warrior energyWave)
  - arcane : purple arcane bolt (mage arcaneBlast)
  - magic  : generic mage basic bolt

### 4. SKILL ICONs (shown on the skill bar + skill window)
Path: assets/ui/skills/<skillId>.png   64x64, transparent, MapleStory-ish gem/badge.
40 skill ids (5 jobs x 8). Missing icons fall back to a colored letter badge.
 warrior : powerStrike spinSlash energyWave heal rage groundSmash crusherCombo heroWill
 magician: fireball iceSpike thunderBolt healAura frostNova magicGuard meteor arcaneBlast
 archer  : powerShot arrowRain pierceArrow eagleEye tripleShot evasion meteorArrow phoenixStrike
 thief   : luckySeven doubleStab shadowFlurry hasteBuff tripleThrow smokeBomb assassinate shadowStorm
 pirate  : knucklePunch whirlKick cannonBlast battleRage dragonStrike cannonBarrage octopus fistFury

### 5. PET sprites (pet shop sells these)
Path: assets/sprites/pet/pet-<kind>.png   (~48x48, side view facing RIGHT)
  - pet-pig.png  (item petPig,  "粉紅小豬")
  - pet-fox.png  (item petFox,  "九尾小狐")
Existing pet-default.png stays as the starter pet. Missing -> procedural fallback.

Naming is the contract: drop a correctly-named file in the path and it auto-loads
(cache-busted by ?v=BUILD), no code change needed.

# 🎨 MapleWorld 素材需求規格（給美術 / AI 出圖）

這份文件列出遊戲目前**所有可替換的美術素材**與精確規格。
**重點：遊戲現在沒有這些素材也能完整遊玩**（全部有程序化暫代）。你只要把符合下列「檔名 + 路徑」的 PNG 丟進對應資料夾，遊戲**自動套用**，不需改任何程式碼。

> 製作完直接覆蓋／新增到 `assets/...` 對應路徑即可。檔名要完全一致（大小寫敏感）。

> **目前進度（2026-06-14）**：角色 / 武器 / 怪物（含 idle/hit 動畫表）/ 背景 / UI 框 / 85 道具圖示 /
> 投射物 / 命中爆炸特效 / **寵物 `pet/pet-default.png`** / **商人 `npc/npc-merchant.png`** /
> **攀爬 6 格動畫表 `player/hero-<job>-climb-sheet.png`** 皆已產出並接線運作。
> 後續以「覆蓋同名檔」升級即可。各回合詳情與檔名規格另見 [`../handover.md`](../handover.md)。

---

## 0. 通用規格（所有素材共通）

| 項目 | 規格 |
|------|------|
| 格式 | **PNG**（含 alpha 透明通道） |
| 色彩 | sRGB，建議卡通賽璐璐風（粗描邊 + 平塗 + 簡單陰影），貼合現有美術 |
| 透明 | 角色 / 怪物 / 武器 / 道具 / 特效一律**去背**（背景透明） |
| 去鋸齒 | 邊緣乾淨，不要殘留白邊 |
| 命名 | 全部小寫 + 既有命名規則；地圖/怪物/武器用文件中指定的 id |
| 解析度 | 依各節「建議尺寸」，可 2x 出圖（引擎會等比縮放） |

資料夾結構：
```
assets/
├── backgrounds/          # 地圖背景（每張地圖一張）
├── sprites/
│   ├── player/           # 角色立繪（每職業一張）
│   ├── weapons/          # 武器（每把一張）
│   ├── fx/proj/          # 投射物 / 招式彈道
│   ├── fx/slash/         # 近戰斬擊動畫（已存在，可重繪）
│   └── mob_*.png         # 怪物（每種一張）
└── ui/                   # 介面皮膚（選用）
```

---

## 1. 地圖背景 `assets/backgrounds/`（共 25 張）

- 每張地圖會優先載入 **`<地圖id>-bg.png`**；找不到才回退到「主題共用背景」。
- 所以你可以**為每張地圖畫專屬背景**（推薦，符合「每張地圖不同素材」）；或先只畫 7 張主題背景共用。
- **建議尺寸：1920 × 700 px**（橫向，地圖會橫向捲動；引擎以高度為準等比裁切）。畫成可左右無縫或邊緣淡出皆可。
- 風格：遠景＋中景＋天空的多層次插畫；地面區（畫面下方約 140px）會被平台蓋住，可留給地形。

| 地圖 id（檔名 `<id>-bg.png`） | 中文名 | 主題 | 目前回退共用背景 |
|------|------|------|------|
| `meadow` | 楓葉草原 | meadow | meadow-bg.png ✅已有 |
| `forest` | 蘑菇森林 | forest | forest-bg.png ✅已有 |
| `cave` | 水晶洞窟 | cave | cave-bg.png ✅已有 |
| `altar` | 王者祭壇 | altar | shrine-bg.png ✅已有 |
| `town` | 楓葉鎮（安全城鎮，無怪） | meadow | meadow-bg.png |
| `meadowHill` | 草原丘陵 | meadow | meadow-bg.png |
| `snailHill` | 蝸牛山丘 | meadow | meadow-bg.png |
| `deepForest` | 幽森深處 | forest | forest-bg.png |
| `antTunnel` | 螞蟻隧道 | cave | cave-bg.png |
| `crystalDepths` | 水晶深淵 | cave | cave-bg.png |
| `snowField` | 雪花平原 | snow | snow-bg.png ✅已有 |
| `snowPeak` | 冰封山頂 | snow | snow-bg.png |
| `iceCave` | 寒冰洞窟 | snow | snow-bg.png |
| `frostValley` | 霜凍幽谷 | snow | snow-bg.png |
| `yetiLair` | 雪人巢穴（Boss：雪人王） | snow | snow-bg.png |
| `lavaPath` | 火焰之路 | lava | lava-bg.png ✅已有 |
| `lavaBridge` | 熔岩之橋 | lava | lava-bg.png |
| `lavaCore` | 熔岩核心 | lava | lava-bg.png |
| `emberCave` | 餘燼洞窟 | lava | lava-bg.png |
| `flameAltar` | 炎魔祭壇（Boss：炎魔） | lava | lava-bg.png |
| `castleGate` | 古城入口 | castle | castle-bg.png ✅已有 |
| `castleHall` | 古城大廳 | castle | castle-bg.png |
| `castleDungeon` | 古城地牢 | castle | castle-bg.png |
| `castleTower` | 暗黑高塔 | castle | castle-bg.png |
| `throneRoom` | 王座之間（Boss：黑暗領主） | castle | castle-bg.png |

> 想擴更多地圖：在 `js/data/maps.js` 仿 `genField(...)` 加一筆並接到 `MAP_CHAIN`，再丟 `<新id>-bg.png` 即可。需要我加可直接說。

---

## 2. 角色立繪 `assets/sprites/player/`（共 5 張，每職業一張）

- 引擎以**單張站立立繪**呈現，並用程式做翻面/上下浮動/前傾/攻擊傾斜等動畫（**不需逐格動畫圖**）。
- **建議尺寸：約 220 × 260 px**，面朝**右**（引擎會自動水平翻面）。腳底對齊圖片底部中央。
- 風格：2.5～3 頭身 Q 版冒險者，描邊清楚，配色呼應職業主題色。

| 檔名 | 職業 | 主題色 | 設計提示 |
|------|------|------|------|
| `hero-adventurer.png` ✅已有 | 劍士（預設，缺其他職業時所有職業共用此圖） | 紅橘 #e8542f | 持劍、圍巾、戰術上衣 |
| `hero-warrior.png` | 劍士 | 紅橘 | 重甲、披風、英氣 |
| `hero-magician.png` | 法師 | 紫 #7a5cff | 尖頂巫師帽、長袍、法杖 |
| `hero-archer.png` | 弓箭手 | 綠 #3fae5a | 輕裝、背箭袋、綠斗篷 |
| `hero-thief.png` | 盜賊 | 紫 #9b59b6 | 兜帽、面巾、輕盈敏捷 |
| `hero-pirate.png` | 海盜 | 橘 #e67e22 | 海盜帽、拳套/火槍、豪邁 |

> 武器是**獨立疊圖**（見第 3 節），立繪可不畫武器，或畫一把通用武器當預設姿勢。

---

## 3. 武器 `assets/sprites/weapons/`（共 36 把）

- 每把武器一張 PNG，**同一張同時用於背包圖示與角色手持疊圖**。
- **建議尺寸：約 120 × 320 px（直幅）**，刀刃/槍口朝**上**，握把在下方中央。去背。
- 命名規則：除既有 4 把沿用底線命名外，其餘一律 **`weapon_<物品id>.png`**。

### 既有（可重繪覆蓋）
`weapon_wood_sword.png` `weapon_iron_sword.png` `weapon_maple_sword.png` `weapon_king_sword.png`

### 劍士（劍/斧/鈍器）
| 物品 id | 檔名 | 中文 | 類型 |
|---|---|---|---|
| battleAxe | `weapon_battleAxe.png` | 戰斧 | 斧 |
| warMace | `weapon_warMace.png` | 戰錘 | 鈍器 |
| dragonSlayer | `weapon_dragonSlayer.png` | 屠龍斧 | 斧 |
| darkBlade | `weapon_darkBlade.png` | 暗黑魔劍 | 劍 |

### 法師（短杖/長杖）
`weapon_beginnerWand.png`（見習魔杖）、`weapon_mapleWand.png`（楓葉魔杖）、`weapon_crystalStaff.png`（水晶法杖）、`weapon_flameStaff.png`（烈焰法杖）、`weapon_arcaneStaff.png`（秘術法杖）、`weapon_voidStaff.png`（虛空法杖）

### 弓箭手（弓/弩）
`weapon_beginnerBow.png`、`weapon_hunterBow.png`、`weapon_mapleBow.png`、`weapon_windBow.png`、`weapon_stormCrossbow.png`（弩）、`weapon_phoenixBow.png`

### 盜賊（短劍/拳爪）
`weapon_beginnerDagger.png`、`weapon_steelDagger.png`、`weapon_mapleDagger.png`、`weapon_shadowClaw.png`（拳爪）、`weapon_venomDagger.png`、`weapon_darkClaw.png`（拳爪）

### 海盜（拳套/火槍）
`weapon_beginnerKnuckle.png`、`weapon_ironKnuckle.png`、`weapon_mapleKnuckle.png`、`weapon_pirateGun.png`（火槍）、`weapon_cannonGun.png`（火槍）、`weapon_krakenKnuckle.png`

---

## 4. 怪物 `assets/sprites/`（每種一張 `mob_<type>.png`）

- 每種怪物一張站立 PNG，引擎做跳動/翻面/受擊閃白動畫。
- **建議尺寸：約怪物資料 w×h 的 1.6 倍**（小怪約 120×120、Boss 約 320×320），面朝右、去背、腳底對齊底部中央。

### 已有可重用（目前借用既有 PNG，建議畫專屬）
| type | 目前借用 | 想要的專屬檔名 |
|---|---|---|
| boar 野豬 | mob_pig.png | `mob_boar.png` |
| bat 魅影蝙蝠 | mob_bat.png ✅ | （可沿用） |
| eye 邪惡之眼 | mob_eye.png ✅ | （可沿用） |
| yeti 雪原雪人 | mob_yeti.png ✅ | （可沿用） |
| fireGoblin 火焰哥布林 | mob_goblin.png ✅ | `mob_fireGoblin.png` |
| drake 炎之龍人 | mob_drake.png ✅ | `mob_drake.png` |
| mummy 詛咒木乃伊 | mob_mummy.png ✅ | （可沿用） |

### 尚無專屬圖（目前用程序化變色暫代，請補）
| type | 中文 | 檔名 | 風格提示 |
|---|---|---|---|
| redSnail | 紅蝸牛 | `mob_redSnail.png` | 紅殼蝸牛 |
| spore | 菇寶寶 | `mob_spore.png` | 小菇怪 |
| iceSlime | 冰泡泡 | `mob_iceSlime.png` | 藍色冰史萊姆 |
| penguin | 冰原企鵝 | `mob_penguin.png` | Q 版企鵝 |
| snowman | 雪人怪 | `mob_snowman.png` | 雪球身體 |
| lavaSlime | 熔岩史萊姆 | `mob_lavaSlime.png` | 岩漿史萊姆 |
| magmaGolem | 熔岩魔像 | `mob_magmaGolem.png` | 岩漿石巨人 |
| zombie | 腐化殭屍 | `mob_zombie.png` | 綠皮殭屍 |
| skeleton | 骷髏戰士 | `mob_skeleton.png` | 持劍骷髏 |
| darkKnight | 黑暗騎士 | `mob_darkKnight.png` | 黑甲騎士 |

### Boss（大尺寸，約 320×320）
| type | 中文 | 檔名 |
|---|---|---|
| boss | 蘑菇王 | `mob_boss.png`（目前借 mob_darklord.png） |
| yetiKing | 雪人王 | `mob_yetiKing.png`（目前借 mob_yeti.png） |
| flameDrake | 炎魔 | `mob_flameDrake.png`（目前借 mob_drake.png） |
| darkLord | 黑暗領主 | `mob_darkLord.png`（目前借 mob_darklord.png） |

---

## 5. 招式 / 投射物特效

### 5a. 投射物彈道 `assets/sprites/fx/proj/`（7 種 style）
每種飛行彈道一張橫向 PNG（朝右，引擎依方向翻面；`star` 會旋轉）。**建議 64 × 64 px**，去背、可發光。

| 檔名 | 用途（哪些招式/普攻用到） |
|---|---|
| `energy.png` | 劍士能量波 |
| `fire.png` | 法師火球術 |
| `ice.png` | 法師寒冰刺 |
| `magic.png` | 法師普攻彈 |
| `arrow.png` | 弓箭手普攻 / 強力射擊 / 貫穿箭 |
| `star.png` | 盜賊幸運七飛鏢（旋轉） |
| `bullet.png` | 海盜加農砲彈 |

### 5b. 近戰斬擊動畫 `assets/sprites/fx/slash/sheet-transparent.png`（已存在，可重繪）
- 橫向 **4 格**精靈表（4 frames in a row），每格正方形，去背、發光。引擎自動播放 4 格。
- 用於普通近戰、強力斬等近戰命中特效。

### 5c.（選用，進階）每招專屬特效
目前範圍技（迴旋斬、箭雨、雷電、暗影亂舞、迴旋踢）與治療/增益是**程序化繪製**。若要每招專屬動畫圖，可再提需求，我會加對應載入點。建議格式：橫向精靈表 6～8 格、512×512/格、去背發光。需要的話跟我說要哪幾招。

---

## 6. 介面 UI `assets/ui/`（選用，想更接近楓之谷可補）

目前 HUD / 視窗 / 按鈕全部**程序化繪製**（鍍金奇幻風）。若要換成點陣 UI 皮膚，提供下列切片即可，我再接上載入點（**目前尚未接線，需要時告訴我**）：

| 檔名 | 用途 | 建議尺寸 |
|---|---|---|
| `ui_panel.png` | 視窗九宮格底框（含金邊） | 64×64（九宮 18px 邊） |
| `ui_titlebar.png` | 視窗標題列 | 高 28，可橫向延展 |
| `ui_btn_close.png` | 關閉鈕 | 24×24 |
| `ui_btn_plus.png` | 技能加點＋鈕（一般/可用兩態） | 28×28 ×2 |
| `ui_slot.png` | 背包/裝備格底 | 48×48 |
| `ui_bar_hp.png` / `ui_bar_mp.png` / `ui_bar_exp.png` | 能量條填充與外框 | 高 16，可橫向延展 |
| `ui_cursor.png` | 滑鼠游標 | 32×32 |
| `icon_meso.png` | 楓幣圖示 | 32×32 |

### 道具圖示（選用）
背包道具圖示目前皆程序化。若要專屬圖示，放 `assets/ui/items/<物品id>.png`（**目前尚未接線，需要時告訴我加上**），32×32 去背。涵蓋：
- 防具 / 飾品：帽子、上衣、下衣、鞋子、手套、披風、盾牌、耳環、戒指、項鍊、腰帶各階。
- 消耗品：紅/橘/白藥水、藍藥水、魔力靈液、楓葉聖水、全恢復聖水、返鄉卷軸。

---

## 7. 材料系統（掉落／製作原料）

新增 `type:'material'` 道具分類（目前掉落可收集，圖示為程序化寶石）。**製作配方與用途尚未定義，待你補**。
目前材料：蝸牛殼 `snailShell`、史萊姆膠 `slimeGel`、蘑菇孢子 `mushSpore`、堅韌皮革 `hardLeather`、水晶碎片 `crystalShard`、寒冰結晶 `iceShard`、火焰礦石 `fireOre`、骸骨碎片 `boneFrag`、黑暗精華 `darkEssence`、龍鱗 `dragonScale`、黃金礦石 `goldOre`、楓之葉 `mapleLeafMat`。

**請補充（給我規格我來實作）：**
1. 製作配方：哪些材料 + 多少數量 → 換哪件裝備 / 消耗品？
2. 強化系統？（吃材料提升裝備數值）卷軸成功率？
3. 採集點？（地圖上可採集的礦/草）
4. 是否需要材料專屬圖示（`assets/ui/items/<id>.png`，32×32）。

---

## 8. 音效 / 音樂（選用）

目前音效為 WebAudio 合成、無背景音樂。若要真實音檔，提供後我接上：
- BGM：每主題一首 `assets/audio/bgm_<theme>.mp3`（meadow/forest/cave/altar/snow/lava/castle）。
- SFX：攻擊、命中、技能、撿取、升級、傳送、Boss 等（清單可另列）。

---

## 優先順序建議
1. **角色立繪 5 張**（最有感）→ 2. **武器 36 把** → 3. **怪物專屬圖** → 4. **每地圖背景 25 張** → 5. 投射物 7 種 → 6. UI 皮膚 / 道具圖示 → 7. 音效音樂。

有任何一項做好就丟進對應資料夾測試即可；要新增地圖、招式專屬特效、UI 接線、材料配方，直接跟我說規格，我來接上程式。

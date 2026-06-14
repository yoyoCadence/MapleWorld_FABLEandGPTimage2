# 🍁 MapleWorld 可玩性擴充規劃（朝楓之谷最大化）

本文件規劃如何把目前的 MapleWorld 從「單一角色 + 4 地圖 + 6 怪 + 4 技能」擴充到接近楓之谷的規模。
原則：**資料驅動、程序化 fallback、零必需外部素材**——所有新內容沒有美術素材也能用程式畫出來玩，
等使用者補上 PNG 素材（見 [`assets/ASSET_REQUESTS.md`](assets/ASSET_REQUESTS.md)）後自動升級畫面。

---

## 一、現況盤點

| 系統 | 現況 | 架構位置 |
|------|------|----------|
| 地圖 | 4（草原→森林→洞窟→祭壇） | `js/data/maps.js` + `js/render.js`(THEMES) |
| 怪物 | 6（含 1 Boss） | `js/data/monsters.js` + `js/sprites.js`(`_m_*`) |
| 職業 | 無（單一勇士） | `js/entities/player.js` |
| 技能 | 4（全角色共用） | `js/data/skills.js` |
| 裝備欄位 | 4（武器/帽/衣/鞋） | `js/data/items.js`(EQUIP_SLOTS) |
| 道具 | 4 消耗品 + 13 裝備 | `js/data/items.js` |
| 等級上限 | 30 | `js/config.js` |

## 二、目標規模（分階段）

| 系統 | 目標 | 楓之谷對應 |
|------|------|-----------|
| 職業 | **5 大職業**（劍士/法師/弓箭手/盜賊/海盜），各 4 主動技 | 五轉職系統雛形 |
| 技能 | **20+ 招式**（每職 4）＋ buff/位移/多段類型 | 技能樹 |
| 地圖 | **13+ 張**，含主線 + 分支 + 新主題（雪原/熔岩/城堡） | 大陸地圖 |
| 怪物 | **20+ 種**，含各區小怪 + 3~4 區域 Boss | 怪物圖鑑 |
| 裝備欄位 | **12 欄位**（武器/帽/上衣/下衣/鞋/手套/披風/盾/耳環/戒指/項鍊/腰帶） | 角色裝備視窗 |
| 道具 | 多階消耗品 + **材料系統**（採集/合成原料） | 採集 / 製作 |
| 等級上限 | 100 | — |

## 三、各系統設計

### 1. 職業系統（headline feature）
- 新檔 `js/data/classes.js` 定義 `JobDB`，每職含：
  - `name / desc / color`：顯示與主題色。
  - `statMods {hp, mp, atk, def}`：對基礎屬性的乘數（劍士肉、法師高 MP/魔攻…）。
  - `basicType`：`'melee'` 或 `'projectile'`（遠程職普攻為投射物）。
  - `weaponType` + `startWeapon`：可用武器類型與起始武器。
  - `skills: [4 個技能 id]`：對應 C/V/B/A 四鍵。
- `Player` 新增 `job` 欄位（舊存檔預設劍士），屬性 getter 套用 `statMods`，
  普攻依 `basicType` 切換近戰/遠程，技能輪詢改用 `player.skillList()`。
- 新增 **選角畫面**（state `classSelect`）：新遊戲時左右選職業、Enter 確認。
- 存檔加入 `job`。

### 2. 技能系統
- `SkillDB` 擴充為 20+ 招式（保留劍士原 4 招，向下相容）。
- 新增技能 `type`：
  - `buff`：限時提升攻擊/防禦/移速（法師加持、海盜怒氣…）。
  - 既有 `melee / aoe / projectile / heal` 沿用並強化（多段、貫穿、爆風）。
- `Player` 新增 buff 容器，屬性 getter 疊加 buff 加成，`update()` 倒數到期。

### 3. 地圖系統
- `render.js` `THEMES` 新增 `snow / lava / castle`（背景 PNG 已存在），
  程序化天空/地形 fallback 走最接近的既有風格。
- `maps.js` 擴充到 13+ 張：主線延伸 + 分支區（每區 2~3 張）+ 各區終點 Boss 房。
- 連線維持單一傳送門進出，城鎮 `town` 作為樞紐（不刷怪、安全區）。

### 4. 怪物系統
- `monsters.js` 擴充到 20+ 種；每種可指定 `draw`（重用既有 `_m_*` 外形）+ `tint`（色相濾鏡）做變體。
- `sprites.js` `drawMonster` 加 `_m_generic` 安全 fallback（永不因缺繪製函式而崩潰）。
- 新增 3~4 區域 Boss（重用 Boss AI 框架，調整數值與招式節奏）。

### 5. 裝備 / 道具 / 材料
- `EQUIP_SLOTS` 擴為 12 欄位；`Player.equips` 與存檔相容（缺欄位補 null）。
- 武器加 `class` 限制與 `weaponType`（劍/鈍器/法杖/弓/弩/短劍/拳套/手槍…）。
- `drawItemIcon` 加各武器/防具類型的程序化圖示 + 未知類型的通用寶石 fallback。
- 多階防具（每欄位數階，需求等級遞增）。
- **材料系統**：新增 `type:'material'` 道具分類（怪物掉落原料、採集物），
  供日後製作/任務使用。具體材料清單由使用者後續補（見素材需求檔的「材料待補」段）。

## 四、實作順序與相容性

1. 規劃 + 素材需求文件（本檔 + ASSET_REQUESTS）。
2. 資料層擴充：classes / skills / items / monsters / maps（低風險、純資料）。
3. 引擎層串接：config / render / sprites / player / game / ui。
4. 更新 `tests/smoke.test.js` 與 `README.md`，確保全綠後提交。

**相容性守則**
- 劍士＝預設職業，技能 = 原 powerStrike/spinSlash/energyWave/heal，確保既有測試與手感不變。
- 所有新內容皆有程序化 fallback，缺 PNG 也能玩。
- 存檔版本提升（`mapleworld_save_v2`），舊檔不衝突。

## 五、後續可再擴充（roadmap，本次未必全做）
- 製作 / 強化 / 卷軸系統（吃材料）。
- 任務 NPC 與對話。
- 組隊 / 多人（需後端）。
- 二轉、技能樹分支、被動技能。
- 寵物、坐騎、稱號。

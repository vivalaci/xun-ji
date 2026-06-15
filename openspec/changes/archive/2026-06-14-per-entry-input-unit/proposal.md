# Proposal: per-entry-input-unit

## Why

日常训练中 kg 与 lb 器械可能同时出现，但用户有固定的"主单位"（看数的单位）。现在要在另一单位的器械上录入，必须去「我的-设置」切换全局单位（连带改变所有显示），录完再切回，很麻烦。需要在录入处提供"本次按另一单位输入"的便捷开关，存库仍恒为 kg。

## What Changes

- 新建/编辑训练页**每个动作**在标题行新增 `[kg][lb]` 单位段控，默认主单位（来自「我的-设置」）；不同动作可各自不同单位（贴合器械混用：本动作 kg、下个动作 lb）。
- 切换某动作单位：该动作重量按所选单位解读，**步进**随之变（kg±2.5 / lb±5），该动作已显示值**就地换算**展示（保持实际重量不变）。
- 保存时各动作按其单位换算为 kg 落库（恒 kg、完整精度）。**纯输入便利**：记录不保存原始单位，之后显示跟随主单位。
- **显示去浮点长尾**：lb↔kg 换算的显示统一 round；三大项/自定义曲线取整，体重曲线与明细保留 1 位。
- 全局「我的-设置」重量单位**保留**，语义=主单位（全程显示 + 录入默认）；本能力是其上的动作级覆盖。kg/lb 主用户体验对称。

## Capabilities

### New Capabilities

- `per-entry-input-unit`: 训练录入时的会话级输入单位覆盖——段控切换、显示换算、按所选单位存 kg；不改主单位与显示。

### Modified Capabilities

（无——`unit-settings` 的需求不变，仍管"主单位=显示+默认输入"；本能力在其上叠加会话覆盖，不修改其 spec 行为。）

## Impact

- `utils/unit.js`：新增 `toStoreFrom/toDisplayIn/stepFor`（显式单位换算，不依赖全局）；`toDisplay/toDisplayIn` round 到 1 位去浮点长尾。换算只在 unit.js（铁律 2）。
- `pages/workout/edit`：每个动作加 `unit` 字段 + 标题行段控；预填/载入/切换/保存/步进均按该动作 unit。
- `utils/chart.js` + `pages/curve` + `pages/exercise/detail`：曲线 `yDecimals`，lift 取整、body 保留 1 位。
- 范围仅训练录入与曲线显示；身体录入、列表、PR、日历逻辑不涉及（仅受 toDisplay round 影响，更干净）。
- 数据：无集合、无字段变更。

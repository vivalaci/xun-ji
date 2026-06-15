# Proposal: per-entry-input-unit

## Why

日常训练中 kg 与 lb 器械可能同时出现，但用户有固定的"主单位"（看数的单位）。现在要在另一单位的器械上录入，必须去「我的-设置」切换全局单位（连带改变所有显示），录完再切回，很麻烦。需要在录入处提供"本次按另一单位输入"的便捷开关，存库仍恒为 kg。

## What Changes

- 新建/编辑训练页新增**「本次输入单位」段控**（`[kg] [lb]`），默认高亮用户主单位（来自「我的-设置」），可临时切到另一单位。
- 切换后：该次录入的重量按所选单位解读，**步进**随之变（kg±2.5 / lb±5），已显示的重量值**就地换算**为新单位展示（保持所指实际重量不变）。
- 保存时按所选输入单位换算为 kg 落库（恒 kg、完整精度）。**纯输入便利**：记录不保存原始单位，之后显示仍跟随主单位。
- 全局「我的-设置」重量单位**保留**，语义明确为"主单位"（决定全程显示 + 录入默认单位）；本能力是其上的会话级覆盖。kg 主用户与 lb 主用户体验对称。

## Capabilities

### New Capabilities

- `per-entry-input-unit`: 训练录入时的会话级输入单位覆盖——段控切换、显示换算、按所选单位存 kg；不改主单位与显示。

### Modified Capabilities

（无——`unit-settings` 的需求不变，仍管"主单位=显示+默认输入"；本能力在其上叠加会话覆盖，不修改其 spec 行为。）

## Impact

- `utils/unit.js`：新增 `toStoreFrom(value, srcUnit)`、`toDisplayIn(kg, dstUnit)`、`stepFor(unit)`（不依赖全局设置的显式单位换算）；现有 `toStore/toDisplay/step` 不变（继续按主单位）。换算逻辑仍只在 unit.js（铁律 2）。
- `pages/workout/edit`：新增 `inputUnit` 状态（默认主单位）+ 段控；预填/载入按 inputUnit 显示；切换时就地换算；保存按 inputUnit 转 kg；步进用 `stepFor(inputUnit)`。
- 范围仅训练录入；身体录入、列表、曲线、PR、日历均不涉及。
- 数据：无集合、无字段变更。

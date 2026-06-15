# Design: per-entry-input-unit

## Context

`utils/unit.js` 是唯一换算层：`currentUnit()` 读全局设置（主单位），`toStore/toDisplay/step` 都按主单位工作，存库恒 kg。训练录入在 `pages/workout/edit`：选模板→预填（kg 经 `toDisplay` 显示）→步进录入（`this.data.step = unit.step()`）→保存（`unit.toStore`）。全局单位设置（unit-settings 能力）服务"主单位=显示+默认输入"，需保留以支持 lb 主用户的全程 lb 显示。

## Goals / Non-Goals

**Goals:**
- 录入时一键临时切换输入单位，免去去设置页全局切换再切回。
- kg 主 / lb 主用户体验对称。
- 换算只在 unit.js；存储恒 kg 不变。

**Non-Goals:**
- 不改主单位/显示逻辑（unit-settings 不动）。
- 不记忆每条记录的原始输入单位（纯输入便利）。
- 不做每组级单位（会话级一个开关）。
- 不涉及身体录入、列表、曲线、PR、日历。

## Decisions

### D1：unit.js 增加"显式单位"换算族，与"主单位"族并存
新增不依赖全局设置的纯换算：
- `toStoreFrom(value, srcUnit)`：`srcUnit==='lb' ? value*0.453592 : value`
- `toDisplayIn(kgValue, dstUnit)`：`dstUnit==='lb' ? round1(kg/0.453592) : kg`
- `stepFor(unit)`：`lb?5:2.5`
现有 `toStore/toDisplay/step/currentUnit/label` 保持不变（其它页面按主单位）。新族供录入页按"本次输入单位"显式换算。
- **被否方案**：把 `toStore` 改成读会话单位 —— 会污染所有调用方语义，破坏"主单位"族；并存更清晰。

### D2：录入页持 `inputUnit` 状态，默认主单位
`pages/workout/edit` data 加 `inputUnit`（onLoad 初始化为 `unit.currentUnit()`）。
- 预填/载入：每组重量由 kg `toDisplayIn(kg, inputUnit)` 显示。
- 步进：`this.data.step = stepFor(inputUnit)`。
- 段控切换 `onSwitchInputUnit(newUnit)`：遍历当前 `exercises[].sets[]`，把每个非空 weight 从 oldUnit 还原 kg 再表达为 newUnit（`toDisplayIn(toStoreFrom(w, old), new)`），更新 `inputUnit` 与 `step`。保证"看到的数值 = inputUnit"，避免预填/已输入值被错读。
- 保存：`weight: unit.toStoreFrom(s.weight, inputUnit)`（替换原 `toStore`）。

### D3：切换时就地换算是正确性要求，不是可选
若切换只改保存解读、不改显示，预填的 kg 显示值会被当作 lb 读，导致存错。故切换必须重新表达已显示值。来回切换的 round 漂移（±0.x）可接受（与全局单位切换同源问题）。

### D4：编辑既有训练时 inputUnit 同样默认主单位
既有记录存 kg，按主单位 `toDisplayIn` 展示；用户可再次切换输入单位录入。因不持久化原单位，重开按主单位显示，符合 D 的"纯便利"。

### D5：段控 UI 而非翻转勾选框
段控 `[kg][lb]` 永远直读、默认高亮主单位，kg/lb 主用户都无需心算"另一个单位"。放录入页基本信息区（日期/名称附近）。

## Risks / Trade-offs

- [来回切换的 round 漂移] 100kg→lb→kg 可能显示 100.0 附近 → 影响仅显示精度，存储用切换那刻的值换算；可接受。
- [用户切了单位忘了切回] 仅影响本次录入；下次新建默认仍主单位，无持久副作用。
- [空值组] weight 为空的组切换时跳过换算，保持空。

## Migration Plan

无数据迁移（纯录入交互 + unit.js 增函数）。旧记录不受影响。

## Open Questions

（无）

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

### D2：粒度=每个动作（真机反馈修正）
> 初版做成会话级（整页一个开关），真机走查发现与现实不符：kg/lb 器械（哑铃片/杠铃/壶铃）常按动作混用——本动作 kg、下个动作 lb。故改为**每个动作各自的单位**，段控置于动作标题行（动作名旁）。
- 每个 `exercises[i]` 持 `unit` 字段（仅录入态，不入库）；新增动作/预填/载入默认 `unit.currentUnit()`。
- 预填/载入：每组重量 `toDisplayIn(kg, ex.unit)` 显示。
- 步进：`stepValue` 用 `unit.stepFor(exercises[i].unit)`（不再用单一页面 step）。
- 段控切换 `onSwitchExerciseUnit(i, newUnit)`：仅遍历**该动作**各组非空 weight，`toDisplayIn(toStoreFrom(w, old), new)` 就地换算；更新 `ex.unit`。
- 保存：每动作 `weight: unit.toStoreFrom(s.weight, ex.unit)`。
- 未选每组级：每组一个单位切换会让组行过挤，且同一动作内通常用同一器械；动作级是匹配现实的最细实用粒度。

### D3：切换时就地换算是正确性要求，不是可选
若切换只改保存解读、不改显示，预填的 kg 显示值会被当作另一单位读，导致存错。故切换必须重新表达该动作已显示值。来回切换的 round 漂移（±0.x）可接受。

### D6：显示去浮点长尾（真机反馈）
> lb→kg 存完整精度（正确），但显示层未 round，曲线出现 60.010270551000005。
- `toDisplay`/`toDisplayIn` 统一 round 到 1 位（Number 自动去末尾 .0）。
- 三大项/自定义**曲线**取整：`chart.drawLineChart` 加 `yDecimals`（lift 传 0、body 传 1），曲线 `latest` lift 取整、body 保留 1 位。
- 体重曲线与录入/历史明细保留 1 位（半 kg 不丢）。存储完整精度不变。

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

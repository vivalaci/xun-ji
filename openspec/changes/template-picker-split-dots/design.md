## Context

承接 `calendar-split-palette`（迭代七）：日历配色已按系统分色族，色值真源在 `utils/calendar.js` 的 `TYPES`。该迭代还在日历下方加了 `LEGEND_GROUPS` 分组图例。本次把"颜色钥匙"从静态图例移到选模板行——更贴近使用场景。

现状关键点：
- 选模板在 `pages/workout/edit.wxml` 的 `stage==='pickTemplate'`，按组渲染 `templateGroups`（来自 `templateLib.groupTemplates`），每行 `tpl-card` = 名称 + 「N 个动作」，末尾一张"空白训练"卡。
- 日历每条 workout 的取色逻辑在 `calendar.aggregateByDate`：`type==='cardio' ? TYPES.cardio : classify(name)`。选模板行要的是同一套取色。

## Goals / Non-Goals

**Goals:**
- 选模板每行右侧一个分化色点，颜色与日历严格同源同色。
- 空白训练显黑点。
- 取色逻辑单一真源，日历与选模板复用同一函数。
- 移除日历图例及其不再使用的 `LEGEND_GROUPS`。

**Non-Goals:**
- 不改色族色值（沿用迭代七 D2）。
- 不改选模板的分组/循证说明/点击进入逻辑。
- 不动数据字段。

## Decisions

### D1 取色收敛为纯函数 `calendar.typeOf({name, type})`
新增 `typeOf({name, type})` 返回 TYPES 条目：`type==='cardio'` → `TYPES.cardio`，否则 `classify(name)`。`aggregateByDate` 改为调用它，选模板页也调用它，**取色只有一处**。补单测覆盖 cardio 优先于名称、名称归类、缺省。

被否：在 `templateLib.groupTemplates` 里附色——会让模板层依赖配色层、耦合错位；取色属日历/配色域，留在 `calendar.js`。

### D2 选模板色点：页面层组装
在 `pages/workout/edit.js` 载入 `templateGroups` 后，对每个 item 附 `dotColor = calendar.typeOf(item).color`；空白训练卡用常量黑点 `#111827`（主题 `--text`）。`edit.wxml` 把 `tpl-card` 改为左内容 + 右色点的行布局；色值经 data 注入，不在 wxml/wxss 硬编码。

### D3 移除日历图例
删 `curve.wxml` legend 块、`curve.wxss` `.cal-legend*` 样式、`curve.js` `calLegend`，并删 `calendar.js` 的 `LEGEND_GROUPS` 导出与对应单测。日历仅保留色点本身（无图例）。

### D4 空白训练用黑点而非"其他"灰
黑点（`#111827`）与"其他"灰（`#9CA3AF`）区分：空白训练是"无模板手动加"，非未匹配的力量日，给它独立的中性黑更达意。用户明确要求黑点。

## Risks / Trade-offs

- **去掉图例后，颜色的"系统"含义只在选模板时出现一次** → 可接受：选模板是建立映射的高频场景；日历色点本身仍传达"练过/练了什么类型"，系统归属是增强信息。
- **黑点 vs 近黑文字色** → 黑点 `#111827` 与卡片文字同色，但点是实心圆、位置在右、语义独立，不会混淆。
- **`typeOf` 重构触及 `aggregateByDate`** → 行为等价（逻辑原样抽出），由现有日历单测 + 新 `typeOf` 单测共同护住。

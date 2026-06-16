## Why

日历现有 7 色按「单日肌群」分类，但颜色散在色轮上（蓝/青/紫/绿/玫红/橙/灰），没有视觉分组，用户无法一眼看出某段时间在跑「三分化」「二分化」还是「有氧」。而模板的 `group` 已把肌群严格嵌套进三个系统（三分化=推/拉/蹲，二分化=上肢/下肢，有氧=cardio），这层结构可以直接用色族表达——不需要新增任何数据字段。

## What Changes

- 重新设计日历配色原则：**色相（hue）编码"系统"，族内用色相弧 + 明度区分"具体那天"**。三分化→蓝族、二分化→绿族、有氧→橙、其他→灰。
- 调整 `utils/calendar.js` 的 `TYPES` 色值：推/拉/蹲收进蓝族，上肢/下肢收进绿族（蹲日紫→蓝、下肢玫红→绿是两处真正的语义换色，其余微调）；有氧橙、其他灰保留。
- 日历图例（`pages/workout/list.wxml`）从「一行平铺 7 色」改为「按系统分组、带小标题」，强化"色=系统"的心智模型。
- 同步更新 `training-calendar` spec 中「分化类型配色标记」需求里关于配色分组的口径，以及 `docs/usermanual.md` 的图例说明。

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `training-calendar`: 「分化类型配色标记」需求的配色口径——从"每类一个固定颜色"改为"按系统分色族（三分化蓝族/二分化绿族/有氧橙/其他灰），族内区分单日"，并要求图例按系统分组展示。

## Impact

- 代码：`utils/calendar.js`（`TYPES` 色值）、`pages/workout/list.wxml` + `pages/workout/list.wxss`（图例分组）。
- 测试：`tests/algo.test.js` 若有断言具体色值需同步；`classify`/`aggregateByDate` 逻辑不变。
- 数据：无。纯展示层换色，不动 4 集合字段、不依赖新字段、不需要存量迁移。
- 文档：`training-calendar` spec、`docs/usermanual.md`。
- 兼容：历史训练记录无需改动，下次进首页即按新色渲染。

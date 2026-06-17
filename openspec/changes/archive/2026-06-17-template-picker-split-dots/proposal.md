## Why

上一迭代在日历下方加了静态配色图例，但图例是"离场说明"——用户不会对着它记。更自然的位置是**选模板时**：每个训练日（推日/上肢A/有氧…）旁边就标上它在日历上的颜色，用户在做选择的那一刻就建立"这个日=这个色"的映射，回到日历一眼能对上。于是把"颜色钥匙"从日历图例搬到选模板行。

## What Changes

- **去掉**日历下方的分组图例（`pages/curve` 的 legend 块/样式/`calLegend`，以及 `utils/calendar.js` 不再需要的 `LEGEND_GROUPS`）。
- **选模板页**（`pages/workout/edit` 的 pickTemplate 阶段）每个模板行右侧显示一个**分化色点**，颜色与日历严格一致：`type==='cardio'`→橙，否则按名称归类（推靛蓝/拉正蓝/蹲天蓝/上肢深草绿/下肢黄绿/其他灰）。
- **空白训练**行显示**黑点**（主题近黑 `#111827`，区别于"其他"灰）。
- 取色收敛为一个纯函数 `calendar.typeOf({name,type})`（返回 TYPES 条目），供 `aggregateByDate` 与选模板共用，保证日历与选模板同源同色。
- 同步更新 `training-calendar`（撤回图例需求）、`template-management`（新增选模板色点需求）两条 spec 及 `docs/usermanual.md`。

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `training-calendar`: 撤回上一迭代加入的"日历图例 SHALL 按系统分组展示"——日历不再显示图例。配色色族口径保留不变。
- `template-management`: 新增"选模板每行显示分化色点"——颜色与日历同源，空白训练为黑点。

## Impact

- 代码：`utils/calendar.js`（加 `typeOf`、删 `LEGEND_GROUPS`）、`pages/curve/curve.{js,wxml,wxss}`（删图例）、`pages/workout/edit.{wxml,wxss}`（加色点）。
- 测试：`tests/algo.test.js` 删图例分组用例、补 `typeOf` 用例。
- 数据：无。纯展示层，不动集合/字段、不依赖新字段。
- 文档：两条 spec、`docs/usermanual.md`。
- 兼容：纯前端展示调整，无迁移。

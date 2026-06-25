## Why

训练记录列表按日期倒序铺开，用户想快速定位"今天练的那条"时得逐条看右上角日期。把当天的记录在视觉上突出，进入训练页一眼可见今日训练。

## What Changes

- 训练记录列表（`pages/workout/list`）中，`date` 等于今天（`util.formatDate()`）的记录卡片 SHALL 在**左侧加一条强调色竖条**。
- 当天有多条记录时**全部高亮**。
- 当天无记录时不高亮任何卡片，列表照常。
- 纯展示改动：不动数据口径、不改集合字段、不改排序与分页。判定在渲染层（`list.js` decorate 给卡片打 `isToday` 标记，wxml/wxss 据此加竖条）。

## Capabilities

### New Capabilities
- `workout-list`: 训练记录列表页的展示规则（首条承载"今日记录高亮"，后续列表展示语义可归入此 capability）。

### Modified Capabilities
<!-- 无 -->

## Impact

- `pages/workout/list.js`：`decorate` 给每条卡片加 `isToday`（`w.date === util.formatDate()`）。
- `pages/workout/list.wxml`：卡片按 `isToday` 加修饰类。
- `pages/workout/list.wxss`：左侧强调色竖条样式（强调色 `#1D4ED8`）。
- `tests/algo.test.js`：若把"是否今天"判定抽为纯函数则补用例；否则属纯 UI，按走查清单自检。
- 不改 4 集合既有字段，无迁移。

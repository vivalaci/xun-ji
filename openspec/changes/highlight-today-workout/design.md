## Context

训练记录列表 `pages/workout/list` 按日期倒序展示卡片，每卡右上角显示 `dateLabel`。`list.js` 的 `decorate(list)` 已把每条记录加工成视图对象（name/dateLabel/meta 等）。本变更让"今天"的记录卡片左侧出现一条强调色竖条。改动极小、单页、无数据/迁移，故 design 仅记唯一决策。

## Goals / Non-Goals

**Goals:**
- 当天（`date === util.formatDate()`）记录卡片左侧加强调色竖条；多条全高亮；无则不高亮。
- 不动数据口径、排序、分页。

**Non-Goals:**
- 不改卡片其他内容、不加"今天"文案标签（仅竖条）。
- 不引入对昨天/本周等其他日期的特殊样式。

## Decisions

### D1：是否今天的判定放在渲染层（`decorate`），不落库
`decorate` 给每条卡片加布尔 `isToday = (w.date === util.formatDate())`，wxml 据此加修饰类、wxss 画左侧竖条。`date` 是既有字段，"今天"是随当前日期变化的运行时状态，绝不能落库。
- 备选：纯 wxml 内联比较日期。否决：wxml 不便做日期等值判断，逻辑应在 js 层；与现有 `decorate` 加工模式一致。
- 备选：抽 `util.isToday(date)` 纯函数并补单测。可选增强；判定逻辑就一行等值比较，价值有限，留作实现时酌情。

### D2：高亮用左侧竖条，强调色取 `#1D4ED8`
与全局强调色（深蓝 `#1D4ED8`）一致，竖条最轻、不抢卡片内容。多条命中各自独立加竖条，互不影响。

## Risks / Trade-offs

- [跨午夜不刷新] 列表 `onShow` 重渲染，进入/返回页面即按当时日期重算 `isToday`，常规使用无感知滞留风险；不为长驻页面单独加定时刷新（收益低）。
- [时区/日期格式] 判定复用 `util.formatDate()`（与记录落库同源），口径天然一致，无额外风险。

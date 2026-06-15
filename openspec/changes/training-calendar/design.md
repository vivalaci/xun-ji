# Design: training-calendar

## Context

「训练」列表页（`pages/workout/list`）已用缓存优先读 + 本地先写展示训练流水，数据为 `workouts`（字段 `date: 'YYYY-MM-DD'`、`name`、`templateId`、`exercises`）。训练名称在 template-groups 后通常为 推日/拉日/蹲日/上肢/下肢，也可能是自定义或用户改名。weekStart 以周一为起始的逻辑此前已在多处使用。无任何 spec 覆盖该列表页。

## Goals / Non-Goals

**Goals:**
- 月维度可视化：训练密度（本月几天）+ 分化节奏（每天练了哪类）。
- 纯读现有数据，零集合/零字段变更。
- 逻辑可单测（纯函数），页面只做渲染与交互。

**Non-Goals:**
- 不做跨月连续滚动（仅上/下月切换）。
- 不在格子里塞文字（用配色圆点，避免拥挤）。
- 不做新页面、不动 tab 结构（嵌入训练列表页顶部）。
- 不依据动作明细细分（按训练名分类即可，不解析 exercises）。

## Decisions

### D1：纯读 `workouts`，新增 `utils/calendar.js` 纯函数层
- `classify(name)`：按关键词归类 → `{ key, color }`。顺序：上肢/下肢优先于"拉"等子串误判（"下肢"不含推拉蹲关键词，安全；但需注意"蹲"与"腿"都归蹲）。
- `aggregateByDate(workouts)`：`{ 'YYYY-MM-DD': [{ _id, name, type }] }`。
- `monthMatrix(year, month, byDate)`：返回 6×7（或按需 5 行）网格，每格 `{ day, dateStr, inMonth, isToday, dots:[color...], more:N, count }`；周一起始，跨月补空。
- `trainedDaysInMonth(byDate, year, month)`：当月有训练的不同日期数。
- **被否方案**：在页面 `data` 里直接拼网格 —— 不可单测，违背项目"纯函数进 tests"规范。

### D2：分化配色（与曲线色系协调，6 类）
| 类型 | 关键词 | 颜色 |
|------|--------|------|
| 推 | 含"推" | `#1D4ED8` 蓝 |
| 拉 | 含"拉" | `#0891B2` 青 |
| 蹲 | 含"蹲"或"腿" | `#7C3AED` 紫 |
| 上肢 | 含"上肢" | `#D97706` 琥珀 |
| 下肢 | 含"下肢" | `#DB2777` 玫红 |
| 其他 | 其余 | `#9CA3AF` 灰 |
分类按"上肢/下肢"先判，再判推/拉/蹲，避免"下肢"被"蹲/腿"逻辑误吃（"下肢"本身不含这些字，安全；显式排序仅为稳健）。

### D3：嵌入训练列表页顶部，不新建页面
- 日历区在列表 `<view>` 顶部，下接现有训练流水与 FAB。
- 数据复用页面已加载的 `workouts`（`onShow` 已 renderFromCache + refresh）；日历在同一 `decorate`/render 流程里算好传入。
- 选中日详情：以"选中态 + 日历下方一段详情卡"呈现（不弹层），点条目 `wx.navigateTo` 到 edit。
- **被否方案**：独立日历页 / 第 5 tab —— 用户已选嵌入；省一跳、与训练流水同屏对照更直观。

### D4：月份状态在页面，纯函数无副作用
页面持 `calYear/calMonth`（默认今天），上/下月只改这两个值并重算网格；纯函数不碰时间"现在"（`isToday` 由页面传入今天日期，保证可测）。

## Risks / Trade-offs

- [一天多练多类型] 多个圆点占位 → 上限 3 + "+N" 折叠，格子不溢出。
- [自定义/改名训练归"其他"] 用户把推日改名"胸三头" → 归其他（灰点）。可接受：颜色是辅助，点击仍可看详情；未来可让模板带 type 字段精确归类（不在本次范围）。
- [页面变长] 列表页顶部加日历 → 首屏下移。可接受：日历是高频回顾入口，值得置顶。

## Migration Plan

无数据迁移（纯读）。发布后训练列表页顶部即出现日历；旧数据照常被聚合展示。

## Open Questions

（无）

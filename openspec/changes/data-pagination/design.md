# Design: data-pagination

## Context

`utils/db.js` 的 `refresh(coll, {limit=200})` 用单次 `.orderBy().limit(limit).get()` 拉数据并整体写缓存，页面遵循"缓存优先读 + 本地先写"。但微信小程序客户端 `collection.get()` 单次最多返回 100 条（服务端权限上限），`.limit(200)` 实际只回 100，超量记录被静默截断，导致曲线/PR/日历/本月统计在记录 >100 后基于残缺数据。训练页（已含日历）与身体页一次性渲染全部缓存记录。

## Goals / Non-Goals

**Goals:**
- 聚合视图在任意数据量下正确（拉全量）。
- 列表页不因记录增长而首屏卡顿（增量渲染）。
- 保持缓存优先、本地先写、弱网兜底等既有行为不变。

**Non-Goals:**
- 不引入云函数聚合（个人量级多年用不到）。
- 不做服务端分页查询接口/游标持久化。
- 不改数据模型、集合、字段。
- 不分页 `workout_templates` / `user_prefs`（数据量极小）。

## Decisions

### D1：`refresh` 改为分页累积全量
循环：`skip=0`；每轮 `.orderBy(orderBy,order).skip(skip).limit(PAGE).get()`，`PAGE=100`；累加结果；当某轮返回 < PAGE 即取尽，停止；`skip += PAGE`。设安全上限 `MAX_RECORDS=5000`（约 24 年训练量），超出即停，防异常数据无限循环。拉完后沿用现有逻辑合并 `_pending` 本地记录、写缓存、返回。
- **被否方案**：保持单次 limit 100 —— 正是当前 bug 根因。
- **被否方案**：云函数一次拉 1000 —— 增基础设施，个人量级不必要。

### D2：每页 100 = 客户端硬上限
`PAGE` 取 100（客户端单次最大）。不取更大值（会被截断）。

### D3：列表增量渲染用前端切片，不碰查询
页面持 `visibleCount`（默认 `PAGE_SIZE=30`）。渲染 `list.slice(0, visibleCount)`。`onReachBottom` 时 `visibleCount += PAGE_SIZE` 并重切。数据全部来自 `db.getCache`，切片是纯前端，零额外查询。
- `hasMore = list.length > visibleCount`，控制底部「没有更多」。
- 刷新/onShow 重渲染时**保留当前 `visibleCount`**（不缩回首批），避免用户加载更多后一刷新又回到 30 条。
- **被否方案**：虚拟列表 —— 复杂、个人量级（数百条）无必要；切片足够。

### D4：训练页日历用全量缓存，不受分页渲染影响
日历 `aggregateByDate` / `trainedDaysInMonth` 仍读 `db.getCache` 全量，与列表的 `visibleCount` 渲染解耦。修了 D1 后日历跨月统计也恢复正确。

### D5：onReachBottom 触发
tab 页 `onReachBottom` 原生可用；配合 `.json` 的 `onReachBottomDistance`（默认 50）即可。另在列表底部显示状态（加载更多提示 / 「没有更多」）。

## Risks / Trade-offs

- [全量拉取随数据增长变慢] 500 条需 5 次查询 → 缓存优先保证先秒开，后台拉取用户无感；MAX 上限兜底。
- [onReachBottom 在数据未满首屏时不触发] 记录 < 30 时无需加载更多，`hasMore=false`，符合预期。
- [刷新保留 visibleCount 的内存] 用户疯狂下拉到全部后内存含全列表 —— 个人量级可忽略。

## Migration Plan

无数据迁移（纯加载/渲染策略）。发布后超过 100 条的历史立即被完整拉回，曲线/PR/日历自动补全。

## Open Questions

（无）

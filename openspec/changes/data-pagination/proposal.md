# Proposal: data-pagination

## Why

随训练/身体记录累积，出现两个问题：① 训练页、身体页一次性渲染全部记录，列表越来越长、首屏变重；② 更隐蔽——`utils/db.js` 用 `.limit(200)` 拉数据，但微信小程序客户端单次查询**最多返回 100 条**，一旦记录超过 100 条（约每周 4 练半年），App 会**静默只加载最近 100 条**，曲线/PR/日历/本月统计全部基于残缺数据，且不报错。按当前训练频率，半年内必撞上 ②。

## What Changes

- **数据层全量分页拉取**：`db.refresh` 改为循环 `.skip(n).limit(100)` 直到拉完（带安全上限），合并进缓存。曲线/PR/日历继续基于全量历史计算，正确性不随数据量崩。保持缓存优先（启动先用缓存秒开，后台拉全量更新）。
- **列表分批渲染**：训练页、身体页默认渲染最近 30 条，上拉到底自动追加下一批（纯前端切片，数据已在缓存，不增加查询）。训练页顶部日历不受影响（按月聚合，用全量缓存）。

## Capabilities

### New Capabilities

- `data-pagination`: 大数据量下的加载与渲染策略——数据层全量分页拉取保证聚合正确，列表页增量渲染避免长列表。

### Modified Capabilities

（无——数据层加载策略与列表页渲染此前无 spec 覆盖；body-tracking 的录入/趋势需求不变，仅其列表渲染方式纳入本新能力。）

## Impact

- `utils/db.js`：`refresh` 由单次 `.limit(200)` 改为分页累积全量（每页 100，安全上限如 5000）；`ensureTemplatesSeeded`/`ensurePrefs` 数据量小，不改。
- `pages/workout/list`、`pages/body/body`：新增 `visibleCount` 增量渲染 + `onReachBottom` 加载更多 + 「没有更多」footer。
- 受益方零改动：曲线/PR/日历/本月统计因拿到全量缓存而自动恢复正确。
- 数据：无集合、无字段变更（纯加载/渲染策略）。

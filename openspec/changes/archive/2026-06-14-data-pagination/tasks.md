# Tasks: data-pagination

## 1. 数据层全量分页拉取（utils/db.js）

- [x] 1.1 `refresh` 改为循环分页：`PAGE=100`，`skip` 递增累积，返回 < PAGE 即止；安全上限 `MAX_RECORDS=5000`
- [x] 1.2 保留既有逻辑：先 `flushQueue`、合并 `_pending` 本地记录、写缓存、返回全量；弱网中途失败保留缓存不崩

## 2. 列表增量渲染

- [x] 2.1 `pages/workout/list`：`visibleCount`（默认 30）+ `slice` 渲染 + `hasMore`；`onReachBottom` 追加；刷新/onShow 保留当前 visibleCount；底部「没有更多」提示
- [x] 2.2 `pages/workout/list.json` 设 `onReachBottomDistance` 50；日历区与列表渲染解耦
- [x] 2.3 `pages/body/body`：同样 visibleCount + slice + onReachBottom + 底部提示
- [x] 2.4 `pages/body/body.json` 设 `onReachBottomDistance` 50
- [x] 2.5 列表底部状态样式（`.list-end` 没有更多）

## 2b. 附带 UI 调整（用户在 apply 时追加）

- [x] 2b.1 训练日历由「训练」列表页移至「首页」（曲线页）顶部；列表页移除日历，相应 spec/design 已更新
- [x] 2b.2 tabBar「曲线」更名「首页」（app.json）

## 3. 验证

- [x] 3.1 `node --check` 全部 js + `node tests/algo.test.js` 全绿（29 测；本 change 为加载/渲染策略，无新增纯函数）
- [ ] 3.2 模拟器走查：构造 >100 条训练，确认曲线/PR/日历/本月统计基于全量；训练页/身体页默认 30 条、上拉追加、到底提示「没有更多」；刷新不缩回首批（需用户在开发者工具执行）
- [x] 3.3 提请用户真机验证并给出验证点清单

## 4. 文档同步

- [x] 4.1 `docs/06-technical-architecture.md` 补充"全量分页拉取（绕过客户端 100 上限）"
- [x] 4.2 README：日历移至首页、tab 更名首页

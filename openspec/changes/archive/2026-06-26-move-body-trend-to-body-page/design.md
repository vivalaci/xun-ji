## Context

「身体趋势」三线合并图当前是曲线首页的固定项之一：`utils/curveConfig.js` 的 `FIXED_CHARTS` 含 `body`（`type:'bodyCombined'`），`pages/curve/curve.js` 的 `compute`/`draw` 对 `bodyCombined` 特判，用 `chart.drawMultiLine` 绘三线 + 图例，并随首页范围（1M/3M/6M/ALL）切换。「身体」页（`pages/body/body.js`）当前只有列表（增量分页）。

迁移目标：把这张图挪到「身体」页上方区域、去掉「身体趋势」标题；曲线首页固定项随之 4→3。

约束（CLAUDE.md）：图表只用 `utils/chart.js`；显示过 `unit.js`；`user_prefs` 配置经 `curveConfig.composeCharts` 自愈；缩放纯函数在 `tests/algo.test.js` 有测；面向用户改动同步 `docs/usermanual.md` 与 `config/manual.js`（同源）。

## Goals / Non-Goals

**Goals:**
- 身体趋势合并图在「身体」页上方区域显示，保留范围切换、图例、独立缩放、平线错位 + 最小尺度渲染；去掉标题。
- 曲线首页固定项减为 3 项；存量配置无缝自愈、无数据迁移。
- 用户手册（doc + in-app）同步，并在末尾新增「参考资料」列出所参考论文/资料。

**Non-Goals:**
- 不改 `drawMultiLine` 的绘制算法（平线错位/最小尺度逻辑原样复用）。
- 不改身体数据的录入/存储/列表分页。
- 不改三大项与自定义曲线在首页的行为。
- 不新增可点击外链组件（in-app 参考资料链接以文本呈现即可）。

## Decisions

### D1：迁移而非复制——首页移除、身体页新增

`curveConfig.FIXED_CHARTS` 删除 `body` 项（剩 bench/squat/deadlift），`defaultPrefs` 随之为 3 项。`curve.js` 移除 `bodyCombined` 分支与 `_series`/`draw` 中对应处理，`curve.wxml` 移除身体趋势卡片。`body.js` 新增趋势 compute + `drawMultiLine` 调用，`body.wxml` 顶部加 canvas + 图例 + 范围切换栏（复用首页同款结构，去掉标题文案）。

- 否决"首页与身体页都显示"：用户明确要"挪"，重复展示反增困惑。

### D2：存量配置自愈，无数据迁移

`composeCharts` 已对未知 key 剔除：移除 `FIXED_CHARTS.body` 后，存量 `user_prefs.curveOrder` 里的 `body` 成为未知键被自动剔除，不再补回（因 `FIXED_CHARTS` 不含）。无需写迁移；「旧配置自愈」场景扩充 `body` 进废弃键集合。

### D3：身体页趋势取数与渲染复用

`body.js` 已持有 `db.getCache(COLL.BODY)`；趋势 compute 复用首页 bodyCombined 的构建（三 series：weight 经 `unit.toDisplay`、bodyFat、waist；按 range 过滤、独立缩放；图例取各自 latest），绘制走 `chart.drawMultiLine`（含迭代十二的平线错位 + 最小尺度，逻辑不变）。范围切换默认保留 1M/3M/6M/ALL，默认 3M（与原首页一致）。空数据走 `drawMultiLine` 既有"暂无数据"占位。

- **图表与列表布局**：趋势图为页面首元素、随页滚动，下接既有列表（`onReachBottom` 分页不受影响）。
- 渲染要求规格从 `curve-customization` 迁入 `body-tracking`，仅调用方变更。

### D4：参考资料章节——doc 与 in-app 同源

`docs/usermanual.md` 末尾新增「参考资料」节，照搬 `docs/09-training-program-design.md` 参考文献 4 条（2 篇 PubMed meta 分析 + SportRxiv 预印本 + RP Strength 容量地标），每条一句中文简述 + 链接。`config/manual.js` 同步新增同名末节（`li` 要点呈现，链接以文本展示——小程序内不强求可点击）。首页/身体页的手册描述一并更新（首页去身体趋势、身体页加趋势图无标题）。

- 否决"另起独立参考文献页"：放手册末节信息密度合适、入口统一。
- 单一事实源为 `docs/09` 参考文献；如将来增减论文，仍以 `docs/09` 为准，手册随之同步。

## Risks / Trade-offs

- **[首页固定项数变更牵连排序/保护逻辑]** → 缓解：`composeCharts`/`defaultPrefs`/编辑模式均按 `FIXED_CHARTS` 派生，去掉 `body` 后自然为 3 项；走查首次无配置、含旧 `body` 配置、编辑排序三种情形。
- **[身体页新增 canvas 的绘制时机]** body 页 `onShow` 渲染 + 范围切换需正确触发 `drawMultiLine`（canvas 选择器在 `body` 页上下文）→ 缓解：参照 `curve.js` 的 `createSelectorQuery().in(this)` 模式。
- **[in-app 链接不可点]** 参考资料链接以文本呈现，用户需手动复制 → 可接受（手册 doc 版为可点击 markdown）。

## Migration Plan

无数据迁移（`user_prefs` 旧 `body` 键自愈剔除）。部署即配置/页面/文档改动；回滚还原 `curveConfig.js`、`curve.*`、`body.*`、`docs/usermanual.md`、`config/manual.js`。

## Open Questions

无（迁移目标、去标题、参考资料来源均已明确）。

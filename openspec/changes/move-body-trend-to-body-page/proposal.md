## Why

「身体趋势」合并图（体重/体脂/腰围三线）现在挂在曲线**首页**，与三大项进步曲线并列，需要单独的「身体趋势」标题来区分。把它挪到「身体」页上方区域后，页面上下文本身就说明了是身体数据趋势，标题变得多余；身体数据的录入、列表与趋势也归拢到同一页，浏览更顺。同时，本项目的训练计划与分组设计是循证的，应在用户手册末尾列出所参考的论文/资料，让用户了解依据。

## What Changes

- **身体趋势图迁移到「身体」页**：从曲线首页移除「身体趋势」固定卡片；在「身体」页（`pages/body/body`）上方区域绘制同一张三线合并图（体重/体脂/腰围），保留时间范围切换、图例与各线独立缩放、缺值断线。**不再显示「身体趋势」标题**（页面已表明语境）。
- **曲线首页固定项 4 → 3**：固定项变为卧推、深蹲、硬拉三项；`curveConfig` 默认配置与「固定项保护/不可删」相应改为 3 项。存量 `user_prefs.curveOrder` 中的 `body` 键由 `composeCharts` 作未知键剔除（自愈，无需数据迁移）。
- **渲染要求随图迁移**：身体趋势合并图的「平线错位 + 最小尺度」渲染要求（迭代十二引入）随图归入「身体」页趋势图，`utils/chart.js` 的绘制逻辑不变。
- **更新用户手册**：同步首页（去掉身体趋势）与身体页（新增趋势图、无标题）的描述；并在手册**最后新增「参考资料」章节**，列出 `docs/09` 参考文献中的全部论文/资料（2 篇 PubMed meta 分析 + 1 篇 SportRxiv 预印本 + RP Strength 容量地标），说明这是训练计划/分组设计的循证依据。

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `curve-customization`: 曲线首页固定项由 4 项（含身体趋势）减为 3 项（卧推/深蹲/硬拉）；移除身体趋势合并图及其渲染要求（迁至 body-tracking）；旧 `body` 键自愈剔除。
- `body-tracking`: 身体趋势合并图从首页迁至「身体」页上方区域显示、去掉标题，并纳入平线错位 + 最小尺度的渲染要求。
- `in-app-usermanual`: 用户手册同步首页/身体页改动，并在末尾新增「参考资料」章节列出所参考论文/资料。

## Impact

- **改动**：`utils/curveConfig.js`（`FIXED_CHARTS` 去 `body`、默认配置 3 项）、`pages/curve/curve.js` + `curve.wxml/wxss`（移除 bodyCombined 分支与卡片）、`pages/body/body.js` + `body.wxml/wxss`（顶部加合并图：compute + drawMultiLine + 范围切换 + 图例 + 空态）。
- **复用**：`utils/chart.js drawMultiLine`（含平线错位/最小尺度，逻辑不变）、`utils/unit.js`（体重换算）。
- **文档**：`docs/usermanual.md`（§二首页去身体趋势、§五身体页加趋势图、新增末尾「参考资料」）；引用源为 `docs/09-training-program-design.md` 的参考文献。
- **数据/集合**：不动集合字段；无数据迁移（`user_prefs` 旧 `body` 键由 `composeCharts` 自愈剔除）。

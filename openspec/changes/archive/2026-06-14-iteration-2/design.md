## Context

迭代一已建立技术地基：4 个云集合（`workouts` / `body_records` / `workout_templates` / `custom_exercises`）、`utils/db.js`（缓存优先读 + 本地先写 + 失败重试队列 + 模板播种）、`utils/unit.js`（单位转换层，MVP 恒等 kg）、`utils/chart.js`（Canvas 折线图）、`utils/util.js`（主力工作组重量算法）、`config/{exercises,templates}.js`。迭代二在此之上补齐「身体」「我的」两个 Tab 及二级页面，不引入新依赖、不改数据 schema。详见 [06-technical-architecture](../../../docs/06-technical-architecture.md)、[03-information-architecture](../../../docs/03-information-architecture.md)。

约束：单人 App、微信原生 + 云开发、不做多设备冲突合并；视觉延续 Apple Health 风格的干净轻量基调。

## Goals / Non-Goals

**Goals:**
- 补齐规划的 13 个页面中缺失的身体数据三态、模板管理/编辑、动作库管理、设置、动作详情。
- lb 单位支持只改 `unit.js` 一处，验证迭代一「不返工」设计。
- 复用既有 db/chart/util，新页面遵循「缓存优先读 + 本地先写」一致模式。

**Non-Goals:**
- 不做多设备同步冲突合并、数据导出、训练计划/周期、自定义任意动作曲线（Could/Won't Have）。
- 不改动 4 集合的字段结构。
- 不做体脂单位以外的设置项扩展（设置页仅重量单位，体脂留位）。

## Decisions

- **页面目录结构**：身体三态放 `pages/body/{list,edit,detail}`，模板放 `pages/template/{manage,edit}`，动作库与动作详情放 `pages/exercise/{library,detail}`，设置 `pages/settings/settings`。沿用迭代一 `pages/workout/{list,edit}` 的扁平分组习惯，而非按 Tab 深层嵌套——便于 `app.json` 注册和跳转。
- **单位偏好存储**：单位偏好存本地 `wx.Storage` 的 `settings` 键，不上云。理由：单人单设备主用，单位是 UI 偏好非业务数据；`unit.currentUnit()` 改为同步读该缓存，避免异步化拖累所有调用方。备选（存云端 user 文档）被否：增加一次网络读、且离线启动时拿不到，得不偿失。
- **PR 计算放读取侧**：PR 不落库为字段，而在加载训练数据时按 exerciseId 扫描历史现算。理由：避免新增 schema 字段与回填历史；数据量小（单人 ≤ 数百条），现算开销可忽略；删除/编辑记录后 PR 自动重算，无需维护一致性。备选（落库 isPR 字段）被否：编辑历史会使标记失真。
- **趋势曲线缺值处理**：体脂选填，缺值点在 `chart.js` 中断线而非补零，避免误导趋势。
- **动作名称回退**：展示动作名一律按 exerciseId 从「内置 + custom_exercises」合并表查；自建动作被删后，历史记录按 id 回退显示占位名，不破坏既有记录。

## Risks / Trade-offs

- **lb 切换遗漏调用点** → 全仓搜索直接读重量数字、未过 `unit.toDisplay/toStore` 的地方，迁移前补齐；以「切到 lb 后曲线/录入/详情数值一致”为验收。
- **PR 现算性能** → 数据量增大后扫描变慢；当前单人量级安全，若超量再引入缓存或落库。
- **自建动作 id 冲突** → `cus_` + 时间戳/随机生成，沿用 db 层 `genLocalId` 同款策略，碰撞概率可忽略。
- **真机尚未验证** → 迭代一代码仅过语法 + 单测，云环境未搭；迭代二实现后需与迭代一一起首次真机联调（见 Open Questions）。

## Migration Plan

- 无数据迁移：不改集合 schema，新增本地 `settings` 缓存键由 `unit.js` 缺省回退 kg，老用户无感。
- 部署即在 `app.json` 注册新页面、上线新版本；回滚为切回旧版本代码，数据兼容。

## Open Questions

- 用户尚未搭建微信账号 + 云开发环境，迭代二完成后才能首次真机/模拟器联调——是否在本迭代内安排联调，还是与迭代一合并验证？
- 体脂单位是否本迭代纳入设置页（当前 Non-Goal，仅留位）？

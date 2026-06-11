## Why

迭代一已交付核心闭环（曲线首页 + 训练记录），但「身体」「我的」两个 Tab 仍是占位页，规划文档（[03-information-architecture](../../../docs/03-information-architecture.md)）列出的 13 个页面只完成了一半。迭代二补齐身体数据追踪、模板/动作库管理、设置（lb 单位）、动作详情与 PR 标记，让 App 成为可日常自用的完整工具。

## What Changes

- **身体数据**：新增 `pages/body/body` 列表、新建、详情三态；录入体重/体脂，落库 `body_records`，按日期倒序展示；首页曲线接入体重/体脂趋势线。
- **训练模板管理**：「我的」页进入模板管理；可重命名、增删模板，编辑模板内动作（新增 `模板编辑页`）。复用 db 层已有 `ensureTemplatesSeeded` 的播种数据。
- **动作库管理**：新增动作库管理页，查看内置动作（三大项标记）+ 增删自建动作（`custom_exercises`，id 形如 `cus_xxx`）。
- **设置 + lb 单位**：新增设置页，可切换重量单位 kg/lb。仅改 `utils/unit.js` 让 `currentUnit()` 从设置读取，业务代码零改动（lb×0.453592→kg，落库恒为 kg）。
- **动作详情页**：从曲线/动作库进入，展示单动作的历史与主力工作组重量曲线。
- **PR 标记**（Should Have）：训练记录中识别个人记录（主力工作组重量创新高）并在列表/详情打标。

无破坏性变更：迭代一已落库的数据结构（4 集合）保持不变，新页面与现有 Tab 并存。

## Capabilities

### New Capabilities

- `body-tracking`: 身体数据（体重/体脂）的录入、列表、详情、编辑、删除，及首页趋势曲线接入。
- `template-management`: 训练模板的查看、重命名、增删，及模板内动作的编辑。
- `exercise-library-management`: 动作库查看与自建动作（`custom_exercises`）的增删管理。
- `unit-settings`: 设置页与重量单位 kg/lb 切换（经 `unit.js` 转换层，落库恒为 kg）。
- `exercise-detail`: 单动作详情页——历史记录与主力工作组重量曲线。
- `pr-tracking`: 个人记录（PR）自动识别与标记。

### Modified Capabilities

<!-- 无：迭代一未建立 openspec/specs/，本次均为新增能力，现有数据模型不变。 -->

## Impact

- **新增页面**：`pages/body/{list,edit,detail}`、`pages/template/{manage,edit}`、`pages/exercise/{library,detail}`、`pages/settings/settings`（具体路径在 design 确定）。
- **改动代码**：`app.json`（注册新页面）、`utils/unit.js`（启用 lb 读取）、`pages/curve`（接入身体趋势线）、`pages/profile`（接入管理/设置入口）、`pages/workout`（PR 标记）。
- **复用**：`utils/db.js`（读写/队列/播种）、`utils/chart.js`（趋势曲线）、`config/{exercises,templates}.js`、`utils/util.js`（主力工作组重量算法）。
- **数据集合**：沿用 `body_records` / `workout_templates` / `custom_exercises`，无 schema 变更；新增本地 `settings` 缓存键存单位偏好。

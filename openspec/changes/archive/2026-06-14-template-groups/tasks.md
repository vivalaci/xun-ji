# Tasks: template-groups

## 1. 预设配置

- [x] 1.1 `config/templates.js`：5 套预设加 `group` 字段；"腿日"改"蹲日"；新增"上肢""下肢"（动作清单见 design D6；order 0-4）

## 2. 播种与迁移（utils/db.js）

- [x] 2.1 `ensureTemplatesSeeded`：全新播种路径写入含 `group` 的 5 套预设
- [x] 2.2 迁移逻辑：检测缺 `group` 的存量模板 → 推日/拉日/腿日归"三分化"且腿日改名"蹲日"，其余写 `group:""`；写入走 `updateLocalFirst`
- [x] 2.3 迁移时补种二分化（带"云端不存在同名+同组预设"前检），完成后更新缓存并返回迁移后列表

## 3. 界面分组渲染

- [x] 3.1 抽一个按组分桶的纯函数（三分化 → 二分化 → 我的模板，桶内按 `order`，空桶不出节），训练编辑页与模板管理页共用（`utils/templateLib.js`）
- [x] 3.2 `pages/workout/edit`：选模板阶段按组分节渲染，"空白训练"入口保留在底部
- [x] 3.3 `pages/template/manage`：列表按组分节渲染；新建模板 `group` 留空（归"我的模板"）

## 4. 验证

- [x] 4.1 `tests/algo.test.js` 补用例：分桶函数（含无 group/空串归"我的模板"、空桶剔除、桶内 order 排序）与迁移判定函数（名称匹配归组、改名、已迁移不重复触发）
- [x] 4.2 跑 `node --check` 全部 js + `node tests/algo.test.js` 全绿（14 测全过）
- [x] 4.3 真机走查通过（2026-06-14）：模板分组展示、腿日→蹲日、复用预填、删除不复活、空白训练均正常
- [x] 4.4 提请用户真机验证并给出验证点清单

## 5. 文档同步

- [x] 5.1 更新 `README.md`（预设模板描述）与 `docs/00-overview.md`（阶段表无口径变化，未改）

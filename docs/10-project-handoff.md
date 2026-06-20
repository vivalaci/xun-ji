# 10 · 项目交接 / 入职速览

> **读这一篇就懂**：训记当前做了什么、是什么状态、代码在哪、怎么继续。
> 其余文档为细节，本文是入口。最后更新：2026-06-20（迭代一~十三全部归档，无活跃 change）。

---

## 一、一句话与当前状态

**训记** —— 面向进阶训练者的微信小程序（原生 + 云开发，无 npm、无构建）。3 分钟记完一次训练，首页看三大项进步曲线、训练日历与身体趋势。

| 维度 | 状态 |
|------|------|
| 阶段 | ①产品定义~⑦开发 **全部完成**；⑧测试上线 **进行中** |
| 开发 | 迭代一~十三全部代码完成、真机通过并归档；**无活跃 change** |
| 代码量 | 100 个动作（含 7 有氧）、8 套预设、14 页面、13 个能力规格 |
| 质量 | 86 个算法单测全过；全 js `node --check` 通过 |
| 上线 | 未发布。卡点：**ICP 备案**（未办）、隐私指引、服务类目、提审 |
| git | 干净；tag 见 `git tag`（最新 `workout-flow-and-trend-fixes`/`highlight-today-workout`）；最新 commit 见 `git log` |

> 当前无活跃 change（`openspec/changes/` 下仅 `archive/`）。下一步是阶段⑧上线，见第八节。

---

## 二、架构铁律（改代码前必读，详见 [CLAUDE.md](../CLAUDE.md)）

1. **云读写只走 `utils/db.js`**：读 = `getCache` 先渲染 + `refresh` 异步更新；写 = `saveLocalFirst/updateLocalFirst/removeLocalFirst`（本地先落 + 队列重试，弱网兜底）。页面禁止直连 `wx.cloud.database()`。
2. **重量恒以 kg 落库**（kg 完整精度；lb 录入取整到 0.5kg）；换算只在 `utils/unit.js`。训练组重量显示用 `toDisplayWeight`（量化到 0.5），体重等用 `toDisplay`（保留 0.1）。
3. **动作身份靠 `exerciseId`**（曲线/PR/历史聚合都按 id，不靠名字）；展示名经 `utils/exerciseLib.js`（内置+自建合并，含被删占位回退）。
4. **PR 读取侧现算**（`util.buildPRMap`），不落库。
5. **图表只用 `utils/chart.js`**（Canvas 2D，无第三方库），缺值断线不补零。
6. **4 个核心集合既有字段不改**；新字段必须可缺省 + 写迁移方案。
7. 凡改面向用户的功能，归档前必须同步 [usermanual.md](./usermanual.md)（发版必需）。

---

## 三、当前能力清单（`openspec/specs/` 13 个，权威"App 现在做什么"）

| 能力 | 是什么 | 主要页面 |
|------|--------|---------|
| `template-management` | 模板分组（三分化/二分化/有氧/我的）、增删改、预设、目标组次、版本重刷 | template/、workout/edit 选模板 |
| `training-calendar` | 首页训练月历，按类型配色、点天看详情 | curve/（首页顶部）|
| `curve-customization` | 首页曲线可定制：长按编辑排序、自定义曲线≤2、存 user_prefs | curve/ |
| `pr-tracking` | 主力工作组重量创新高自动标 🏆 | 列表、exercise/detail |
| `exercise-detail` | 单动作进步曲线 + 历史 | exercise/detail |
| `exercise-library-management` | 100 动作（内置+自建）分类/搜索/增删 | exercise/library |
| `body-tracking` | 体重/体脂/腰围录入 + 首页身体三线合并图 | body/ |
| `unit-settings` | 主单位 kg/lb（全局显示+默认输入）| settings/ |
| `per-entry-input-unit` | 录入时每个动作临时切 kg/lb，存仍 kg；显示去浮点长尾 | workout/edit |
| `data-pagination` | 全量分页拉取（绕过客户端 100 上限）+ 列表增量渲染 | db.js、各列表页 |
| `cardio-tracking` | 有氧大类：7 活动、时长+距离/层数、`workouts.type` 区分 | workout/edit、list、calendar |
| `in-app-usermanual` | 应用内使用说明：我的页入口 + 独立页按节渲染手册，内容源 `config/manual.js`（与 docs/usermanual.md 同源）| profile/、manual/ |
| `workout-list` | 训练记录列表展示规则：今日记录左侧强调色竖条高亮（`util.isToday`，渲染层判定）| workout/list |

---

## 四、迭代编年史（细节链到 `openspec/changes/archive/`）

- **迭代一**：训练记录 + 三大项曲线核心闭环（动作库/模板/记录/曲线/弱网兜底）。
- **迭代二**（`iteration-2`）：身体数据、模板/动作库管理、设置 kg/lb、动作详情、PR。
- **迭代三**（tag `iteration-3`，6 个 change）：`template-groups`（分组+迁移）、`custom-curves`（曲线可定制）、`training-calendar`（日历）、`data-pagination`（分页）、`per-entry-input-unit`（每动作单位+round）、`body-waist`（腰围+身体三线图）。
- **迭代四**（tag `iteration-4`）：`enrich-exercise-library`（动作库 27→92、元数据、搜索、自重 loadType）。
- **迭代五**（tag `iteration-5`）：`cardio-tracking`（有氧训练大类）。
- **迭代六**（tag `preset-program-upgrade`）：预设按 [docs/09](./09-training-program-design.md) 升级为 8 套（二分化 2→4）+ 模板目标组次（targetSets/repLow/repHigh）+ 选模板循证说明 + `presetVersion` 版本重刷 + 手册纳入发版流程。
- **迭代七**（tag `calendar-split-palette`）：日历分化配色按系统分色族（三分化蓝/二分化绿/有氧橙/其他灰）。
- **迭代八**（tag `template-picker-split-dots`）：选模板行内分化色点（与日历同源），移除日历图例。
- **迭代九**（tag `in-app-usermanual`）：应用内使用说明（我的页入口 + 独立说明页，内容固化 `config/manual.js` 与 docs/usermanual.md 同源）。
- **迭代十**（tag `record-and-deadlift-fixes`）：记录/曲线三修——保存力量训练保留全部动作（未填落 0）；训练组重量统一量化到 0.5（`unit.roundHalfKg`/`toDisplayWeight`，lb 落库取整 0.5kg、体重保 0.1）；硬拉曲线与详情聚合家族（硬拉/罗马尼亚硬拉/直腿硬拉，`util.dayLiftValue`/`curveConfig.familyFor`）。
- **迭代十一**（tag `record-to-template`，首个走 PR 分支流程）：训练记录一键存为「我的模板」（`templateLib.recordToTemplatePayload`）；「我的模板」分组置顶；预设 App 托管不可删除（`templateLib.isPresetGroup` + 删除入口仅我的模板渲染）。
- **迭代十二**（tag `workout-flow-and-trend-fixes`）：①选模板拆为独立页 `pages/workout/pick`（返回导航修正，保存新建退 2 层回列表）；②训练编辑页动作上移/下移（力量+有氧）；③身体趋势图体重线渲染修复（`chart.computeBand` 最小尺度 + 近平线像素错位）。
- **迭代十三**（tag `highlight-today-workout`）：训练列表高亮今日记录（`util.isToday` + 卡片左侧强调色竖条，渲染层判定不落库）。新增 capability `workout-list`。

---

## 五、数据模型（5 集合，详见 [06-technical-architecture](./06-technical-architecture.md)）

| 集合 | 内容 | 关键字段 |
|------|------|---------|
| `workouts` | 训练记录 | `date`、`type`(strength/cardio)、`templateId`、`exercises[]`（力量含 `sets[{weight,reps}]`；有氧含 `duration`+`distance`/`floors`，无 sets）|
| `body_records` | 身体数据 | `weight`(kg)、`bodyFat`(%)、`waist`(cm) |
| `workout_templates` | 训练模板 | `group`、`order`、`type`、`exercises[{exerciseId,targetSets?,repLow?,repHigh?}]` |
| `custom_exercises` | 自建动作 | `id`(cus_)、`name`、`category` |
| `user_prefs` | 用户偏好（单文档）| `curveOrder`、`customCurves`、`presetVersion`、`seededCardio` |

全部「仅创建者可读写」；写入自动带 `_openid`，无需登录。

---

## 六、代码地图

```
config/exercises.js   动作库（含 id/元数据/有氧 kind+metrics）
config/templates.js   8 套预设（带目标组次）
config/manual.js      使用说明内容（结构化，与 docs/usermanual.md 同源）
utils/db.js           数据访问层（缓存优先读 + 本地先写队列 + 模板播种/版本重刷）
utils/store.js        本地存储底层（缓存 + 队列 + settings）
utils/util.js         主力工作组重量、PR 现算、容量、日期
utils/unit.js         单位换算层（主单位 + 显式单位族 toStoreFrom/toDisplayIn）
utils/exerciseLib.js  动作合并查询（内置+自建，按 id 取名、搜索、分类）
utils/templateLib.js  模板分组/迁移/分组循证说明（GROUP_NOTES）
utils/curveConfig.js  曲线配置纯函数（合成/排序/增删/槽位配色）
utils/calendar.js     训练日历纯函数（月网格/聚合/类型配色）
utils/chart.js        Canvas 折线图（单线 + drawMultiLine 多线）
pages/curve/          首页：日历 + 曲线（含编辑模式、添加曲线）
pages/workout/        训练列表 / 选模板(pick) / 新建编辑(edit，力量+有氧双路径)
pages/body/           身体数据 列表/录入/详情
pages/exercise/       动作库管理 / 动作详情
pages/template/       模板管理 / 编辑
pages/manual/         使用说明（渲染 config/manual.js）
pages/settings/ profile/  设置 / 我的
tests/algo.test.js    86 个纯函数单测
```

---

## 七、如何继续开发

**流程（OpenSpec，见 [07-development-guide](./07-development-guide.md)）**：一个迭代 = 一个 change。
```
/opsx:propose → /opsx:apply（按 tasks 逐项勾选）→ 真机验证 → /opsx:sync + /opsx:archive（打 tag）
```
设计决策写进 change 的 `design.md`（附被否方案）。

**每次改完必跑**：
```powershell
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
node tests/algo.test.js
```
纯函数逻辑（util/unit/templateLib/curveConfig/calendar 等）改动必补单测。面向用户的改动必更 usermanual。

**真机验证**需用户在微信开发者工具操作（主动提请并给验证点清单）。

---

## 八、下一步

开发侧无未决功能。剩 **阶段⑧ 测试上线**（见 [08-launch-checklist](./08-launch-checklist.md)）：

```
⬜ ICP 备案（最耗时、发布硬前置——建议尽快发起）
⬜ 用户隐私保护指引 / 服务类目
⬜ 提交审核 → 发布
✅ 图标（assets/）、上线文案、边界测试清单 已就绪
```

开发侧迭代一~十三均已归档打 tag，无遗留 change。

---

## 文档导航

[00 总览](./00-overview.md) · [01 产品](./01-product-definition.md) · [06 技术](./06-technical-architecture.md) · [07 开发指南](./07-development-guide.md) · [08 上线清单](./08-launch-checklist.md) · [09 训练计划设计](./09-training-program-design.md) · [usermanual 用户手册](./usermanual.md) · `openspec/specs/`（能力规格）· `openspec/changes/archive/`（迭代历史）

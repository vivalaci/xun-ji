# 10 · 项目交接 / 入职速览

> **读这一篇就懂**：训记当前做了什么、是什么状态、代码在哪、怎么继续。
> 其余文档为细节，本文是入口。最后更新：2026-09-14（**已正式发布上线**；迭代一~十九全部归档；迭代二十 `exercise-media-instructions` 代码完成、待真机）。

---

## 一、一句话与当前状态

**训记** —— 面向进阶训练者的微信小程序（原生 + 云开发，无 npm、无构建）。3 分钟记完一次训练，首页看三大项进步曲线与训练日历，身体趋势在「身体」页。

| 维度 | 状态 |
|------|------|
| 阶段 | ①产品定义~⑧测试上线 **全部完成**；**已正式发布上线** |
| 开发 | 迭代一~十九全部代码完成、真机通过并归档；迭代二十（动作示意图 + 中文要领）代码完成、**待真机** |
| 代码量 | 101 个动作（含 7 有氧）、94 条中文要领、8 套预设、14 页面、4 个自定义组件、15 个能力规格（迭代二十归档后 16） |
| 质量 | 算法单测全过；全 js `node --check` 通过 |
| 上线 | **已发布**。个人认证 + ICP 备案通过、审核通过、正式发布；后续走迭代更新 |
| git | 干净；tag 见 `git tag`（最新 `exercise-lib-admin`）；最新 commit 见 `git log` |

> 活跃 change：`exercise-media-instructions`（迭代二十，分支 `feat/exercise-media-instructions`，待真机走查）。进入持续迭代更新阶段，见第八节。

---

## 二、架构铁律（改代码前必读，详见 [CLAUDE.md](../CLAUDE.md)）

1. **云读写只走 `utils/db.js`**：读 = `getCache` 先渲染 + `refresh` 异步更新；写 = `saveLocalFirst/updateLocalFirst/removeLocalFirst`（本地先落 + 队列重试，弱网兜底）。页面禁止直连 `wx.cloud.database()`。**既定例外**：管理员对 `exercise_overrides` 的写入走 `utils/adminApi.js` 直调 `exerciseAdmin` 云函数（服务端权威共享内容，本地先写无意义）；读仍走 db.js。
2. **重量恒以 kg 落库**（kg 完整精度；lb 录入取整到 0.5kg）；换算只在 `utils/unit.js`。训练组重量显示用 `toDisplayWeight`（量化到 0.5），体重等用 `toDisplay`（保留 0.1）。
3. **动作身份靠 `exerciseId`**（曲线/PR/历史聚合都按 id，不靠名字）；展示名经 `utils/exerciseLib.js`（内置+全局覆盖层+自建合并，含被删占位回退）。
4. **PR 读取侧现算**（`util.buildPRMap`），不落库。
5. **图表只用 `utils/chart.js`**（Canvas 2D，无第三方库），缺值断线不补零。
6. **4 个核心集合既有字段不改**；新字段必须可缺省 + 写迁移方案。
7. 凡改面向用户的功能，归档前必须同步 [usermanual.md](./usermanual.md)（发版必需）。
8. **可复用展示组件放 `components/<组件名>/`**（迭代二十起），在页面 `.json` 的 `usingComponents` 注册；组件只做展示、数据经 `utils/` 纯函数取，样式自包含（组件不继承 app.wxss 的类）。

---

## 三、当前能力清单（`openspec/specs/` 15 个，权威"App 现在做什么"）

| 能力 | 是什么 | 主要页面 |
|------|--------|---------|
| `template-management` | 模板分组（三分化/二分化/有氧/我的）、增删改、预设、目标组次、版本重刷 | template/、workout/edit 选模板 |
| `training-calendar` | 首页训练月历，按类型配色、点天看详情 | curve/（首页顶部）|
| `curve-customization` | 首页曲线可定制：长按编辑排序、自定义曲线≤2、存 user_prefs | curve/ |
| `pr-tracking` | 主力工作组重量创新高自动标 🏆 | 列表、exercise/detail |
| `exercise-detail` | 单动作进步曲线 + 历史；曲线下方示意图 + 要领 | exercise/detail |
| `exercise-guide`（迭代二十，待归档） | 动作示意图（列表缩略图 / 详情循环 / 放大层）+ 中文要领，云存储取图、无图降级 | exercise/library、exercise/detail、workout/edit、template/edit |
| `exercise-library-management` | 101 动作（内置+全局覆盖层+自建）分类/搜索/增删/升格；规范中文名；历史动作名按 id 实时解析（快照回退） | exercise/library |
| `exercise-lib-admin` | 管理员动作库内容管理：改名/改分类/别名/隐藏/全局新增/删除/类别编排（云函数权限门） | exercise/library |
| `body-tracking` | 体重/体脂/腰围录入 + 「身体」页顶部三线合并趋势图（无标题） | body/ |
| `unit-settings` | 主单位 kg/lb（全局显示+默认输入）| settings/ |
| `per-entry-input-unit` | 录入时每个动作临时切 kg/lb，存仍 kg；显示去浮点长尾 | workout/edit |
| `data-pagination` | 全量分页拉取（绕过客户端 100 上限）+ 列表增量渲染 | db.js、各列表页 |
| `cardio-tracking` | 有氧大类：7 活动、时长+距离/层数、`workouts.type` 区分 | workout/edit、list、calendar |
| `in-app-usermanual` | 应用内使用说明：我的页入口 + 独立页按节渲染手册，内容源 `config/manual.js`（与 docs/usermanual.md 同源）| profile/、manual/ |
| `workout-list` | 训练记录列表展示规则：今日记录左侧强调色竖条高亮（`util.isToday`，渲染层判定）| workout/list |
| `page-sharing` | 首页与身体页转发好友/群 + 朋友圈分享（品牌封面图，不带个人数据）| curve/、body/ |

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
- **迭代十四**（tag `template-naming-and-bodyweight-trend`）：①模板命名后缀幂等去重 + 重名编号 + 保存确认窗可编辑（`templateLib.baseTemplateName`/`recordToTemplatePayload`）；②纯自重动作趋势按当日最大次数（`util.dayRepsValue`，曲线/详情整条统一口径）；③选模板页（`pages/workout/pick`）加删除「我的模板」（预设不可删）。
- **迭代十五**（tag `move-body-trend-to-body-page`）：身体趋势三线合并图从曲线首页迁至「身体」页上方（无标题）、首页固定项 4→3（`curveConfig` 去 body、抽 `BODY_SERIES`，旧 body 配置自愈剔除）；手册新增「参考资料」节（docs/09 四条文献）。
- **迭代十六**（tag `template-new-blank-sets`）：按模板新建训练取消历史值预填、始终铺空组（`buildFromTemplate` 去 lastSame，按 targetSets 铺空组 + 区间提示，有氧不预填）；配合既有「未填补 0 + 完全空白拦截」杜绝"未练却存上次数据"。
- **迭代十七**（tag `enable-sharing-home-body`）：首页与身体页开放转发好友/群 + 朋友圈分享——分享封面用固定品牌图（不带个人数据），其它页面维持不可转发。新增主 spec `page-sharing`。
- **迭代十八**（tag `fix-template-picker-first-load`）：修复新用户选模板页首进空白——加载/错误态、播种并发化、失败可重试。改主 spec `template-management`。
- **迭代十九**（tag `exercise-lib-admin`）：动作库管理员内容管理——所有者在 App 内改名/改分类/改别名/隐藏内置动作、新增全局动作（`gbl_`）、编排类别顺序，改动经云端下发全体用户、不发版。项目首个云函数 `exerciseAdmin`（OPENID 权限门）与首个共享集合 `exercise_overrides`（所有用户可读、仅管理端可写）；管理员另可把自建动作升格为全局动作（引用整体迁移，曲线连续）。新增主 spec `exercise-lib-admin`、改 `exercise-library-management`。
- **迭代二十**（change `exercise-media-instructions`，待真机、未打 tag）：动作示意图（workout-guide/Everkinetic 线稿，已重新着色；存微信云存储；列表静态缩略图 + 详情页循环 + 放大层；首批自定义组件 `components/`）+ 94 条中文要领统一重写 + 12 个内置动作规范中文名、新增海豹划船 `seal_row` + 历史动作名按 id 实时解析（快照回退）+ 出图脚本 `tools/media`。新增主 spec `exercise-guide`，改 `exercise-detail`/`exercise-library-management`/`in-app-usermanual`。

---

## 五、数据模型（6 集合，详见 [06-technical-architecture](./06-technical-architecture.md)）

| 集合 | 内容 | 关键字段 |
|------|------|---------|
| `workouts` | 训练记录 | `date`、`type`(strength/cardio)、`templateId`、`exercises[]`（力量含 `sets[{weight,reps}]`；有氧含 `duration`+`distance`/`floors`，无 sets）|
| `body_records` | 身体数据 | `weight`(kg)、`bodyFat`(%)、`waist`(cm) |
| `workout_templates` | 训练模板 | `group`、`order`、`type`、`exercises[{exerciseId,targetSets?,repLow?,repHigh?}]` |
| `custom_exercises` | 自建动作 | `id`(cus_)、`name`、`category`、`aliases`(可缺省) |
| `user_prefs` | 用户偏好（单文档）| `curveOrder`、`customCurves`、`presetVersion`、`seededCardio` |
| `exercise_overrides` | 全局动作库覆盖层（管理员内容管理） | `kind`(patch/exercise/categories)、`targetId`、`name`、`category`、`hidden`、`order` |

前 5 集合「仅创建者可读写」；`exercise_overrides`「所有用户可读，仅管理端可写」。写入自动带 `_openid`，无需登录。

---

## 六、代码地图

```
config/exercises.js   动作库（含 id/元数据/有氧 kind+metrics）
config/templates.js   8 套预设（带目标组次）
config/manual.js      使用说明内容（结构化，与 docs/usermanual.md 同源）
config/exerciseMedia.js         示意图云存储前缀 + 有图动作清单
config/exerciseInstructions.js  中文要领（94 条，steps + tips）
utils/db.js           数据访问层（缓存优先读 + 本地先写队列 + 模板播种/版本重刷）
utils/store.js        本地存储底层（缓存 + 队列 + settings）
utils/util.js         主力工作组重量、PR 现算、容量、日期
utils/unit.js         单位换算层（主单位 + 显式单位族 toStoreFrom/toDisplayIn）
utils/exerciseLib.js  动作合并查询（内置+全局覆盖层+自建，按 id 取名、搜索、分类）
utils/adminApi.js     管理写入通道（exerciseAdmin 云函数薄封装）
utils/exerciseMedia.js  示意图取图（framesFor/thumbFor）/ 要领取数纯函数
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
cloudfunctions/exerciseAdmin/  云函数：全局动作库管理写入（权限门 + 校验纯函数）
components/           可复用展示组件：exercise-thumb / exercise-anim / exercise-guide / exercise-viewer
assets/exercise-media/  示意图 SVG 母版（PNG 由 tools/media 生成、传云存储，不进 git）
tools/media/          开发期出图脚本（sharp，不打包）
tests/algo.test.js    纯函数单测
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

**已正式发布上线**（个人认证 + ICP 备案通过、审核通过、发布完成）；阶段①~⑧全部完成。

进入**持续迭代更新**阶段：后续每个功能/修复仍走 OpenSpec change + PR 分支流程（见第七节与 [[feedback-pr-flow]]），归档打 tag；发版按 [07 发布流程](./07-development-guide.md) 上传 → 提交审核 → 发布。

开发侧迭代一~十九均已归档打 tag。**进行中**：迭代二十 `exercise-media-instructions`（代码完成；待：示意图 PNG 上传云存储并回填 `config/exerciseMedia.js` 的 `PREFIX`、94 条要领过目、真机走查、sync/archive/tag）。后续可补：海豹划船示意图（上游无素材，可按 [docs/12](./12-illustration-production-guide.md) 自制）。

---

## 文档导航

[00 总览](./00-overview.md) · [01 产品](./01-product-definition.md) · [06 技术](./06-technical-architecture.md) · [07 开发指南](./07-development-guide.md) · [08 上线清单](./08-launch-checklist.md) · [09 训练计划设计](./09-training-program-design.md) · [usermanual 用户手册](./usermanual.md) · `openspec/specs/`（能力规格）· `openspec/changes/archive/`（迭代历史）

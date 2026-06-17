## Context

三个真机问题集中在「记录保存」「单位换算」「硬拉曲线口径」。约束：无 npm、无构建；遵守架构铁律（读写走 `db.js`、换算只在 `unit.js`、动作身份靠 `exerciseId`、曲线口径=主力工作组重量、不改集合既有字段）。涉及铁律 2（重量完整精度落库、不提前 round）的一处定向放宽。

## Decisions

### D1：保存保留全部动作，空值落 0（问题 1）
`pages/workout/edit.js` `onSave` 力量分支当前：`sets.filter(有值).map(...)` 再 `exercises.filter(sets.length>0)` —— 这正是丢动作的根因。
- 改为：**不过滤**。每个动作的每个组 `weight: ''→0 否则 toStoreFrom(...)`、`reps: Number||0`；动作整体保留。
- 保存前置守卫：整训练**至少一组**有非空重量或次数，否则拦截（防止误存全 0 空训练）。
- 空白训练/手动加动作同享此逻辑（守卫与保留对所有 strength 训练一致）。
- 0 重量组对聚合无害：`util.mainWorkingWeight` 已 `if(!w) return` 跳过 0；`buildPRMap`、`totalVolume` 同样忽略 0。日历按 workout 存在即标记（符合预期：那天确实开了这次训练）。
- **被否**：保留动作但丢空组 —— 用户期望"原始数据都在"，组结构也应留；且模板铺的目标组数本就是计划，保留更贴合复盘。
- **范围**：cardio 维持现状（每次通常只选一个有氧活动，保留全部 7 项会是噪声）；本 change 不动 cardio 过滤。

### D2：训练组重量统一显示到 0.5 kg + lb 落库取整（问题 2）
目标（用户明确）：**所有出现的训练组重量 kg 数字只能是整数或 .5（45 / 45.5），绝不出现 44.9 这类小数**，且要覆盖预填的历史脏数据（图 2 的 44.9 是上次 lb 录入存的全精度 kg，本次预填显示出来的）。仅在保存时取整无法清掉历史显示，故**显示层也要量化到 0.5**。

`utils/unit.js` 新增纯函数 `roundHalfKg(n) = Math.round(n*2)/2`。两处套用：

1. **显示（训练组重量）**：新增 `toDisplayWeight(kg, dstUnit)`——换算到目标单位后 `roundHalfKg`，保证录入页预填/切换、动作详情历史明细里的组重量永远是 0.5 倍数（含历史数据）。替换的调用点：`edit.js` 预填 83/125、切换 179；`detail.js` 历史明细 80。
   - **返回数字、整数不带 .0**：`roundHalfKg` 返回 `Math.round(n*2)/2` 即数字（33 / 33.5），直接渲染时整数显示 `33`、半数显示 `33.5`。**不得**对结果套 `toFixed(1)`（会得到字符串 `"33.0"`）；保持数字形态即可天然满足"只有 .5 才显示小数"。
   - **体重等身体数据不变**：`body/*.js` 仍用 `toDisplay`（保留 ≤1 位小数，体脂秤本就 0.1 粒度）；进步曲线 lift 仍取整（Math.round）。即 0.5 量化只作用于"训练组重量"这一类显示。
2. **存储（lb 录入）**：`toStoreFrom(value,'lb')`/`toStore`(lb) → `roundHalfKg(n*LB_TO_KG)`；**kg 录入仍完整精度、不变**。新 lb 记录落库即 0.5 倍数。

- 精度 0.5：贴片常见最小 1.25kg、进位 2.5kg，0.5 既够细又消脏尾；99lb→44.9056→45.0、77lb→34.926→35.0。
- **显示量化与存储的关系**：kg 录入存全精度但显示量化到 0.5（如存 41.25 显示 41.0/41.5）；用户已明确接受 0.5 为显示粒度。编辑旧记录保存时，读到的是已量化的显示值（kg 单位 `toStoreFrom(45,'kg')=45`），于是脏小数被"归一"为 0.5 倍数落库——历史在被触碰时自然修复，未触碰的不主动迁移（铁律 6）。
- **往返稳定**：切换 kg↔lb 经 `toStoreFrom`(0.5 取整)+`toDisplayWeight`(0.5)，100kg→lb→kg 仍 100，无浮点漂移。
- **铁律 2 的定向放宽**：原文"完整精度、不提前 round"对 **kg 存储仍成立**；放宽点是 **lb 录入落库取整到 0.5kg** + **训练组重量显示量化**。需同步更新 `CLAUDE.md` 铁律 2 与 `docs/06`/`docs/07` 措辞，避免规范与实现脱节。
- **被否**：① 只在存储取整、显示照旧 1 位小数——清不掉历史预填的 44.9，不满足"所有出现的数字"。② 把 `toDisplay` 全局改 0.5——会误伤体重显示（0.1 粒度有意义）。

### D3：硬拉曲线变式聚合，当日取主力组最大（问题 3）
- 家族单一来源：`curveConfig.DEADLIFT_FAMILY = ['deadlift','rdl','stiff_leg_deadlift']` + `familyFor(id)`（仅 `deadlift` 锚点展开，其余返回 `[id]`）。`FIXED_CHARTS` 硬拉项 `ids: DEADLIFT_FAMILY`，保留 `id:'deadlift'`（详情跳转、重复校验锚点）。
- `utils/util.js` 新增纯函数 `dayLiftValue(workout, ids)`：取该 workout 中 `exerciseId ∈ ids` 的各动作，分别算 `mainWorkingWeight`，返回其中最大值（无则 null）。单 id 曲线传 `[id]` 退化为原行为。
- `pages/curve/curve.js` lift 单线构建：`const ids = c.ids || [c.id]; const y = util.dayLiftValue(w, ids)`，其余（range 过滤、排序、断线）不变。
- **详情页同步聚合**（`pages/exercise/detail.js`）：`this.ids = curveConfig.familyFor(id)`；曲线按 `dayLiftValue` 逐次训练取家族当日最大（与首页同口径），历史列出家族内每个变式各一条并标注变式名（`isFamily` 时）。否则点硬拉曲线进详情会因只查 `deadlift` 而空白——这是用户报告的缺陷。每条历史按其所属变式的 `loadType` 与 PR 计算。
- 口径自洽：每变式先按既有"主力工作组重量"（组数最多的重量）求值，再当日取最大；不引入"最重单组"新口径。PR 仍按单一 exerciseId（本 change 不改 PR 口径；详情家族历史各按自身变式标 PR）。
- 单独把 `rdl`/`stiff_leg_deadlift` 加为自定义曲线时仍是单动作（`familyFor` 不展开非锚点），其详情不聚合——聚合是「硬拉」固定曲线的专属语义。
- **被否**：① 详情维持单一 `deadlift`、首页聚合而详情看单项——差异导致点进去空白，用户明确拒绝。② 把三个变式都标 `isMainLift` / 改动作库——动作库分类（rdl/直腿在腘绳肌）有意义，不应为曲线聚合而改；聚合只发生在取数层。

## Risks / Trade-offs

- **0 重量组增多**：保留全部动作会让 `workouts` 体积略增、训练详情出现多行 0。已确认对聚合无害；详情展示 0 是用户明确期望。
- **铁律放宽的认知成本**：lb 取整是 kg/lb 间唯一的"非完整精度"点，集中在 `unit.js` 一处并写明，风险可控。
- **历史不一致**：老的脏小数 kg 与新数据并存；可接受（不重写历史是既定原则），编辑旧记录保存即归一。
- 纯函数化（`roundHalfKg`/`dayLiftValue`）便于单测，符合"纯逻辑必补单测"。

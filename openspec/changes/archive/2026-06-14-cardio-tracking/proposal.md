# Proposal: cardio-tracking

## Why

现在只能记力量训练（重量×次数）。有氧训练（跑步/走路/椭圆机/单车/爬楼梯）是训练的另一大类，指标完全不同（时间+距离 / 时间+层数），用户需要把它也记进训练时间线，与力量共享日历与历史。

## What Changes

- `workouts` 新增可缺省字段 `type: 'strength' | 'cardio'`（旧记录/缺省 = strength）。
- 新增 **7 个有氧活动**（内置动作库 `category:'有氧'`，置于「其他」之后）：室内/室外跑步、室内/室外走路、椭圆机、单车（指标=时间min+距离km）；爬楼梯（指标=时间min+层数）。`kind:'cardio'` + `metrics` 描述。
- 新增预设模板 **「有氧训练」**（分组「有氧」，与三分化/二分化并列），选中即开一条 `type:'cardio'` 训练。
- 训练录入页按 type 分支：cardio 训练录入时长/距离（或层数），**不出现组/重量/单位段控**；动作选择面板展示「有氧」类。
- 训练列表、训练日历展示有氧：日历用独立颜色标记有氧日；列表显示"活动 时长·距离/层数"摘要。
- **本次不做**有氧进步曲线（配速/距离趋势）——留待后续。
- 一次训练只属一种 type（不与力量混录在同一条记录）。

## Capabilities

### New Capabilities

- `cardio-tracking`: 有氧训练的录入（按活动记时长+距离/层数）、列表与日历展示；`workouts.type` 区分力量/有氧；有氧天然不参与力量聚合（无 sets）。

### Modified Capabilities

- `template-management`: 预设新增分组「有氧」及模板「有氧训练」（type=cardio）；存量用户经 `user_prefs` 一次性标记补种。
- `training-calendar`: 日历按 `workout.type==='cardio'` 用独立颜色标记有氧日（不再仅按名称分化归类）。

## Impact

- `workouts`：新增 `type`（缺省 strength，旧记录无需迁移，铁律 6）；cardio 训练的 `exercises[]` 项携带 `duration`/`distance` 或 `duration`/`floors`，无 `sets`。
- `config/exercises.js`：加 7 个 `category:'有氧'` 活动（kind/metrics）；`config/templates.js`：加「有氧训练」预设。
- `utils/exerciseLib.js`：分类顺序「有氧」置于「其他」后。
- `utils/templateLib.js`：PRESET_GROUPS 加「有氧」；补种逻辑（用 `user_prefs` 标记，避免重复/复活）。
- `utils/calendar.js`：cardio 类型与配色。
- `pages/workout/edit`（cardio 录入分支）、`pages/workout/list`（cardio 摘要）、`pages/exercise/library`（有氧类展示）。
- 力量聚合（PR/容量/三大项曲线）**无需改**：有氧项无 sets，天然跳过。

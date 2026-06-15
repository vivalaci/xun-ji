# cardio-tracking Specification

## Purpose

有氧训练大类的记录与展示：7 个有氧活动（跑步/走路室内外、椭圆机、单车、爬楼梯），按时长 + 距离/层数录入；`workouts.type` 区分力量/有氧，一次训练只属一种。有氧项无 sets，天然不参与力量聚合（PR/容量/曲线）。进训练时间线与日历（独立配色）。本迭代不做有氧进步曲线。

## Requirements

### Requirement: 有氧活动库
系统 SHALL 内置 7 个有氧活动（`category:'有氧'`、`kind:'cardio'`），各带指标描述 `metrics`：室内跑步、室外跑步、室内走路、室外走路、椭圆机、单车 → `['duration','distance']`；爬楼梯 → `['duration','floors']`。「有氧」分类 SHALL 在动作分类顺序中置于「其他」之后。每个有氧活动有稳定 id（与力量动作同一命名空间，不冲突）。

#### Scenario: 动作选择展示有氧类
- **WHEN** 用户在 cardio 训练的动作选择面板浏览分类
- **THEN** 「有氧」类出现在分类列表「其他」之后，含上述 7 个活动

#### Scenario: 动作库管理可见
- **WHEN** 用户进入动作库管理页
- **THEN** 「有氧」类在「其他」之后展示这 7 个内置活动

### Requirement: 训练类型区分
`workouts` SHALL 带 `type: 'strength' | 'cardio'` 字段；缺省与旧记录视为 `strength`。一次训练只属一种 type，不混录力量与有氧。有氧训练的动作项 SHALL 携带 `duration`（分钟）与 `distance`（km）或 `floors`（层），不含 `sets`。

#### Scenario: 旧记录默认力量
- **WHEN** 读取无 `type` 字段的历史训练
- **THEN** 按 `strength` 处理，行为与现状一致

#### Scenario: 有氧不参与力量聚合
- **WHEN** 系统计算 PR / 容量 / 三大项与自定义曲线
- **THEN** 有氧训练项因无 `sets` 自然被跳过，不污染任何力量统计

### Requirement: 有氧训练录入
用户 SHALL 能从「有氧训练」模板开一条 cardio 训练，添加有氧活动并录入其指标（时长+距离，或爬楼梯的时长+层数）。cardio 录入界面 SHALL NOT 出现组/重量/次数/单位段控。保存经 `db.saveLocalFirst('workouts', { type:'cardio', ... })`，本地先落入队同步。

#### Scenario: 录入距离类有氧
- **WHEN** 用户在 cardio 训练添加「室外跑步」，录入时长 30、距离 5 并保存
- **THEN** 记录以 `{ exerciseId:'run_outdoor', duration:30, distance:5 }` 存入该训练 `exercises[]`，列表立即出现

#### Scenario: 录入爬楼梯
- **WHEN** 用户添加「爬楼梯」，录入时长 15、层数 60
- **THEN** 记录以 `{ exerciseId:'stairs', duration:15, floors:60 }` 存储（无 distance）

#### Scenario: 录入界面无力量控件
- **WHEN** 用户在 cardio 训练录入
- **THEN** 不显示重量/次数步进与「本次输入单位」段控，仅时长/距离（或层数）输入

### Requirement: 有氧在列表与日历展示
训练列表 SHALL 为 cardio 训练展示"活动 + 时长·距离/层数"摘要（而非组数/容量）；训练日历 SHALL 用独立颜色标记有氧训练日。

#### Scenario: 列表摘要
- **WHEN** 训练列表含一条室外跑步 30min/5km 的 cardio 训练
- **THEN** 该条显示有氧摘要（如「室外跑步 30min · 5km」），不显示组数/容量/PR

#### Scenario: 日历标记
- **WHEN** 某天有 cardio 训练
- **THEN** 该日期格显示有氧专属颜色圆点；点该天详情可见有氧活动并可进入编辑

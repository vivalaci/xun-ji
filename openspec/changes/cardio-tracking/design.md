# Design: cardio-tracking

## Context

`workouts` 现为力量模型：`exercises[].sets[]={weight,reps}`，PR/容量/三大项与自定义曲线全靠 sets。模板按组（三分化/二分化/我的）展示，选模板开训练。日历 `classify` 按训练名归类配色。动作库 `category` 分组，「其他」在末。`user_prefs` 单文档已存在（曲线配置）。

## Goals / Non-Goals

**Goals:**
- 记录有氧训练（7 活动，时长+距离 / 时长+层数），进训练时间线与日历。
- 不污染力量统计；旧数据零迁移。
- 复用现有模板/选择/列表/日历框架。

**Non-Goals:**
- 不做有氧进步曲线（配速/距离趋势）——后续迭代。
- 不支持一次训练混录力量+有氧。
- 距离暂只 km、不做 mile（与"只 kg"同思路）。

## Decisions

### D1：`workouts.type` 区分；有氧项无 sets 天然隔离
- 新增 `type:'strength'|'cardio'`（缺省/旧记录 = strength）。
- cardio 训练 `exercises[]` 项形如 `{exerciseId,name,duration,distance}` 或 `{...,duration,floors}`，**无 sets**。
- 关键利好：`mainWorkingWeight(undefined)`→null、`totalVolume`/`totalSets` 遇无 sets 自然跳过、曲线按 exerciseId 匹配力量 id——**力量聚合无需任何改动**即排除有氧。

### D2：有氧活动入内置动作库（kind/metrics），「有氧」类置末
- 7 活动加进 `config/exercises.js`，`category:'有氧'`、`kind:'cardio'`、`metrics`：距离类 `['duration','distance']`，爬楼梯 `['duration','floors']`。id：run_indoor/run_outdoor/walk_indoor/walk_outdoor/elliptical/cycling/stairs。
- `exerciseLib` 分类顺序把「有氧」排在「其他」之后（力量类不变）。
- 复用动作选择面板与搜索；cardio 录入时面板展示「有氧」类。

### D3：录入页按 type 分支
- 选「有氧训练」模板 → `type='cardio'`，录入界面渲染**有氧项卡片**：每活动一组 时长(min) + 距离(km)（或层数）数字输入；无组/重量/次数步进、无「本次输入单位」段控。
- 力量路径（其余模板/空白）维持现状 `type='strength'`。
- 保存：cardio 收集 `{exerciseId,name,duration,distance|floors}`，`db.saveLocalFirst('workouts',{type:'cardio',...})`。

### D4：日历有氧配色 `#EA580C` 橙（可调）
- `calendar.aggregateByDate` 对 `workout.type==='cardio'` 直接归「有氧」类型（不过 `classify` 名称归类）；新增 TYPES.cardio 橙 `#EA580C`——与首页现有色（蓝/青/紫/上肢绿/下肢玫红/其他灰/体重黑/体脂灰/腰围琥珀/自定义红·品红）区分。

### D5：有氧预设补种用 `user_prefs` 标记（避免复活）
- 全新用户：播种含「有氧训练」（group「有氧」、type cardio）。
- 存量用户（已有 group 的模板）：`ensureTemplatesSeeded` 检查 `user_prefs.seededCardio`，未标记则补种「有氧训练」并置标记；已标记不再补种 → 删除不复活。
- `templateLib.PRESET_GROUPS` 加「有氧」（排序：三分化 → 二分化 → 有氧 → 我的模板）。

### D6：训练列表有氧摘要
- `pages/workout/list` decorate 按 type 分支：cardio 显示"活动名 时长·距离/层数"摘要，不算组数/容量/PR。

## Risks / Trade-offs

- [exercises[] 异形] 同数组承载两种形状（sets vs duration/distance）——靠 `type` 分流读取；力量侧因无 sets 天然安全。
- [补种标记位置] 复用 user_prefs 存 `seededCardio`，与曲线配置同文档；轻量，无新集合。
- [混合训练不支持] 想同日力量+有氧 → 记两条训练（日历同日显两色点），可接受。

## Open Questions

（无）

## Context

模板与训练记录的数据结构高度重合：都是按 `exerciseId` 排列的动作列表。模板存于 `workout_templates`（`{name, group, order, exercises:[{exerciseId, targetSets?, repLow?, repHigh?}], type?}`），记录存于 `workouts`（`{name, date, type, templateId, exercises:[{exerciseId, name, sets:[{weight,reps}]}]}`）。当前把"练过的组合"变成模板，只能去模板管理页从零新建空模板再逐个加动作。本变更让一条历史记录一键转成「我的模板」。

约束：架构铁律——云读写只走 `utils/db.js`；不改 4 集合既有字段；分组纯函数 `templateLib.groupTemplates` 带单测；`pages/workout/edit.js` 同时承载新建与编辑两种状态。

## Goals / Non-Goals

**Goals:**
- 编辑已有记录时一键把当前动作组合存为「我的模板」，零手动搭建。
- 「我的模板」分组置顶，存完即在选模板页最显眼处可见。
- 力量、有氧记录走同一映射路径。
- 不动既有字段、不加集合、无迁移。

**Non-Goals:**
- 不在模板里保存重量/次数（模板是空壳，仅留动作与目标组数）。
- 不做重名检测/去重，不做名称编辑输入框。
- 不为"存为模板"新增删除入口——删除复用模板管理页与模板编辑页现有能力。
- 不改 `targetSets` 在按模板新建时的预填语义（沿用 edit.js `buildFromTemplate`）。

## Decisions

### D1：入口放在 `pages/workout/edit` 内容区顶部，仅编辑态显示
记录详情即编辑页（无独立详情页）。按钮条放内容区顶部（日期卡片之上），以 `data.id` 是否存在为渲染条件——新建训练（`stage==='pickTemplate'` / 无 id）不显示。
- 备选：放训练记录列表行（`workout/list`）。否决：离"正盯着这条记录"的心智更远，且列表行已有删除等动作，再塞按钮拥挤。
- 备选：自定义导航栏加按钮。否决：小程序默认导航栏不可塞自定义按钮，改自定义导航栏成本与风险都高。

### D2：映射只取 `exerciseId` + `targetSets`，不存重量/次数
`saveAsTemplate()` 把 `this.data.exercises` 映射为模板动作：力量取 `{exerciseId, targetSets: sets.length}`；有氧取 `{exerciseId}` 且模板带 `type:'cardio'`。`targetSets` 是 `buildFromTemplate` 无历史时铺组依据，故保留组数让下次按此模板新建能铺出正确空组数。
- 备选：再从已录次数推 `repLow/repHigh`。否决：单次记录的次数是结果不是目标，靠猜，易误导。
- 备选：只存 `exerciseId`（骨架）。否决：下次每个动作塌回单个空组，体验退化。

### D3：默认名 = 记录名 +「（我的）」，无输入框，不去重
确认窗只问"保存为我的模板？"，名称由记录名加固定后缀生成。预设二分化已有「上肢A」等名，后缀「（我的）」用于在选模板页区分来源、避免与预设视觉混淆。同一记录多次保存生成多条同名模板，接受重复（确定即存的最简心智）。
- 备选：弹输入框让用户命名。否决：与用户明确要的"仅确认窗"相悖。
- 备选：保存前查重并拦截。否决：增加状态与提示复杂度，收益低；用户可在模板管理页自行删除多余项。

### D4：分组置顶在纯函数 `groupTemplates` 内统一改
`templateLib.groupTemplates` 当前拼接顺序为 `预设组 → 其余具名组 → 我的模板（垫底）`。改为 `我的模板（若存在）置顶 → 预设组 → 其余具名组`。该函数同时被选模板页（`workout/edit`）与模板管理页（`template/manage`）调用，一处改两处生效，保证样式与顺序一致。空「我的模板」（无自建模板）不输出，预设自然占顶。
- 备选：只在选模板页 UI 层重排。否决：与管理页不一致，且绕开已有单测的纯函数，违背架构铁律 5/纯函数集中原则。

### D5：删除仅对「我的模板」开放，预设不可删除
模板管理页原先**每行**都渲染删除按钮（含预设），真机走查发现预设（App 托管）也能删，不符预期。改为：`decorate` 给每项打 `deletable = !isPresetGroup(group)`，`manage.wxml` 删除按钮 `wx:if="{{item.deletable}}"`，`onDelete` 再兜底拒绝预设（toast）。「我的模板」（含本变更存出的）继承删除/编辑能力不变；模板编辑页改动作能力不变。
- `isPresetGroup` 抽到 `templateLib`（纯函数、带单测），与 `PRESET_GROUPS` 同源。
- **与既有「预设删除不复活」口径的关系**：旧 spec 有「删除预设后版本重刷不复活」等防御场景；预设改为不可删除后，这些场景的触发路径在正常 UI 下不可达，但底层播种幂等保证不变，故不回改那些归档场景。
- 备选：JS 层不拦、仅 UI 隐藏。否决：catchtap 仍可能被构造触发，纯函数 + 双保险更稳。

## Risks / Trade-offs

- [同名模板堆积] 不去重 + 多次保存会在「我的模板」产生多条同名项 → 用户可在模板管理页删除；后缀「（我的）」与计数辅助辨识；v1 接受。
- [有氧动作无 targetSets] 有氧模板动作不带组次，`buildFromTemplate` 的 cardio 分支本就不读组次 → 无影响，符合现状。
- [记录含重复 exerciseId] 现状 `workout/edit` 新增动作不阻止重复，理论上一条记录可能同 id 出现两次，映射后模板含重复动作 → 与手工建模板时的去重行为略不一致；v1 原样映射（罕见且不影响功能），不额外去重，必要时由用户在模板编辑页移除。
- [置顶顺序回归] 改 `groupTemplates` 影响管理页与选模板页两处 → 由 `tests/algo.test.js` 增置顶顺序用例守护，并按指南走查清单自检两页。

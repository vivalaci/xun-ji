## Why

用户练完后常想把"这次练的动作组合"沉淀下来复用，但现状只能去模板管理页从零新建空模板再逐个加动作。让一条历史训练记录一键存为「我的模板」，把已经录好的动作组合直接转成可复用模板，省去重复搭建。

## What Changes

- 编辑**已有**训练记录的页面（`pages/workout/edit` 的 editing 阶段）内容区顶部新增【保存模板】按钮；新建训练时不显示该按钮。
- 点击后弹确认窗「保存为我的模板？」，确定即把当前记录映射为一条 `workout_templates`：
  - 动作仅取 `exerciseId`，并把该动作的**组数**写入 `targetSets`（不存重量/次数，不猜次数区间）。
  - 模板名 = 记录名 +「（我的）」后缀（如「上肢A（我的）」），无名称输入框。
  - `group` 留空（归「我的模板」），`order` 取末位。
  - 力量记录存 `type` 缺省（力量），有氧记录存 `type:'cardio'`，走同一套映射。
  - **不去重**：同一记录多次保存会生成多条同名模板（确定即存的最简心智）。
- 选模板界面与模板管理页把「我的模板」分组**置顶**（排在三分化之前），样式与其余分组一致。
- 存出的模板即普通自建模板：整体删除（模板管理页现有删除）、模板内动作增删改序（模板编辑页现有能力）均**复用现状**，不新增代码，仅在文档点明。

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `template-management`: 新增"训练记录存为模板"需求；修改"分组展示顺序"（「我的模板」由垫底改为置顶，选模板页与模板管理页一致）。

## Impact

- `pages/workout/edit.js` / `edit.wxml` / `edit.wxss`：顶部按钮条（仅 `id` 存在时渲染）、确认弹窗、`saveAsTemplate()` 映射 + `db.saveLocalFirst`。
- `utils/templateLib.js`：`groupTemplates` 把 `MY_GROUP_LABEL` 由末位改为首位拼接。
- `tests/algo.test.js`：补「我的模板」置顶顺序、记录→模板映射（含 `targetSets`、有氧 `type:'cardio'`）用例。
- `openspec/specs/template-management/spec.md`：经 sync 落地新/改需求。
- `docs/usermanual.md`：补"把记录存为模板"操作说明。
- 不动 4 集合既有字段；`targetSets`、`type`、`group`、`order` 均为既有可缺省字段，无迁移。

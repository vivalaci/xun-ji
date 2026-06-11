# template-management Specification

## Purpose

训练模板的查看、重命名、增删，及模板内动作的编辑。模板存于 `workout_templates`，动作仅存 `exerciseId`，名称展示时从动作库按 id 取。

## Requirements

### Requirement: 模板列表管理
用户 SHALL 能在「我的」页进入训练模板管理，查看全部模板（含预设推/拉/腿），按 `order` 排序。

#### Scenario: 进入并展示
- **WHEN** 用户从「我的」页进入模板管理
- **THEN** 系统经 `db.ensureTemplatesSeeded` 确保预设已播种，列表展示每个模板名称与动作数量

### Requirement: 新建与删除模板
用户 SHALL 能新建空模板，也能删除任意模板。

#### Scenario: 新建
- **WHEN** 用户点击「新建模板」并命名
- **THEN** 系统经 `db.saveLocalFirst('workout_templates', ...)` 创建该模板，`order` 取末位

#### Scenario: 删除
- **WHEN** 用户删除某模板并确认
- **THEN** 系统经 `db.removeLocalFirst` 移除该模板，已有训练记录不受影响（记录存的是 exerciseId 快照）

### Requirement: 编辑模板内容
用户 SHALL 能在模板编辑页重命名模板、增删模板内动作、调整动作顺序。

#### Scenario: 重命名
- **WHEN** 用户修改模板名称并保存
- **THEN** 系统经 `db.updateLocalFirst` 更新 `name`

#### Scenario: 增删动作
- **WHEN** 用户从动作库添加一个动作或移除一个动作
- **THEN** 模板的 `exercises` 数组（仅存 `exerciseId`）相应增减，展示名称从动作库按 id 取

# template-management Delta

## MODIFIED Requirements

### Requirement: 预设模板分组
系统 SHALL 提供预设模板，分三组：三分化（推日、拉日、蹲日）、二分化（上肢、下肢）、有氧（有氧训练）。力量预设带默认动作清单（仅 `exerciseId`）；有氧预设「有氧训练」标记 `type:'cardio'`，选中后开一条 cardio 训练。

#### Scenario: 全新用户播种
- **WHEN** 新用户首次触发模板播种且云端无任何模板
- **THEN** 系统写入全部预设（三分化 3 套 + 二分化 2 套 + 有氧「有氧训练」1 套），各带对应 `group`，有氧训练带 `type:'cardio'`

#### Scenario: 有氧模板分组展示
- **WHEN** 用户进入模板管理或新建训练选模板
- **THEN** 「有氧」分组与三分化/二分化并列展示，含「有氧训练」

### Requirement: 新建训练按组选模板
新建训练的选模板界面 SHALL 按组分节展示模板（三分化、二分化、有氧、我的模板），并 SHALL 保留"空白训练"入口。选择有氧训练 SHALL 开一条 `type:'cardio'` 训练。

#### Scenario: 分组展示
- **WHEN** 用户进入新建训练的选模板阶段
- **THEN** 模板按"三分化 / 二分化 / 有氧 / 我的模板"分节展示，空组不显示节标题

#### Scenario: 选有氧训练
- **WHEN** 用户点击「有氧训练」
- **THEN** 进入 cardio 录入界面（添加有氧活动、录时长/距离/层数），`type='cardio'`

#### Scenario: 空白训练保留
- **WHEN** 用户点击"空白训练"
- **THEN** 进入空动作列表的力量录入界面（`type='strength'`），行为与现状一致

## ADDED Requirements

### Requirement: 有氧预设补种（存量用户）
对已完成分组迁移的存量用户，系统 SHALL 一次性补种「有氧训练」预设，并经 `user_prefs` 标记，确保**只补种一次**：用户此后删除「有氧训练」不会复活。

#### Scenario: 存量用户首次启动新版本
- **WHEN** 已有模板（含 group）的用户首次进入新版本且 `user_prefs` 未标记有氧已补种
- **THEN** 系统写入「有氧训练」预设并在 `user_prefs` 记录已补种标记

#### Scenario: 删除不复活
- **WHEN** 有氧已补种（已标记），用户删除了「有氧训练」
- **THEN** 后续启动不再补种，删除被尊重

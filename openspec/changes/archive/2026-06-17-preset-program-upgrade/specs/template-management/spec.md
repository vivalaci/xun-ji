# template-management Delta

## MODIFIED Requirements

### Requirement: 预设模板分组
系统 SHALL 提供预设模板，分三组：三分化（推日、拉日、蹲日）、二分化（上肢A、下肢A、上肢B、下肢B）、有氧（有氧训练）。力量预设的每个动作 SHALL 带可缺省的目标组次字段 `targetSets`（目标组数）、`repLow`/`repHigh`（次数区间），动作组成与目标按 docs/09 训练计划设计。有氧预设「有氧训练」标记 `type:'cardio'`，其动作无组次目标。

#### Scenario: 全新用户播种
- **WHEN** 新用户首次触发模板播种且云端无任何模板
- **THEN** 系统写入全部预设（三分化 3 套 + 二分化 4 套 + 有氧 1 套），力量预设动作带 `targetSets`/`repLow`/`repHigh`，并记 `user_prefs.presetVersion` 为当前版本

#### Scenario: 二分化四套
- **WHEN** 用户查看二分化组
- **THEN** 含 上肢A、下肢A、上肢B、下肢B 四套（A 偏力量、B 偏肥大，错开重复疲劳）

### Requirement: 新建训练按组选模板
新建训练的选模板界面 SHALL 按组分节展示模板（三分化、二分化、有氧、我的模板），并 SHALL 保留"空白训练"入口。选择「有氧训练」SHALL 开一条 `type:'cardio'` 训练。

#### Scenario: 分组展示
- **WHEN** 用户进入新建训练的选模板阶段
- **THEN** 模板按"三分化 / 二分化 / 有氧 / 我的模板"分节展示，空组不显示节标题

#### Scenario: 分组循证说明
- **WHEN** 用户在选模板界面查看「二分化」「三分化」分组
- **THEN** 该组标题下显示一段循证说明（来源 docs/09），讲清该分化的适用人群、频率与设计逻辑，帮助用户理解为何这样设计

#### Scenario: 选有氧训练
- **WHEN** 用户点击「有氧训练」
- **THEN** 进入 cardio 录入界面，`type='cardio'`

#### Scenario: 空白训练保留
- **WHEN** 用户点击"空白训练"
- **THEN** 进入空动作列表的力量录入界面（`type='strength'`）

## ADDED Requirements

### Requirement: 模板目标组次预填
力量训练按模板新建时，系统 SHALL 依据模板动作的目标组次预填：无该动作历史时按 `targetSets` 铺对应组数；每个动作 SHALL 在组旁显示 `repLow-repHigh` 次数区间提示（若有）。有历史（上一次同模板训练）时 SHALL 仍优先复用上次实际重量/组（渐进超负荷优先），区间提示照常显示。缺目标字段的模板/动作按现状（默认 1 组、无提示）。

#### Scenario: 首次按目标铺组
- **WHEN** 用户选模板新建训练，某动作目标为 4×5–8 且无历史
- **THEN** 该动作铺 4 个空组，组旁显示「5–8 次」提示

#### Scenario: 有历史优先复用
- **WHEN** 该动作上一次同模板训练有实际记录
- **THEN** 预填上次的重量/组（渐进超负荷优先），区间提示仍显示

#### Scenario: 缺字段兼容
- **WHEN** 模板动作无 `targetSets`（旧模板或自建）
- **THEN** 按现状默认 1 组、无区间提示，不报错

### Requirement: 预设版本重刷
系统 SHALL 以 `user_prefs.presetVersion` 跟踪预设版本；当用户版本落后于当前预设版本时，SHALL 把预设组（三分化/二分化/有氧）的模板重刷为当前版本并更新 `presetVersion`，**「我的模板」（自建、group 为空）不受影响**。预设视为 App 托管：用户对预设的改动会在版本重刷时被覆盖（如需保留自定义应复制到「我的模板」）。

#### Scenario: 存量用户升级
- **WHEN** 存量用户（`presetVersion` 缺失或落后）进入新版本
- **THEN** 系统删除现有预设组模板、写入新版预设，并置 `presetVersion` 为当前；自建「我的模板」原样保留

#### Scenario: 已是最新不重刷
- **WHEN** 用户 `presetVersion` 已是当前版本
- **THEN** 不重刷，保留现状（含用户对预设的任何改动）

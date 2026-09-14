## ADDED Requirements

### Requirement: 内置动作中文命名
内置动作 SHALL 使用规范中文名。以下内置动作 SHALL 更名（id 不变）：`db_kickback` 哑铃俯身臂屈伸、`incline_db_curl` 上斜哑铃弯举、`rear_delt_fly` 俯身哑铃飞鸟、`overhead_extension` 哑铃颈后臂屈伸、`tricep_pushdown` 直杆下压、`rope_pushdown` 粗绳下压、`cable_pull_through` 绳索髋屈伸、`step_up` 哑铃登阶、`db_press` 站姿哑铃推举、`side_plank` 侧平板支撑、`t_bar_row` T杠划船、`glute_ham_raise` GHR臀腿提升。更名动作的旧名 SHALL 保留为别名，使按旧名搜索仍能命中。别名「斜托弯举」SHALL 归属 `preacher_curl`（牧师凳弯举）而非 `incline_db_curl`。

系统 SHALL 新增内置动作 `seal_row`（海豹划船，分类「背」），与 `t_bar_row`（T杠划船）为两个独立动作；别名「海豹划船」「俯卧划船」「seal row」SHALL 归属 `seal_row`，MUST NOT 保留在 `t_bar_row` 上。内置动作总数为 101。

#### Scenario: 按旧名搜索
- **WHEN** 用户在动作库或「添加动作」面板搜索「哑铃后撑」
- **THEN** 命中「哑铃俯身臂屈伸」

#### Scenario: 斜托弯举指向牧师凳弯举
- **WHEN** 用户搜索「斜托弯举」
- **THEN** 结果含「牧师凳弯举」，不含「上斜哑铃弯举」

#### Scenario: 海豹划船与 T杠划船分开
- **WHEN** 用户搜索「海豹划船」
- **THEN** 结果仅含新增的「海豹划船」（`seal_row`），不含「T杠划船」

#### Scenario: 更名不影响历史聚合
- **WHEN** 用户查看已更名动作（如 `t_bar_row`）的详情、曲线与 PR
- **THEN** 数据按原 id 聚合，更名前后的记录连续显示

### Requirement: 历史记录动作名实时解析
训练记录中的动作名称 SHALL 在显示时按 `exerciseId` 实时解析：动作仍可解析（含 hidden）时 SHALL 显示当前名称；动作已不存在（如自建动作被删除、全局动作被删除）时 SHALL 显示该记录保存时写入的名称；二者皆无时 SHALL 显示「已删除动作」。适用于训练编辑页（力量与有氧）、训练列表有氧摘要与动作详情页的变式标注。保存训练时 SHALL 继续写入动作名称，作为回退依据。

#### Scenario: 改名后老记录显示新名
- **WHEN** 用户打开一条更名前保存、含「哑铃后撑」的训练记录
- **THEN** 编辑页显示「哑铃俯身臂屈伸」

#### Scenario: 已删除自建动作显示保存时名称
- **WHEN** 某训练记录引用的自建动作已被删除，该记录保存时写入的名称为「我的划船」
- **THEN** 训练编辑页显示「我的划船」，而非「已删除动作」

#### Scenario: 无保存名称的已删除动作
- **WHEN** 某记录引用的动作已不存在，且该记录未保存名称
- **THEN** 显示「已删除动作」

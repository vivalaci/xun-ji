# per-entry-input-unit Specification

## ADDED Requirements

### Requirement: 本次输入单位段控
新建/编辑训练页 SHALL 提供「本次输入单位」段控（kg / lb），默认选中用户主单位（`unit.currentUnit()`，来自「我的-设置」）。段控作用于整个录入会话的全部重量输入。

#### Scenario: 默认主单位
- **WHEN** kg 主用户进入新建训练
- **THEN** 段控默认选中 kg，重量按 kg 输入

#### Scenario: lb 主用户对称
- **WHEN** lb 主用户进入新建训练
- **THEN** 段控默认选中 lb，重量按 lb 输入

### Requirement: 切换输入单位即时换算显示
切换「本次输入单位」时，系统 SHALL 将当前所有已显示的重量值就地从原单位换算为新单位展示（保持所指实际重量不变），且重量步进 SHALL 随新单位变化（kg 步进 2.5、lb 步进 5）。

#### Scenario: 切换重新表达数值
- **WHEN** 输入单位为 kg、某组显示 100，用户切到 lb
- **THEN** 该组显示约 220.5（100kg 的 lb 值），步进变为 5

#### Scenario: 预填值随当前单位
- **WHEN** 选模板后预填了上次同类训练的重量，用户切换输入单位
- **THEN** 预填值一并换算为新单位显示，保存仍正确

### Requirement: 按输入单位存储为 kg
保存时系统 SHALL 按段控所选输入单位将重量换算为 kg 落库（恒 kg、完整精度、不提前 round），换算经 `utils/unit.js`。

#### Scenario: lb 输入存 kg
- **WHEN** 输入单位为 lb、用户录入 225 并保存
- **THEN** 系统经 `unit.toStoreFrom(225,'lb')` 存 225×0.453592 kg，完整精度

#### Scenario: kg 输入直接存
- **WHEN** 输入单位为 kg、用户录入 100 并保存
- **THEN** 直接存 100 kg，无换算

### Requirement: 纯输入便利不改显示与记录单位
本能力 SHALL 仅影响录入时的数值解读，不改变主单位与全 App 显示；记录 SHALL NOT 持久化原始输入单位，保存后该记录在列表/曲线/详情中按主单位显示。

#### Scenario: 保存后按主单位显示
- **WHEN** kg 主用户本次切 lb 录入 225（存 102.06 kg），返回查看
- **THEN** 训练详情/曲线按主单位 kg 显示该重量（约 102），不显示 lb 原值

#### Scenario: 范围仅训练录入
- **WHEN** 用户进入身体数据录入或其他页面
- **THEN** 不出现「本次输入单位」段控，行为不变

# per-entry-input-unit Specification

## ADDED Requirements

### Requirement: 每个动作的输入单位段控
新建/编辑训练页 SHALL 为**每个动作**在其标题行提供 kg/lb 单位段控，默认选中用户主单位（`unit.currentUnit()`）。不同动作 SHALL 可各自选择不同输入单位（贴合 kg/lb 器械混用：本动作 kg、下一动作 lb）。

#### Scenario: 默认主单位
- **WHEN** kg 主用户添加一个动作
- **THEN** 该动作单位段控默认 kg，其重量按 kg 输入

#### Scenario: 不同动作不同单位
- **WHEN** 用户把动作 A 设为 kg、动作 B 设为 lb
- **THEN** 两动作各自按所选单位输入与换算，互不影响

### Requirement: 切换动作单位即时换算显示
切换某动作的单位时，系统 SHALL 仅将**该动作**各组已显示重量就地从原单位换算为新单位展示（保持所指实际重量不变），且该动作的重量步进 SHALL 随新单位变化（kg 2.5、lb 5）。

#### Scenario: 切换重新表达数值
- **WHEN** 某动作单位为 kg、某组显示 100，用户把该动作切到 lb
- **THEN** 该组显示约 220.5，该动作步进变为 5，其它动作不受影响

#### Scenario: 预填值随动作单位
- **WHEN** 选模板预填了重量，用户切换某动作单位
- **THEN** 该动作预填值一并换算为新单位显示，保存仍正确

### Requirement: 按动作单位存储为 kg
保存时系统 SHALL 按各动作所选单位将其重量换算为 kg 落库（恒 kg、完整精度、不提前 round），换算经 `utils/unit.js`。

#### Scenario: lb 动作存 kg
- **WHEN** 某动作单位为 lb、录入 225 并保存
- **THEN** 系统经 `unit.toStoreFrom(225,'lb')` 存 225×0.453592 kg

#### Scenario: kg 动作直接存
- **WHEN** 某动作单位为 kg、录入 100 并保存
- **THEN** 直接存 100 kg，无换算

### Requirement: 纯输入便利不改显示与记录单位
本能力 SHALL 仅影响录入时的数值解读，不改变主单位与全 App 显示；记录 SHALL NOT 持久化原始输入单位，保存后该记录在列表/曲线/详情中按主单位显示。

#### Scenario: 保存后按主单位显示
- **WHEN** kg 主用户把某动作切 lb 录入 225（存 102.06 kg），返回查看
- **THEN** 训练详情/曲线按主单位 kg 显示该重量（约 102），不显示 lb 原值

#### Scenario: 范围仅训练录入
- **WHEN** 用户进入身体数据录入或其他页面
- **THEN** 不出现单位段控，行为不变

### Requirement: 重量显示去浮点长尾
所有重量显示 SHALL 经 `unit.js` round，避免 lb↔kg 换算产生的浮点长尾（如 60.010270551000005）。三大项/自定义动作的**进步曲线** SHALL 取整显示；体重曲线及录入/历史明细 SHALL 保留至多 1 位小数（避免半 kg 丢失）。存储仍为完整精度 kg。

#### Scenario: 曲线取整
- **WHEN** 某 lb 录入换算得 60.0102… kg，在首页/动作详情曲线展示
- **THEN** 曲线数值与坐标轴显示为整数（如 60），不出现长小数

#### Scenario: 明细保留半 kg
- **WHEN** 某组实为 62.5 kg
- **THEN** 录入框与历史明细显示 62.5，不被取整为 62/63

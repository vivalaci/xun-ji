## ADDED Requirements

### Requirement: 设置页
用户 SHALL 能从「我的」页进入设置页，调整重量单位偏好。

#### Scenario: 进入设置
- **WHEN** 用户进入设置页
- **THEN** 页面展示当前重量单位（kg/lb），默认 kg

### Requirement: 重量单位切换
用户 SHALL 能在 kg 与 lb 之间切换重量单位，切换后全 App 的重量显示与输入步进随之改变，落库恒为 kg。

#### Scenario: 切到 lb
- **WHEN** 用户将单位切换为 lb
- **THEN** 偏好写入本地 `settings`，`unit.currentUnit()` 返回 `lb`，所有重量经 `toDisplay`（kg/0.453592）显示为 lb，步进变为 5

#### Scenario: 落库恒为 kg
- **WHEN** 用户在 lb 模式下输入重量并保存
- **THEN** 系统经 `unit.toStore`（lb×0.453592）转换为 kg 后落库，存完整精度不提前 round

#### Scenario: 业务代码零改动
- **WHEN** 启用 lb 支持
- **THEN** 仅 `utils/unit.js` 的 `currentUnit()` 改为读取设置，调用方代码无需改动

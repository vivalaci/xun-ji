## MODIFIED Requirements

### Requirement: 曲线配置持久化
曲线首页的展示顺序与自定义曲线列表 SHALL 持久化为用户偏好（集合 `user_prefs` 单文档），经数据访问层缓存优先读、本地先写同步，跨设备一致、离线可用。无配置时 SHALL 按默认顺序展示固定 3 项（卧推、深蹲、硬拉）。身体趋势合并图不再属于曲线首页（已迁至「身体」页）。

#### Scenario: 首次使用无配置
- **WHEN** 用户从未自定义过曲线
- **THEN** 首页按默认顺序展示固定 3 项（卧推、深蹲、硬拉）

#### Scenario: 配置跨设备同步
- **WHEN** 用户在设备 A 调整顺序或添加自定义曲线后，在设备 B（同一微信）打开首页
- **THEN** 设备 B 云端刷新后呈现与设备 A 一致的曲线顺序与自定义曲线

#### Scenario: 离线调整
- **WHEN** 用户离线状态下调整顺序或增删自定义曲线
- **THEN** 本地立即生效，写入进待同步队列，联网后自动同步

#### Scenario: 旧配置自愈
- **WHEN** 存量 `user_prefs` 的 `curveOrder` 仍含已废弃键（如 `weight`/`bodyFat`/`body`）
- **THEN** `composeCharts` 剔除这些未知键，仅渲染固定 3 项与有效自定义曲线，不报错

### Requirement: 删除自定义曲线与固定曲线保护
编辑模式中自定义曲线 SHALL 可删除（仅删曲线配置，不动训练数据）；固定 3 项（卧推/深蹲/硬拉）SHALL 不提供删除入口。

#### Scenario: 删除自定义曲线
- **WHEN** 用户在编辑模式删除"高位下拉"曲线并完成
- **THEN** 首页不再展示该曲线，其训练记录不受影响；添加入口重新可用

#### Scenario: 固定项无删除入口
- **WHEN** 用户在编辑模式查看卧推/深蹲/硬拉行
- **THEN** 这些行只有排序按钮，没有删除按钮

## REMOVED Requirements

### Requirement: 身体趋势合并图各指标线可辨渲染
**Reason**: 身体趋势合并图从曲线首页迁移至「身体」页显示，该渲染要求随图迁移。
**Migration**: 同等的「平线错位 + 最小尺度」渲染要求并入 `body-tracking` 能力的「身体页趋势图」要求；`utils/chart.js` 的 `drawMultiLine` 绘制逻辑不变，仅调用方从 `pages/curve` 改为 `pages/body`。

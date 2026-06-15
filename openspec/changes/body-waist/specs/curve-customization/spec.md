# curve-customization Delta

## MODIFIED Requirements

### Requirement: 曲线配置持久化
曲线首页的展示顺序与自定义曲线列表 SHALL 持久化为用户偏好（集合 `user_prefs` 单文档），经数据访问层缓存优先读、本地先写同步，跨设备一致、离线可用。无配置时 SHALL 按默认顺序展示固定 4 项（卧推、深蹲、硬拉、身体趋势合并图）。

#### Scenario: 首次使用无配置
- **WHEN** 用户从未自定义过曲线
- **THEN** 首页按默认顺序展示固定 4 项（三大项 + 身体趋势），行为与现状一致

#### Scenario: 配置跨设备同步
- **WHEN** 用户在设备 A 调整顺序或添加自定义曲线后，在设备 B（同一微信）打开首页
- **THEN** 设备 B 云端刷新后呈现与设备 A 一致的曲线顺序与自定义曲线

#### Scenario: 旧配置自愈
- **WHEN** 存量 `user_prefs` 的 `curveOrder` 仍含旧键 `weight`/`bodyFat`
- **THEN** `composeCharts` 剔除未知旧键、补入 `body` 合并项，渲染正常不报错

### Requirement: 删除自定义曲线与固定曲线保护
编辑模式中自定义曲线 SHALL 可删除（仅删曲线配置，不动训练数据）；固定 4 项（卧推/深蹲/硬拉/身体趋势）SHALL 不提供删除入口。

#### Scenario: 删除自定义曲线
- **WHEN** 用户在编辑模式删除某自定义曲线并完成
- **THEN** 首页不再展示该曲线，其训练记录不受影响；添加入口重新可用

#### Scenario: 固定项无删除入口
- **WHEN** 用户在编辑模式查看卧推/深蹲/硬拉/身体趋势行
- **THEN** 这些行只有排序按钮，没有删除按钮

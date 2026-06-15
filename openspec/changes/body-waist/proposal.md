# Proposal: body-waist

## Why

体脂率测量门槛高（需体脂秤/卡尺，且家用设备误差大、不便），很多用户难以稳定记录。腰围只需一把软尺即可测，是腹部脂肪与体脂变化的低成本、可重复的代理指标。增加腰围录入并提示其价值，让"体脂不便测量时也能追踪身体成分趋势"。

## What Changes

- `body_records` 新增可缺省字段 `waist`（腰围，cm，选填）。
- 身体数据录入页新增「腰围(cm)」选填输入，并展示提示：腰围是重要数据，体脂不便测量时可用腰围替代追踪。
- 身体数据列表、详情展示腰围（有值时）。
- **首页身体可视化重设计**：原"体重、体脂两张独立单线图"合并为**一张三线趋势图**（体重/体脂/腰围，三色），**每条线各自缩放**只看趋势形状，配图例显示三者最新实际值。
- `chart.js` 新增多线绘制能力（每线独立缩放）。
- 不做单位换算（cm 与体脂 % 不经 kg 换算层）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `body-tracking`: 录入项扩为「体重+体脂+腰围」（腰围选填）；录入页加价值提示；列表/详情展示腰围；首页趋势从"体重+体脂两条独立线"改为"体重/体脂/腰围三线合并图"。
- `curve-customization`: 首页固定曲线由 5 条（卧推/深蹲/硬拉/体重/体脂）改为 **4 项**（卧推/深蹲/硬拉 + 身体趋势合并图）；身体趋势作为一个可排序、不可删的固定项。

## Impact

- `body_records`：新增 `waist`——选填、可缺省，旧记录视为未填，无需迁移（铁律 6）。
- `pages/body/edit`：加腰围输入 + 提示。`pages/body/body`、`pages/body/detail`：展示腰围。
- `utils/chart.js`：新增 `drawMultiLine`（多线、每线独立缩放）。
- `utils/curveConfig.js`：固定项 weight/bodyFat 合并为单个 `body`（type=bodyCombined）；`composeCharts` 自愈处理旧 prefs 的 weight/bodyFat 键。
- `pages/curve`：身体合并图卡片（图例 + 三线 canvas）。
- 无单位换算、无集合/字段破坏（仅新增 `waist`）。

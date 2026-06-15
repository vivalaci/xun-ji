# Tasks: body-waist

## 1. 录入页（pages/body/edit）

- [x] 1.1 data 加 `waist`；载入既有记录时回填 `waist`
- [x] 1.2 加「腰围(cm)」选填输入 + `onWaistInput`
- [x] 1.3 保存 payload 加 `waist`（空→null，不经 unit 换算）
- [x] 1.4 腰围输入下加价值提示文案（muted 小字）

## 2. 列表与详情

- [x] 2.1 `pages/body/body`：decorate 带 `waist`，列表项有值时显示「腰 {{waist}}cm」
- [x] 2.2 `pages/body/detail`：render 带 `waist`，有值时展示腰围

## 3. 身体合并趋势图

- [x] 3.1 `utils/chart.js` 加 `drawMultiLine({canvas,ctx,width,height,dpr,series})`：每条 series 按自身 min/max 独立缩放，缺值断线，各色画线+点
- [x] 3.2 `utils/curveConfig.js`：FIXED_CHARTS 的 weight/bodyFat 合并为单个 `body`（type=bodyCombined，带三 series 定义）；`composeCharts` 自愈旧键 weight/bodyFat
- [x] 3.3 `pages/curve`：bodyCombined 卡片——构建体重/体脂/腰围三 series（体重 toDisplay、体脂/腰围原值），图例显示三者最新值（或"—"），调 drawMultiLine
- [x] 3.4 编辑模式：`body` 作为可排序、不可删固定行（名称"身体趋势"）
- [x] 3.5 样式：图例三色点 + 值

## 4. 验证

- [x] 4.1 `tests/algo.test.js`：补 `composeCharts` 含 `body` 固定项 + 旧键(weight/bodyFat)自愈用例；其余全绿
- [x] 4.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿
- [ ] 4.3 模拟器走查：录入腰围→列表/详情显示+提示；首页身体图三线独立缩放+图例；只记体重时只画一条线、图例其余"—"；旧 prefs 不报错；编辑模式身体趋势可排序不可删
- [x] 4.4 提请用户真机验证并给出验证点清单

## 5. 文档同步

- [x] 5.1 docs/06 `body_records` 补 `waist`；docs 曲线/首页描述更新身体合并图；README 如需

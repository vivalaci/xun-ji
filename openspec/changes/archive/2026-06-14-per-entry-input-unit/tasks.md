# Tasks: per-entry-input-unit

## 1. 换算层（utils/unit.js）

- [x] 1.1 新增 `toStoreFrom(value, srcUnit)`：srcUnit lb→×0.453592 转 kg，kg 直返（完整精度）
- [x] 1.2 新增 `toDisplayIn(kgValue, dstUnit)`：dstUnit lb→kg/0.453592 保留 1 位，kg 直返；null/'' 透传
- [x] 1.3 新增 `stepFor(unit)`：lb→5，kg→2.5；导出三者（现有函数不动）

## 2. 训练录入页（pages/workout/edit）——每个动作各自单位

- [x] 2.1 每个动作加 `unit` 字段（默认 `unit.currentUnit()`）；新增/预填/载入均带 unit
- [x] 2.2 预填/载入：每组重量用 `toDisplayIn(kg, ex.unit)` 显示
- [x] 2.3 动作标题行（名旁）加 kg/lb 段控；组表头单位随 ex.unit
- [x] 2.4 `onSwitchExerciseUnit(i,unit)`：仅该动作各组非空 weight 就地换算；步进 `stepFor(ex.unit)`
- [x] 2.5 保存：weight 用 `unit.toStoreFrom(s.weight, ex.unit)`
- [x] 2.6 段控样式（动作头部小号）

## 2b. 显示去浮点长尾（真机反馈）

- [x] 2b.1 `unit.toDisplay/toDisplayIn` round 到 1 位
- [x] 2b.2 `chart.drawLineChart` 加 `yDecimals`；curve/detail lift 传 0（取整）、body 传 1；curve `latest` lift 取整

## 3. 验证

- [x] 3.1 `tests/algo.test.js` 补用例：`toStoreFrom`/`toDisplayIn`/`stepFor` + 往返一致
- [x] 3.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿（33 测）
- [ ] 3.3 模拟器走查：kg 主用户切 lb 录入→存 kg→详情按 kg 显示；切换时已填/预填值就地换算且步进变；lb 主用户对称；身体页无段控（需用户在开发者工具执行）
- [x] 3.4 提请用户真机验证并给出验证点清单

## 4. 文档同步

- [x] 4.1 docs/06 补"主单位 vs 本次输入单位"说明

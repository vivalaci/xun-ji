## 1. 配色换值

- [x] 1.1 按 design D2 表更新 `utils/calendar.js` 的 `TYPES` 色值：推 `#4F46E5`、拉 `#2563EB`、蹲 `#0EA5E9`（蓝族）；上肢 `#15803D`、下肢 `#84CC16`（绿族）；有氧 `#EA580C`、其他 `#9CA3AF` 保留。注释标注所属系统色族。
- [x] 1.2 确认 `classify`/`aggregateByDate`/`monthMatrix` 签名与逻辑不变（仅色值变更）。

## 2. 图例按系统分组

> 注：日历在 `pages/curve/`（首页/曲线页），非 `pages/workout/list`（proposal/design 笔误）。且此前**无日历图例**，本组为新增分组图例。

- [x] 2.1 在 `utils/calendar.js` 导出 `LEGEND_GROUPS`（系统名 → 该组单日 {key,label,color}），作为色值单一真源，供页面复用。
- [x] 2.2 在 `pages/curve/curve.wxml` 日历卡片内新增分组图例：「三分化 / 二分化 / 有氧 / 其他」四组带小标题，组内列出单日色点；色值取自 `calendar.LEGEND_GROUPS`（经 `curve.js` 的 `calLegend`），不在 wxml/wxss 硬编码。
- [x] 2.3 在 `pages/curve/curve.wxss` 加图例分组样式（小标题 + 组内点排版）。

## 3. 测试与验证

- [x] 3.1 更新 `tests/algo.test.js`：推日色断言 `#1D4ED8`→`#4F46E5`；新增「图例按系统分组」用例；cardio 色 `#EA580C` 不变。
- [x] 3.2 跑全库语法检查（0 错）与 `node tests/algo.test.js`（64 用例通过）。
- [x] 3.3 模拟器走查：系统一眼可辨、族内单日可分、蹲日(天蓝)与上肢(深草绿)边界 OK——用户走查通过。

## 4. 文档与归档

- [x] 4.1 更新 `docs/usermanual.md` 日历配色/图例说明（按系统色族表述）+ 更新日期。
- [x] 4.2 真机/模拟器验证：用户确认日历与图例配色通过。
- [ ] 4.3 `/opsx:sync` + `/opsx:archive`，更新 README 进度区 + `docs/00-overview.md` 阶段表，归档打 tag。

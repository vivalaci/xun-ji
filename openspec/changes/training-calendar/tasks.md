# Tasks: training-calendar

## 1. 纯函数层（utils/calendar.js）

- [x] 1.1 `classify(name)`：按关键词归类返回 `{key,color}`（上肢/下肢先判，再推/拉/蹲，其余"其他"；配色见 design D2）
- [x] 1.2 `aggregateByDate(workouts)`：`{ dateStr: [{_id,name,type}] }`
- [x] 1.3 `monthMatrix(year, month, byDate, todayStr)`：周一起始网格，每格 `{day,dateStr,inMonth,isToday,dots,more,count}`（dots 上限 3，超出 more=N，整行非本月裁剪）
- [x] 1.4 `trainedDaysInMonth(byDate, year, month)`：当月不同训练日期数

## 2. 训练列表页（pages/workout/list）

- [x] 2.1 顶部嵌入日历区：月标题 + 上/下月切换 + 「本月训练 N 天」
- [x] 2.2 渲染月网格（配色圆点 + 超出折叠 +N），onShow/refresh 时基于 workouts 重算
- [x] 2.3 点击某天：有训练→选中态 + 下方详情卡（训练名 + 类型点），点条目 `navigateTo` edit；空白日→清选中
- [x] 2.4 月份状态（calYear/calMonth）默认当月，切换重算；today 由页面传入纯函数
- [x] 2.5 样式：网格、圆点、选中态、详情卡（遵循设计 token，与列表风格一致）

## 3. 验证

- [x] 3.1 `tests/algo.test.js` 补用例：classify（5 类 + 其他，上肢/下肢不被误判）、aggregateByDate、monthMatrix（周一起始/跨月补空/今日标记/dots 折叠）、trainedDaysInMonth
- [x] 3.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿（29 测）
- [ ] 3.3 模拟器走查：当月正确标注；多练多点；切换月份；点某天看详情并跳转；空白日清选中（需用户在开发者工具执行）
- [x] 3.4 提请用户真机验证并给出验证点清单

## 4. 文档同步

- [x] 4.1 README 目录结构加 `utils/calendar.js`、功能区补"训练日历"
- [x] 4.2 `docs/00-overview.md` 无口径变化，未改

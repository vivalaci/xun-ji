## 1. 选模板拆为独立页（① 返回导航）

- [x] 1.1 新建 `pages/workout/pick`（js/wxml/wxss/json），承接原 `pickTemplate` 阶段：`ensureTemplatesSeeded`、按组分节、`withDotColors` 分化色点、`GROUP_NOTES` 循证说明、"空白训练"入口
- [x] 1.2 `pick` 页点击模板 → `navigateTo workout/edit?templateId=<id>`；点"空白训练" → `navigateTo workout/edit?blank=1`
- [x] 1.3 `pages/workout/edit` 删除 `stage`/选模板分支与相关 data/方法（含 withDotColors/calendar 依赖）；`onLoad` 改为三路分派：`id`→`loadExisting`、`templateId`→按 id 取模板 `buildFromTemplate`、`blank`/其他→空白力量训练
- [x] 1.4 `buildFromTemplate`/`buildCardioItem`/历史预填/目标组次逻辑保留在 edit 页，strength/cardio 由模板 `type` 解析；缓存找不到模板时 `ensureTemplatesSeeded` 兜底、再找不到回退空白不抛错
- [x] 1.5 `pages/workout/list` 的"新建"入口由跳 `edit` 改为跳 `pick`；日历/列表"编辑既有训练"仍跳 `edit?id=`（未改）
- [x] 1.6 `app.json` 注册 `pages/workout/pick`
- [x] 1.7 走查返回链：列表→pick→edit 各级返回正确（见 4 验证，真机走查）

## 2. 训练编辑页动作调序（②）

- [x] 2.1 `pages/workout/edit.js` 增 `moveUp`/`moveDown`（复用模板页逻辑），力量与有氧共用同一 `exercises` 数组
- [x] 2.2 `pages/workout/edit.wxml` 动作/活动行的共用 ex-head 加 ↑/↓ 按钮（覆盖力量+有氧），首行 ↑、末行 ↓ 置灰
- [x] 2.3 `pages/workout/edit.wxss` 补 `.ex-ops`/`.ex-move` 样式
- [ ] 2.4 走查：上移/下移交换位置、组/时长数据随动作整体移动、保存后重开顺序保持

## 3. 身体趋势渲染修复（③）

- [x] 3.1 `utils/chart.js` 抽纯函数 `computeBand(ys, minSpan)`：实际跨度≥阈值按数据缩放、<阈值按 `minSpan` 居中扩展、单点/全等退化兜底
- [x] 3.2 `drawMultiLine` 接入 `minSpan`（每条线一份，显示单位计）并改用 `computeBand`
- [x] 3.3 `drawMultiLine` 近平线按序号做像素级垂直错位（步长 6px、padding 内夹取，扇形围绕中心），非平线不偏移
- [x] 3.4 `pages/curve/curve.js` 按指标供给 `minSpan`（体重 5、体脂 5、腰围 5，体重 convert 经 `unit.toDisplay` 换 lb）传入 `drawMultiLine`
- [x] 3.5 `tests/algo.test.js` 补 `computeBand` 用例（大于/小于阈值、单点±minSpan、全等、空数组兜底）
- [ ] 3.6 真机/模拟器走查：两条平线（体重+腰围）不重合遮挡、0.1kg 波动呈近平稳、显著变化照常缩放、`lb` 单位下一致

## 4. 验证与收尾

- [x] 4.1 语法校验：全量 `node --check` 通过
- [x] 4.2 算法单测：`node tests/algo.test.js` 全绿（85 测）
- [x] 4.3 同步 `docs/usermanual.md` + `config/manual.js`（同源）：选模板独立页/返回、训练动作调序
- [ ] 4.4 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 4.5 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

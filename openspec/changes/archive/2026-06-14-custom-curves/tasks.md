# Tasks: custom-curves

## 1. 纯函数层（utils/curveConfig.js）

- [x] 1.1 `composeCharts(prefs)`：默认 5 条合成、缺 key 追加、未知 key 剔除、自定义条目经 exerciseLib 取名（含占位回退）、按槽位取调色板色
- [x] 1.2 排序/增删辅助：`moveKey(order, key, dir)`、`addCustom(prefs, exerciseId)`（防重复、上限 2、取最小空闲槽位）、`removeCustom(prefs, key)`

## 2. 数据层（utils/db.js）

- [x] 2.1 `COLL.PREFS = 'user_prefs'`；`ensurePrefs()`：缓存优先 → 云端 → 不存在则 `saveLocalFirst` 建默认文档
- [x] 2.2 `updatePrefs(patch)`：经 `updateLocalFirst` 更新（兼容未同步的本地临时文档）

## 3. 曲线页（pages/curve/curve）

- [x] 3.1 `CHARTS` 常量改为 `composeCharts(prefs)` 动态合成；compute/draw/goDetail 改用合成结果（goDetail 对自定义曲线跳 `exercise/detail?id=`）
- [x] 3.2 编辑模式：长按卡片进入；紧凑行 + ↑/↓ 交换；⊝ 仅自定义行；「完成」持久化并重渲染
- [x] 3.3 添加曲线：底部常驻入口（满 2 条禁用 + 提示）；动作选择面板按分类渲染（已展示动作置灰），选中即添加并持久化
- [x] 3.4 样式：编辑模式行、↑/↓/⊝ 按钮、添加入口、面板（遵循设计 token）

## 4. 验证

- [x] 4.1 `tests/algo.test.js` 补用例：composeCharts（无配置默认、缺 key 自愈、未知 key 剔除、占位名、槽位配色）、moveKey 边界（首行上移/末行下移不动）、addCustom（防重复/上限/槽位复用）、removeCustom
- [x] 4.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿（24 测全过）
- [ ] 4.3 模拟器走查：默认 5 条不变；长按排序后顺序持久化（杀进程重进仍在）；加 2 条后入口禁用；删 1 条后槽位颜色复用；点自定义曲线进详情；离线调整联网后同步（需用户在开发者工具执行）
- [x] 4.4 提请用户真机验证（含先在云控制台建 `user_prefs` 集合，权限"仅创建者可读写"）并给出验证点清单
## 5. 文档同步

- [x] 5.1 README：建集合表加 `user_prefs`、目录结构加 `curveConfig.js`、功能描述更新
- [x] 5.2 `docs/00-overview.md` 进度区已更新（迭代三状态 + 建集合提醒）

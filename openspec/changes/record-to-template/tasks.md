## 1. 分组置顶（纯函数 + 单测）

- [ ] 1.1 `utils/templateLib.js`：`groupTemplates` 拼接顺序改为「我的模板」置顶（若存在）→ 预设组（三分化/二分化/有氧）→ 其余具名组；空「我的模板」不输出
- [ ] 1.2 `tests/algo.test.js`：补「我的模板」置顶顺序用例（含有/无自建模板两种、预设顺序不变）

## 2. 记录映射为模板（保存逻辑 + 单测）

- [ ] 2.1 `pages/workout/edit.js`：实现 `saveAsTemplate()`——映射 `data.exercises` 为模板动作（力量取 `{exerciseId, targetSets: sets.length}`；有氧取 `{exerciseId}` 且模板 `type:'cardio'`），名称加「（我的）」后缀，`group:''`、`order` 末位，经 `db.saveLocalFirst(db.COLL.TEMPLATES, ...)` 写入；保存后 toast 提示
- [ ] 2.2 抽出可单测的纯映射函数（记录 → 模板 payload），放可在 node 跑的位置（如 `utils/templateLib.js` 或 `utils/util.js`），供 edit.js 调用
- [ ] 2.3 `tests/algo.test.js`：补记录→模板映射用例（力量带 `targetSets`=组数、不含重量/次数；有氧 `type:'cardio'` 无组次；名称后缀）

## 3. 入口 UI（仅编辑态）

- [ ] 3.1 `pages/workout/edit.wxml`：内容区顶部加【保存模板】按钮条，渲染条件为编辑态（`id` 存在）
- [ ] 3.2 `pages/workout/edit.wxss`：按钮条样式，与页面风格一致
- [ ] 3.3 `pages/workout/edit.js`：按钮 `bindtap` → `wx.showModal`「保存为我的模板？」→ 确定调 `saveAsTemplate()`

## 4. 验证

- [ ] 4.1 语法检查：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`
- [ ] 4.2 算法单测：`node tests/algo.test.js` 全绿
- [ ] 4.3 模拟器走查：编辑力量记录→存为模板→选模板页「我的模板」置顶且含新模板；编辑有氧记录→存为模板→为 cardio；新建训练页无【保存模板】按钮；模板管理页「我的模板」置顶且可删除

## 5. 文档与归档前同步

- [ ] 5.1 `docs/usermanual.md`：补"把训练记录存为模板"操作说明（入口、后缀命名、置顶分组、可删除）
- [ ] 5.2 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 5.3 `/opsx:sync`：delta spec 落地到 `openspec/specs/template-management/spec.md`
- [ ] 5.4 `/opsx:archive`：归档 change 并打 tag

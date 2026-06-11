## 1. 脚手架与公共改动

- [x] 1.1 在 `app.json` 注册新页面：`pages/body/{list,edit,detail}`、`pages/template/{manage,edit}`、`pages/exercise/{library,detail}`、`pages/settings/settings`
- [x] 1.2 改 `utils/unit.js`：`currentUnit()` 从本地 `settings` 缓存读取（缺省 kg）
- [x] 1.3 在 `utils/store.js` 增加 `settings` 缓存键的读写封装
- [x] 1.4 新增动作合并查询工具：内置 `config/exercises.js` + `custom_exercises`，按 id 取名（含被删动作的占位回退）

## 2. 身体数据（body-tracking）

- [x] 2.1 实现 `pages/body/list`：缓存优先读 + refresh，按日期倒序展示体重/体脂（过 `unit.toDisplay`）（实现于身体 Tab 页 `pages/body/body`）
- [x] 2.2 实现 `pages/body/edit`：体重必填校验、体脂选填，保存经 `unit.toStore` + `db.saveLocalFirst('body_records')`
- [x] 2.3 实现 `pages/body/detail`：查看 + 编辑（`updateLocalFirst`）+ 删除（`removeLocalFirst`）
- [x] 2.4 首页 `pages/curve` 接入体重/体脂趋势线（`chart.js`，缺值断线），随时间范围切换（迭代一已实现，核验通过）

## 3. 训练模板管理（template-management）

- [x] 3.1 实现 `pages/template/manage`：`ensureTemplatesSeeded` 后按 order 列出模板，显示动作数
- [x] 3.2 新建空模板（order 取末位）+ 删除模板
- [x] 3.3 实现 `pages/template/edit`：重命名、增删模板内动作（仅存 exerciseId）、调整顺序
- [x] 3.4 「我的」页 `pages/profile` 接入模板管理入口

## 4. 动作库管理（exercise-library-management）

- [x] 4.1 实现 `pages/exercise/library`：合并内置 + 自建动作，按 CATEGORIES 分组，三大项标记
- [x] 4.2 新建自定义动作（`cus_` 前缀 id，`db.saveLocalFirst('custom_exercises')`）
- [x] 4.3 删除自建动作；内置动作无删除入口
- [x] 4.4 「我的」页接入动作库管理入口

## 5. 设置与 lb 单位（unit-settings）

- [x] 5.1 实现 `pages/settings/settings`：展示并切换重量单位 kg/lb，写入 `settings` 缓存
- [x] 5.2 全仓核查重量显示/输入均过 `unit.toDisplay/toStore`，补齐遗漏调用点（训练列表容量标签改为单位感知）
- [x] 5.3 验证：切到 lb 后曲线、录入步进（5）、详情数值一致；落库恒为 kg 且不提前 round（单测 `tests/algo.test.js` 覆盖往返换算与步进）
- [x] 5.4 「我的」页接入设置入口

## 6. 动作详情页（exercise-detail）

- [x] 6.1 实现 `pages/exercise/detail`：按 exerciseId 聚合 `workouts`，复用 `util.js` 主力工作组重量算法绘曲线
- [x] 6.2 历史记录列表（日期 + 各组重量×次数，倒序）
- [x] 6.3 曲线首页点击三大项曲线 → 跳转对应动作详情页

## 7. PR 标记（pr-tracking）

- [x] 7.1 实现读取侧 PR 现算：按 exerciseId 扫描历史，主力工作组重量创新高即标记（`util.buildPRMap`）
- [x] 7.2 在训练列表、训练详情、动作详情页展示 PR 标记（训练列表 PR 计数徽标 + 动作详情逐条 PR 标记）

## 8. 收尾与验证

- [x] 8.1 语法检查 + 关键算法（PR 识别、lb 换算）单测（21 个 js 过 `node --check`；`tests/algo.test.js` 7 测全过）
- [x] 8.2 更新 `README.md` 与 `docs/00-overview.md` 进度
- [ ] 8.3 真机/模拟器首次联调（依赖微信账号 + 云环境，见 design Open Questions）⏸ 阻塞：用户尚未搭建微信账号 + 云开发环境

## 1. 命名规则纯函数

- [x] 1.1 `utils/templateLib.js`：新增 `baseTemplateName`——循环剥除记录名尾部 `（我的）`（含可选跟随数字），空则取「训练」
- [x] 1.2 `recordToTemplatePayload(record, existingNames=[])`：基名 + 单一「（我的）」为候选名；与 `existingNames` 比对，重名时依次追加最小整数序号（2、3…）至唯一
- [x] 1.3 保持纯函数（不读全局/不写库）；`existingNames` 缺省退化为"加一个后缀、不编号"

## 2. 调用方接入（含保存时可编辑名称）

- [x] 2.1 `pages/workout/edit.js` 的 `onSaveAsTemplate`：从 `db.getCache(db.COLL.TEMPLATES)` 取现有模板名数组传入 `recordToTemplatePayload`，得到默认名
- [x] 2.2 确认窗改为 `wx.showModal({ editable: true, content: 默认名, placeholderText: '模板名称' })`；确定后取 `res.content`，`trim` 非空则用作名称、空则回退默认名
- [x] 2.3 `order` 末位、`group` 空、动作组数据口径等既有行为不变

## 3. 自重动作趋势按最大次数

- [x] 3.1 `utils/util.js` 新增纯函数 `dayRepsValue(workout, ids)`：当日匹配 `ids` 的动作各组 `reps` 最大值，无有效次数返回 null；导出
- [x] 3.2 `pages/curve/curve.js`：每条 lift 曲线整体判定——`loadType==='bodyweight'` 且范围内匹配组无 `weight>0` → 纯自重，用 `dayRepsValue`、不过 `unit.toDisplay`、单位「次」；否则 `dayLiftValue`+kg
- [x] 3.3 `pages/exercise/detail.js` 同口径整体判定（`loadType` bw 且范围内无负重 → 次数；否则重量），chart-cap 改 `metricCap`（「最大次数（次）」/「主力工作组重量（kg）」），与首页一致
- [x] 3.4 图表 yDecimals=0（整数次）；负重自重的纯自重日 `mainWorkingWeight` 返 null、无值日断线不补零

## 4. 测试（命名 + 自重趋势）

- [x] 4.1 `tests/algo.test.js` 命名用例：基名归一（含「（我的）（我的）」「（我的）2」「（我的）（我的）3」→ 基名）
- [x] 4.2 命名用例：无重名→「（我的）」；候选已存在→「（我的）2」；再存在→「3」；空名→「训练（我的）」；带序号名归一再编号；`existingNames` 缺省退化
- [x] 4.3 `dayRepsValue` 用例：多组取最大次数；纯自重 0 重量仍出值；无次数/空组返回 null；多 id 聚合取最大
- [~] 4.4 口径判定（纯自重→次数/含负重→重量）：判定逻辑在页面层（curve/detail），由真机走查覆盖；纯函数 `dayRepsValue`/`dayLiftValue` 已各自单测

## 5. 验证与收尾

- [x] 5.1 语法校验：全量 `node --check` 通过
- [x] 5.2 算法单测：`node tests/algo.test.js` 全绿（95 测）
- [x] 5.3 同步 `docs/usermanual.md` + `config/manual.js`（同源）：命名去重/编号、保存可改名/留空回退、事后改名、自重曲线看次数
- [ ] 5.4 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 5.5 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

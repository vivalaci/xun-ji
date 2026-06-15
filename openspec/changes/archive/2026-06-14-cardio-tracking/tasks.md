# Tasks: cardio-tracking

## 1. 数据与配置

- [x] 1.1 `config/exercises.js`：加 7 个有氧活动（category 有氧、kind cardio、metrics；距离类 6 + 爬楼梯 floors）
- [x] 1.2 `utils/exerciseLib.js`：分类顺序「有氧」置于「其他」之后；`byCategory`/搜索包含有氧
- [x] 1.3 `config/templates.js`：加预设「有氧训练」（group 有氧、type cardio、exercises 可空或含室外跑步起步）
- [x] 1.4 `utils/templateLib.js`：PRESET_GROUPS 加「有氧」（排序三分化→二分化→有氧→我的模板）

## 2. 播种 / 补种（utils/db.js）

- [x] 2.1 全新播种含「有氧训练」
- [x] 2.2 存量补种：`ensureTemplatesSeeded` 查 `user_prefs.seededCardio`，未标记则补种有氧训练并经 `updatePrefs` 置标记；已标记不补（删除不复活）

## 3. 录入页（pages/workout/edit）

- [x] 3.1 选模板携带 type；「有氧训练」→ `type='cardio'`，其余 → `'strength'`
- [x] 3.2 cardio 分支 UI：每个有氧活动卡片 时长(min)+距离(km)（爬楼梯=时长+层数）数字输入；无组/重量/次数/单位段控
- [x] 3.3 动作选择面板在 cardio 训练展示「有氧」类活动
- [x] 3.4 保存：cardio 收集 `{exerciseId,name,duration,distance|floors}`，`saveLocalFirst('workouts',{type:'cardio',...})`；strength 路径不变
- [x] 3.5 编辑既有 cardio 训练：按 type 回填有氧字段
- [x] 3.6 样式（有氧卡片/输入）

## 4. 列表与日历

- [x] 4.1 `utils/calendar.js`：TYPES 加 cardio（橙 #EA580C）；`aggregateByDate` 对 `type==='cardio'` 归有氧类
- [x] 4.2 `pages/workout/list`：cardio 训练显示活动+时长·距离/层数摘要（不算组/容量/PR）
- [x] 4.3 `pages/exercise/library`：有氧类在其他之后展示 7 活动（只读内置）

## 5. 验证

- [x] 5.1 `tests/algo.test.js`：补 cardio 用例——有氧项不进 buildPRMap/totalVolume；calendar 对 type=cardio 归有氧色；templateLib 分组含有氧；动作库一致性（id 唯一、有氧 metrics 齐）
- [x] 5.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿（58 测）
- [x] 5.3 模拟器走查：选有氧训练→加活动→录时长/距离/层数→保存；列表摘要；日历有氧色；力量记录/曲线/PR 不受影响；存量补种一次、删后不复活（需用户在开发者工具执行）（真机通过 2026-06-14）
- [x] 5.4 提请用户真机验证并给出验证点清单

## 6. 文档同步

- [x] 6.1 docs/06 数据模型 `workouts` 补 `type` 与 cardio 项形状；README/docs/00 待归档时同步

# 更新日志

本项目迭代历史。每个迭代对应一个 OpenSpec change（详见 `openspec/changes/archive/`）。
此前这些内容记录在 `README.md` 的「当前进度」段，为保持 README 精简，迁移至此归档。

---

## 迭代一（核心闭环）

- 内置动作库（含三大项核心动作）+ 训练模板（三分化：推日/拉日/蹲日 + 二分化：上肢/下肢，首次启动自动生成，按组分节展示）
- 新建训练：选模板 → 预填上次同类训练 → 步进按钮快速调重量/次数
- 训练列表（缓存优先渲染）
- 三大项进步曲线（按主力工作组重量）+ 时间范围切换（1M/3M/6M/ALL）
- 弱网兜底：本地先写、失败重试队列、缓存优先读

## 迭代二

- 身体数据：录入/列表/详情（体重必填、体脂选填）+ 首页体重/体脂趋势线
- 训练模板管理：重命名、增删模板、编辑模板内动作
- 动作库管理：查看内置 + 增删自建动作
- 设置：重量单位 kg/lb 切换（落库恒为 kg，仅改 `unit.js` 一处）
- 动作详情页：单动作主力工作组重量曲线 + 历史
- PR 标记：主力工作组重量创新高自动标记（训练列表、动作详情可见）

## 迭代三

- 模板分组：三分化（推日/拉日/蹲日）+ 二分化（上肢/下肢），存量数据自动迁移（change `template-groups`）
- 曲线首页可定制：长按进编辑模式（↑/↓ 排序、自定义曲线可删）、底部"添加曲线"任选动作（上限 2 条、主力工作组重量口径、槽位配色）；配置存 `user_prefs` 跨设备同步（change `custom-curves`）
- 训练日历：首页顶部月视图，按分化类型配色圆点标记每天练的项，显示本月训练天数，点某天看详情并跳转（change `training-calendar`，纯读 workouts）
- 大数据量：数据层全量分页拉取（绕过客户端 100 条上限，保证曲线/PR/日历正确），训练页/身体页增量渲染（默认 30 条上拉加载更多）（change `data-pagination`）

## 迭代四

- 动作库扩充：内置动作 27→92，按肌群细化分类（腿拆股四/腘绳/臀/小腿，手臂拆肱二/肱三/前臂），同类内复合动作优先；动作补元数据（器械/主肌群/动作模式/别名），原 27 个 id 不变（change `enrich-exercise-library`）
- 动作搜索：录入/模板/动作库三处面板按名称+别名模糊搜索（`exerciseLib.searchExercises`）
- 自重记录：`loadType:'bodyweight'` 动作的 weight 语义为「额外负重」（0=自重、+X=负重，显示 `util.formatLoad`）；纯自重无曲线/PR、保留次数（复用 mww 跳过 0 机制）

## 迭代五

- 有氧训练大类：`workouts.type`(strength/cardio)，7 个有氧活动（跑步/走路室内外、椭圆机、单车、爬楼梯），按时长+距离/层数录入；预设「有氧训练」模板；列表摘要 + 日历橙色标记；有氧无 sets 天然不入力量聚合（change `cardio-tracking`）
- 动作库微调：肩上推举→站姿肩上推举、新增坐姿肩上推举、T杠划船→海豹划船（id 不变）

## 迭代六

- 预设按循证升级（docs/09）：8 套预设（三分化推/拉/蹲 + 二分化上肢A/下肢A/上肢B/下肢B + 有氧），模板动作带可缺省「目标组次」`targetSets`/`repLow`/`repHigh`；新建训练按目标铺组 + 组旁次数区间提示，有历史仍优先复用上次；存量经 `user_prefs.presetVersion` 版本重刷（预设组重刷、我的模板不动）；选模板二/三分化组下附循证说明（change `preset-program-upgrade`）
- 用户手册纳入发版流程：docs/07 发布流程加「同步更新 docs/usermanual.md」为必需项，并把手册补齐到当前版本

## 迭代七

- 日历分化配色升级：色相编码「系统」——三分化=蓝族（推靛蓝/拉正蓝/蹲天蓝）、二分化=绿族（上肢深草绿/下肢黄绿）、有氧=橙、其他=灰，族内区分单日。纯展示层换色，不动数据（change `calendar-split-palette`）

## 迭代八

- 选模板行内分化色点：每个模板行右侧标该训练日在日历上的颜色（取色收敛为 `calendar.typeOf`，与日历同源），空白训练为黑点；同时移除日历下方图例——颜色含义改在「选模板」场景内传达（change `template-picker-split-dots`）

## 迭代九

- 应用内使用说明：「我的」页「设置」下方加「使用说明」入口，进 `pages/manual/manual` 按节渲染用户手册（段落/要点/问答三类块）；内容固化为 `config/manual.js`，与 `docs/usermanual.md` 同源维护（小程序运行时读不了 `.md`）（change `in-app-usermanual`）

## 迭代十

- 记录/曲线三修：① 保存力量训练保留全部动作、未填落 0（不再丢空动作）；② 训练组重量统一量化到 0.5（`unit.toDisplayWeight`，只现整数或 .5，覆盖历史脏值），lb 录入落库取整到 0.5kg（`roundHalfKg`），体重等仍保留 0.1；③ 硬拉曲线聚合家族（硬拉/罗马尼亚硬拉/直腿硬拉，`util.dayLiftValue` 当日取主力组最大），详情页同步聚合并在历史标注变式（change `record-and-deadlift-fixes`）

## 迭代十一

- 训练记录一键存为模板：编辑已有记录时顶部【保存模板】→ 确认即存为「我的模板」（`templateLib.recordToTemplatePayload`：力量取 exerciseId+组数 targetSets、不含重量次数；有氧 type:cardio；名称加「（我的）」后缀）；「我的模板」分组由垫底改**置顶**；预设模板（App 托管）**不可删除**（`isPresetGroup`，删除入口仅对我的模板渲染 + 兜底拦截）（change `record-to-template`）

## 迭代十二

- 三个用户反馈修复（change `workout-flow-and-trend-fixes`）：
  - **选模板拆为独立页** `pages/workout/pick`：新建流程改为 列表→选模板→编辑，左上角返回从编辑页天然退回选模板页（修复原同页 stage 返回直接退到列表）；保存新建训练后跨过选模板页直接回列表（退 2 层），编辑既有退 1 层。
  - **训练编辑页动作上移/下移**：力量与有氧通用，组/时长数据随动作整体移动（复用模板页 `moveUp`/`moveDown`）。
  - **身体趋势图体重线渲染修复**：`utils/chart.js` 抽纯函数 `computeBand(ys,minSpan)`——跨度<minSpan 按 minSpan 居中扩展（微小波动不再被放大成大斜线），近平线按序号像素级垂直错开（体重线不被腰围盖住）；体重阈值在 lb 下经 `unit` 换算。

## 迭代十三

- 训练列表高亮今日记录：`date` 为今天（`util.isToday`）的记录卡片左侧加强调色竖条，进训练页一眼定位今日训练；多条全标、无则不标。纯展示（`list.decorate` 打 `isToday`），不动排序/分页/字段（change `highlight-today-workout`，新 capability `workout-list`）

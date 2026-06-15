## Context

内置动作库 `config/exercises.js` 现为 27 个动作、6 个粗分类、每个动作仅 `id/name/category/isMainLift`。动作身份靠稳定 `id`（曲线/PR/历史聚合都按 id，架构铁律 3）。动作选择面板（`pages/workout/edit`、`pages/template/edit`）与动作库管理页（`pages/exercise/library`）当前用「分类 tab + 列表」，无搜索。要提升专业性需扩充广度、补元数据、加搜索，且严守铁律：id 稳定、不改 4 集合既有字段、新字段可缺省。

## Goals / Non-Goals

**Goals:**
- 内置动作扩到约 120 个，分类细化，覆盖常见器械变式。
- 动作对象支持可缺省的专业元数据（器械/肌群/模式/别名）。
- 动作选择面板与动作库页支持按名称+别名模糊搜索。
- 全程不破坏既有 id / 历史引用 / 曲线 / PR。

**Non-Goals:**
- 不支持有氧/计时/距离类动作，记录模型仍为 weight×reps。
- 不做肌群图等可视化（元数据仅用于展示文本与搜索）。
- 不改 `utils/unit.js`、不动 4 个云集合 schema。
- 自建动作（`custom_exercises`）暂不要求填写元数据，沿用现有字段。
- 自重动作**不**把真实体重（body_records）计入容量/1RM；曲线/PR 仍只看落库 weight。
- 本迭代**不**支持辅助自重（助力机/负值录入）；weight 仅取 0 或正值。负值语义与负数输入控件留待后续。

## Decisions

### D1: 元数据作为内置动作对象的可缺省字段，集中在 config/exercises.js
内置动作扩展为 `{ id, name, category, isMainLift?, equipment?, primaryMuscle?, secondaryMuscles?, pattern?, aliases? }`。`exerciseLib` 透传字段，UI 用到才读、读不到不报错。
- **被否方案**：单独建元数据集合 / 单独 JSON 文件——增加读路径与同步成本，违背「无构建、配置即数据」现状，收益不足。

### D2: id 稳定性靠回归测试锁定，新动作只追加
原 27 个 id 与 `MAIN_LIFTS=['bench','squat','deadlift']` 不变。在 `tests/algo.test.js` 增加断言：这 27 个 id 必须全部存在且 `MAIN_LIFTS` 不变，防止后续误删/改名。新动作 id 用语义化英文蛇形（如 `cable_fly`、`hack_squat`），与自建 `cus_` 前缀天然区分。

### D3: 分类细化但保持向后兼容
`CATEGORIES` 由 6 类扩展为更细的集合（例：胸/背/肩/肱二头肌/肱三头肌/前臂/股四头肌/腘绳肌/臀/小腿/核心/斜方·颈）。原动作的 `category` 可重新归入更细分类（如「手臂」动作改挂到「肱二头肌/肱三头肌」）——**category 仅用于分组展示，不参与任何按 id 的聚合**，故改 category 不破坏历史数据。`byCategory` 已能动态吸收自建动作的新分类，扩 `CATEGORIES` 顺序即可。
- **被否方案**：保留旧 6 类不动只在类内堆动作——专业性提升有限，长列表难浏览。

### D4: 搜索为 exerciseLib 纯函数，UI 仅做输入与渲染
新增 `searchExercises(keyword)`：对 `allExercises()` 按 `name` 与 `aliases` 做大小写无关 `includes` 匹配；空关键词返回 null/空表示「不过滤」，由页面回落到分类分组。纯函数放 `exerciseLib`，可在 `tests/algo.test.js` 直接测，三处页面复用同一函数。
- **被否方案**：各页面各写一份过滤逻辑——重复、口径易漂移。

### D5: 三处面板统一搜索交互
搜索框置于动作选择面板/动作库页顶部；有输入时展示扁平命中列表（标注所属分类），清空时恢复分类 tab 分组。`edit.js` 当前用 `libByCategory`（来自 `EXERCISES`）预处理，需改为经 `exerciseLib`（含自建动作）以便搜索覆盖自建动作。

### D6: 自重动作的 weight 字段语义化为「额外负重」
新增可缺省元数据 `loadType`：默认 `weighted`（普通负重，weight=外部负荷）；自重动作标 `bodyweight`，此时落库 weight 表示**额外负重**——`0`=纯自重、`>0`=负重自重。辅助自重（负值）本迭代不做（见 Non-Goals）。
- **存储不变**：仍复用 `{weight, reps}`，0/正数都是合法 kg 值，不改集合、不改记录结构、不改 `unit.js`（换算仍走 toStore/toDisplay）。
- **显示规则**（按 loadType 在显示层处理）：`bodyweight` 且 weight=0 → 「自重」；>0 → 「自重 +Xkg」。`weighted` 维持现状。（formatLoad 对 <0 保留「辅助 −Xkg」分支作防御性回退，但不提供负值录入。）
- **录入提示**：自重动作录入框占位/标签提示「额外负重(空=自重)」，默认 0，沿用现有 `type="digit"`（不放开负号）。
- **曲线/PR**：仍按落库 weight 聚合，不引入体重。纯自重(weight=0)曲线平坦，进步由 reps 体现——接受此取舍（见 Non-Goals）。
- **被否方案**：总负荷=当前体重+额外负重——更准但耦合 body_records 历史、缺体重需回退、PR 口径复杂，本次不做。

### D7: 自重的曲线/PR 复用既有「跳过 0 重量」机制，不另加排除逻辑
`util.mainWorkingWeight` 已 `if (!w) return` 跳过 weight=0，因此：纯自重（全 0）天然得到 `mww=null` → 无曲线点、不计 PR（详情页空状态），而历史 reps 照常保留；负重自重（+X）则正常进入曲线/PR，追踪额外负重的进步。
- **结论**：不为 `bodyweight` 动作单独关闭曲线/PR——硬关会丢掉负重/辅助训练最有价值的进步数据；现有机制刚好契合。
- **仅需**：详情/历史展示走 `formatLoad`（避免「0×10」），纯自重空状态给文案提示「纯自重，进步看次数」。
- **被否方案**：按 `loadType==='bodyweight'` 一律隐藏曲线/PR——会误伤负重引体/助力引体等可量化进步的场景。

## Risks / Trade-offs

- [手工录入约 120 个动作易有错字/重复 id] → 录入后跑 id 唯一性 + 27 个旧 id 存在性测试；元数据用统一枚举（器械/模式取固定取值集）。
- [改旧动作 category 影响 UI 既有印象] → category 不入聚合，安全；在 design 记录映射，必要时保留旧分类名作过渡。
- [edit.js 由 EXERCISES 改走 exerciseLib 可能引入自建动作未预期出现在面板] → 本就应出现（与 library 一致），并补走查清单确认。
- [搜索大小写/中英混输] → 纯函数统一 `toLowerCase`，aliases 收录常见中英别名（如 `卧推/bench/平板卧推`）。

## Migration Plan

- 纯追加 + 可缺省字段，无数据迁移；老用户本地缓存与云端记录无需变更。
- 回滚：还原 `config/exercises.js` 与三处页面即可，无持久化副作用。

## Open Questions

- 细分类的最终命名与顺序（待录入时定稿，design D3 给出建议集合）。
- 自建动作是否后续也开放填写元数据（本次 Non-Goal，留待下个迭代）。

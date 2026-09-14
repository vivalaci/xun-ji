# exercise-library-management Specification

## Purpose

动作库查看、搜索与自建动作（`custom_exercises`）的增删管理。内置动作来自 `config/exercises.js`（101 个，按肌群细化分类，携带可缺省专业元数据，含规范中文名与别名），自建动作 id 形如 `cus_xxx`，统一按 id 取名（含被删动作的占位回退与历史记录动作名实时解析）。原 27 个内置动作 id 与三大项 `MAIN_LIFTS` 保持稳定，向后兼容历史记录/曲线/PR。

## Requirements

### Requirement: 查看动作库
用户 SHALL 能查看完整动作库，内置动作按分类分组，三大项有明显标记。分类集合可扩展（在原 胸/背/腿/肩/手臂/核心 基础上细化与新增），且对历史记录向后兼容：既有动作 `id` 与三大项 `MAIN_LIFTS` 保持不变。

动作库 SHALL 由四层合并而成，顺序为：**内置 `config/exercises.js` 拼接 `kind:'exercise'` 的全局动作（`gbl_` 前缀，对所有用户可见）→ 套用 `exercise_overrides` 的 `kind:'patch'`（改名/改分类/改别名/隐藏，对内置与全局动作均生效）→ 拼接每用户私有的 `custom_exercises`（`cus_` 前缀）**。`exercise_overrides` 的读取 SHALL 走 `utils/db.js` 缓存优先 + 异步刷新；无网或首次启动时 SHALL 安全回退到内置基线展示，不报错。

被标记 `hidden` 的动作 MUST 从动作库列表与分类分组中排除，但 MUST 仍可按 id 解析（见 `getExercise`/`getName`），以保证历史记录展示不退化。

#### Scenario: 分类展示
- **WHEN** 用户进入动作库管理页
- **THEN** 系统按上述四层合并动作，按类别顺序分组展示，`isMainLift` 动作显示三大项标记

#### Scenario: 既有 id 与三大项稳定
- **WHEN** 动作库扩充后加载历史记录、曲线与模板
- **THEN** 原 27 个内置动作的 `id` 与 `MAIN_LIFTS`（bench/squat/deadlift）保持不变，历史引用、PR 与曲线聚合不受影响

#### Scenario: 覆盖生效
- **WHEN** 管理员改了某内置动作的名称或分类，用户刷新动作库
- **THEN** 用户看到改后的名称/分类，该动作按 id 的历史与聚合不受影响

#### Scenario: 隐藏动作不列举
- **WHEN** 某内置动作被标记 `hidden`
- **THEN** 该动作不出现在动作库列表与分类分组中

#### Scenario: 无网回退基线
- **WHEN** 用户无网络或首次启动、`exercise_overrides` 尚未拉到
- **THEN** 系统按内置基线展示动作库，不报错；overrides 到达后刷新为最新内容

### Requirement: 新建自定义动作
用户 SHALL 能新建自定义动作（名称 + 分类），存入 `custom_exercises`，id 形如 `cus_xxx`。

#### Scenario: 新建
- **WHEN** 用户填写动作名称、选择分类并保存
- **THEN** 系统生成稳定 id（`cus_` 前缀），经 `db.saveLocalFirst('custom_exercises', ...)` 落库，该动作随后可被模板与训练记录选用

### Requirement: 删除自定义动作
用户 SHALL 能删除自定义动作；内置动作与全局动作（`gbl_`）不可删除。管理员对内置动作 SHALL 只能隐藏（不可删除、不可改 id）。

#### Scenario: 删除自建动作
- **WHEN** 用户删除某自建动作并确认
- **THEN** 系统经 `db.removeLocalFirst` 移除，已引用该 id 的历史记录仍按存储的 exerciseId 显示（名称回退处理）

#### Scenario: 内置动作受保护
- **WHEN** 用户查看内置动作
- **THEN** 系统不提供删除入口

#### Scenario: 隐藏动作仍可按 id 解析
- **WHEN** 历史记录引用了一个被管理员隐藏的内置动作
- **THEN** `getName` 返回该动作的正确名称，而非「已删除动作」占位

### Requirement: 自建动作升格为全局动作（管理员）
自定义动作（`cus_`）对普通用户 SHALL 仅提供删除，MUST NOT 提供编辑入口。管理模式下自建动作 SHALL 提供「升格」：管理员确认/修改名称、分类、别名后保存，系统 SHALL 依次①经 `exerciseAdmin` 云函数新建 `gbl_` 全局动作（写入 `exercise_overrides`，对所有用户可见）；②云端写入成功后，将管理员本人所有引用原 `cus_` id 的数据改指新 `gbl_` id——训练记录、模板与曲线配置（迁移计划由纯函数 `util.planExerciseIdMigration` 生成，落库走 `db.updateLocalFirst`/`updatePrefs`）；③删除原 `cus_` 文档（`db.removeLocalFirst`）。迁移后按新 id 的历史记录、曲线与 PR 聚合 SHALL 完全连续（不分段、无占位退化）。云端写入失败时 MUST NOT 迁移、MUST NOT 删除原自建动作。`cus_` 为每用户私有，迁移仅触及管理员自己的文档，MUST NOT 影响其他用户数据。分类选项 SHALL 取自当前合并后的类别列表（含管理员编排的新类别）。`aliases` 为 `custom_exercises` 可缺省新字段，无该字段的存量数据不受影响。

#### Scenario: 普通用户无升格/编辑入口
- **WHEN** 普通用户（未进入管理模式）查看动作库中自己的自建动作
- **THEN** 该行仅有「删除」，无「升格」或「编辑」入口

#### Scenario: 升格后全体可见、本人历史连续
- **WHEN** 管理员把自建「臀推」升格（归入「臀」分类）并保存成功
- **THEN** 所有用户的动作库「臀」分类下出现该全局动作（`gbl_`）；管理员的既有训练记录、模板、曲线配置均改指新 id，进步曲线与 PR 连续不分段；原自建项从列表消失，无「已删除动作」占位出现

#### Scenario: 云端失败不动本地
- **WHEN** 升格时云函数拒绝或网络失败
- **THEN** 系统明确报错，不创建全局动作，不迁移引用，原自建动作保持原样

#### Scenario: 升格动作的别名参与搜索
- **WHEN** 升格时定义了别名，任意用户按该别名搜索
- **THEN** 命中该全局动作

### Requirement: 动作专业元数据
每个内置动作 MAY 携带专业元数据字段：`equipment`（器械）、`primaryMuscle`（主肌群）、`secondaryMuscles`（协同肌群数组）、`pattern`（动作模式）、`aliases`（别名数组）。所有元数据字段 MUST 可缺省；缺省时系统 MUST 正常显示动作并保持曲线/PR/历史按 `id` 聚合不受影响。元数据 MUST 不写入 4 个云集合的既有字段。

#### Scenario: 携带元数据展示
- **WHEN** 动作定义包含 `equipment`/`primaryMuscle` 等字段
- **THEN** 系统经 `exerciseLib` 透传这些字段供 UI 展示，不改变按 `id` 的取名与聚合逻辑

#### Scenario: 缺省字段安全回退
- **WHEN** 某动作（含自建动作）缺少部分或全部元数据字段
- **THEN** 系统不报错，照常显示名称与分类，相关聚合与曲线按 `id` 正常工作

### Requirement: 动作搜索
用户 SHALL 能在动作选择面板与动作库管理页按关键词模糊搜索动作，匹配范围为动作名称与别名（`aliases`）。搜索范围 SHALL 覆盖合并后的动作（内置含 patch、全局动作、用户自建），并 MUST 排除 `hidden` 动作。

#### Scenario: 按名称或别名搜索
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统经 `exerciseLib` 纯函数按名称与 `aliases` 大小写无关地模糊匹配，返回命中动作列表

#### Scenario: 空关键词
- **WHEN** 搜索关键词为空或仅空白
- **THEN** 系统恢复默认的分类分组展示，不进行过滤

#### Scenario: 搜索命中覆盖后的别名
- **WHEN** 管理员为某动作新增别名后，用户以该别名搜索
- **THEN** 命中该动作

#### Scenario: 搜索不返回隐藏动作
- **WHEN** 用户搜索的关键词匹配到一个 `hidden` 动作
- **THEN** 结果中不含该动作

### Requirement: 自重动作负重记录
动作 MAY 标记可缺省元数据 `loadType`（默认 `weighted`）。当 `loadType` 为 `bodyweight` 时，落库 `weight` 字段 MUST 表示**额外负重**（kg）：`0` 表示纯自重、正值表示负重自重。本迭代 MUST NOT 提供辅助自重（负值）的录入入口（重量输入沿用 `type="digit"`，不放开负号）。存储结构 MUST 仍为 `{weight, reps}`，不新增集合字段、不改 `utils/unit.js` 的换算口径；曲线/PR MUST 仍按落库 `weight` 聚合，不引入真实体重。

#### Scenario: 纯自重显示
- **WHEN** 某 `bodyweight` 动作某组 `weight` 为 0
- **THEN** 系统在显示层呈现「自重」，而非「0 kg」

#### Scenario: 负重自重显示
- **WHEN** 某 `bodyweight` 动作某组 `weight` 为正值 X
- **THEN** 系统呈现「自重 +X」（单位经 `unit.toDisplay`）

#### Scenario: 普通负重动作不受影响
- **WHEN** 动作未标 `loadType` 或为 `weighted`
- **THEN** 系统按现状以外部负荷显示与记录，行为不变

#### Scenario: 纯自重无曲线/PR、保留次数
- **WHEN** 某 `bodyweight` 动作各组 `weight` 均为 0
- **THEN** 主力工作组重量为 `null`（沿用既有跳过 0 机制），系统不绘制曲线、不计 PR，但历史按组保留 reps；曲线区展示「纯自重，进步看次数」类空状态

#### Scenario: 负重自重保留曲线与 PR
- **WHEN** 某 `bodyweight` 动作存在非 0 的额外负重（正值）
- **THEN** 系统正常计入曲线与 PR，追踪该额外负重的进步

### Requirement: 内置动作中文命名
内置动作 SHALL 使用规范中文名。以下内置动作 SHALL 更名（id 不变）：`db_kickback` 哑铃俯身臂屈伸、`incline_db_curl` 上斜哑铃弯举、`rear_delt_fly` 俯身哑铃飞鸟、`overhead_extension` 哑铃颈后臂屈伸、`tricep_pushdown` 直杆下压、`rope_pushdown` 粗绳下压、`cable_pull_through` 绳索髋屈伸、`step_up` 哑铃登阶、`db_press` 站姿哑铃推举、`side_plank` 侧平板支撑、`t_bar_row` T杠划船、`glute_ham_raise` GHR臀腿提升。更名动作的旧名 SHALL 保留为别名，使按旧名搜索仍能命中。别名「斜托弯举」SHALL 归属 `preacher_curl`（牧师凳弯举）而非 `incline_db_curl`。

系统 SHALL 新增内置动作 `seal_row`（海豹划船，分类「背」），与 `t_bar_row`（T杠划船）为两个独立动作；别名「海豹划船」「俯卧划船」「seal row」SHALL 归属 `seal_row`，MUST NOT 保留在 `t_bar_row` 上。内置动作总数为 101。

#### Scenario: 按旧名搜索
- **WHEN** 用户在动作库或「添加动作」面板搜索「哑铃后撑」
- **THEN** 命中「哑铃俯身臂屈伸」

#### Scenario: 斜托弯举指向牧师凳弯举
- **WHEN** 用户搜索「斜托弯举」
- **THEN** 结果含「牧师凳弯举」，不含「上斜哑铃弯举」

#### Scenario: 海豹划船与 T杠划船分开
- **WHEN** 用户搜索「海豹划船」
- **THEN** 结果仅含新增的「海豹划船」（`seal_row`），不含「T杠划船」

#### Scenario: 更名不影响历史聚合
- **WHEN** 用户查看已更名动作（如 `t_bar_row`）的详情、曲线与 PR
- **THEN** 数据按原 id 聚合，更名前后的记录连续显示

### Requirement: 历史记录动作名实时解析
训练记录中的动作名称 SHALL 在显示时按 `exerciseId` 实时解析：动作仍可解析（含 hidden）时 SHALL 显示当前名称；动作已不存在（如自建动作被删除、全局动作被删除）时 SHALL 显示该记录保存时写入的名称；二者皆无时 SHALL 显示「已删除动作」。适用于训练编辑页（力量与有氧）、训练列表有氧摘要与动作详情页的变式标注。保存训练时 SHALL 继续写入动作名称，作为回退依据。

#### Scenario: 改名后老记录显示新名
- **WHEN** 用户打开一条更名前保存、含「哑铃后撑」的训练记录
- **THEN** 编辑页显示「哑铃俯身臂屈伸」

#### Scenario: 已删除自建动作显示保存时名称
- **WHEN** 某训练记录引用的自建动作已被删除，该记录保存时写入的名称为「我的划船」
- **THEN** 训练编辑页显示「我的划船」，而非「已删除动作」

#### Scenario: 无保存名称的已删除动作
- **WHEN** 某记录引用的动作已不存在，且该记录未保存名称
- **THEN** 显示「已删除动作」

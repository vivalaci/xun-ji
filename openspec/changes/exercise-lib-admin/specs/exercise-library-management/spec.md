## MODIFIED Requirements

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

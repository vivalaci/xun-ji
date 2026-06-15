# exercise-library-management Specification

## Purpose

动作库查看、搜索与自建动作（`custom_exercises`）的增删管理。内置动作来自 `config/exercises.js`（约 92 个，按肌群细化分类，携带可缺省专业元数据），自建动作 id 形如 `cus_xxx`，统一按 id 取名（含被删动作的占位回退）。原 27 个内置动作 id 与三大项 `MAIN_LIFTS` 保持稳定，向后兼容历史记录/曲线/PR。

## Requirements

### Requirement: 查看动作库
用户 SHALL 能查看完整动作库，内置动作按分类分组，三大项有明显标记。分类集合可扩展（在原 胸/背/腿/肩/手臂/核心 基础上细化与新增），且对历史记录向后兼容：既有动作 `id` 与三大项 `MAIN_LIFTS` 保持不变。

#### Scenario: 分类展示
- **WHEN** 用户进入动作库管理页
- **THEN** 系统合并 `config/exercises.js` 内置动作与 `custom_exercises` 自建动作，按 `CATEGORIES` 顺序分组展示，`isMainLift` 动作显示三大项标记

#### Scenario: 既有 id 与三大项稳定
- **WHEN** 动作库扩充后加载历史记录、曲线与模板
- **THEN** 原 27 个内置动作的 `id` 与 `MAIN_LIFTS`（bench/squat/deadlift）保持不变，历史引用、PR 与曲线聚合不受影响

### Requirement: 新建自定义动作
用户 SHALL 能新建自定义动作（名称 + 分类），存入 `custom_exercises`，id 形如 `cus_xxx`。

#### Scenario: 新建
- **WHEN** 用户填写动作名称、选择分类并保存
- **THEN** 系统生成稳定 id（`cus_` 前缀），经 `db.saveLocalFirst('custom_exercises', ...)` 落库，该动作随后可被模板与训练记录选用

### Requirement: 删除自定义动作
用户 SHALL 能删除自定义动作；内置动作不可删除。

#### Scenario: 删除自建动作
- **WHEN** 用户删除某自建动作并确认
- **THEN** 系统经 `db.removeLocalFirst` 移除，已引用该 id 的历史记录仍按存储的 exerciseId 显示（名称回退处理）

#### Scenario: 内置动作受保护
- **WHEN** 用户查看内置动作
- **THEN** 系统不提供删除入口

### Requirement: 动作专业元数据
每个内置动作 MAY 携带专业元数据字段：`equipment`（器械）、`primaryMuscle`（主肌群）、`secondaryMuscles`（协同肌群数组）、`pattern`（动作模式）、`aliases`（别名数组）。所有元数据字段 MUST 可缺省；缺省时系统 MUST 正常显示动作并保持曲线/PR/历史按 `id` 聚合不受影响。元数据 MUST 不写入 4 个云集合的既有字段。

#### Scenario: 携带元数据展示
- **WHEN** 动作定义包含 `equipment`/`primaryMuscle` 等字段
- **THEN** 系统经 `exerciseLib` 透传这些字段供 UI 展示，不改变按 `id` 的取名与聚合逻辑

#### Scenario: 缺省字段安全回退
- **WHEN** 某动作（含自建动作）缺少部分或全部元数据字段
- **THEN** 系统不报错，照常显示名称与分类，相关聚合与曲线按 `id` 正常工作

### Requirement: 动作搜索
用户 SHALL 能在动作选择面板与动作库管理页按关键词模糊搜索动作，匹配范围为动作名称与别名（`aliases`）。

#### Scenario: 按名称或别名搜索
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统经 `exerciseLib` 纯函数按名称与 `aliases` 大小写无关地模糊匹配，返回命中动作列表

#### Scenario: 空关键词
- **WHEN** 搜索关键词为空或仅空白
- **THEN** 系统恢复默认的分类分组展示，不进行过滤

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

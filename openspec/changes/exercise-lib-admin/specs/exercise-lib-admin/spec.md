## ADDED Requirements

### Requirement: 管理员权限门

系统 SHALL 只允许单一管理员（App 所有者）修改全局动作库。权限校验 MUST 在云函数内完成：云函数 `exerciseAdmin` MUST 以 `cloud.getWXContext().OPENID` 与 `ADMIN_OPENID`（云函数环境变量）比对，不匹配 MUST 拒绝并不产生任何写入。`exercise_overrides` 集合权限 MUST 设为「所有用户可读，仅管理端可写」，使客户端无法直接写入。客户端的管理入口 SHALL 仅作 UI 便利，MUST NOT 作为安全边界。

#### Scenario: 管理员写入成功
- **WHEN** 管理员经 App 提交一项动作库修改，云函数取到的 OPENID 与 `ADMIN_OPENID` 一致
- **THEN** 云函数写入 `exercise_overrides`，返回成功

#### Scenario: 非管理员被服务端拒绝
- **WHEN** 任何非管理员（含篡改客户端代码绕过 UI 门者）调用 `exerciseAdmin` 提交修改
- **THEN** 云函数校验 OPENID 不匹配，拒绝请求，`exercise_overrides` 无任何变更

#### Scenario: 客户端无法直连写入
- **WHEN** 任何客户端尝试经 `wx.cloud.database()` 直接写 `exercise_overrides`
- **THEN** 集合权限拒绝该写入

### Requirement: 管理入口经隐藏手势触发

管理入口 SHALL 在「我的」→ 动作库页经**隐藏手势**触发（如标题连点若干次），MUST NOT 对普通用户可见，且 MUST NOT 在应用启动或页面进入时自动调用云函数——避免云函数调用次数随用户数增长。手势触发后系统 SHALL 调用云函数验证身份，验证通过方进入管理模式。

#### Scenario: 普通用户零调用
- **WHEN** 普通用户正常使用 App（含进入动作库页）且未触发隐藏手势
- **THEN** 系统不调用 `exerciseAdmin` 云函数，界面无任何管理入口痕迹

#### Scenario: 管理员触发进入
- **WHEN** 管理员在动作库页执行隐藏手势
- **THEN** 系统调用云函数验证，通过后进入管理模式，展示编辑能力

#### Scenario: 非管理员触发被拒
- **WHEN** 非管理员偶然触发隐藏手势
- **THEN** 云函数校验不通过，不进入管理模式，不暴露管理能力

### Requirement: 编辑内置动作

管理员 SHALL 能修改内置动作的**名称**、**分类**、**别名**，经 `{ kind:'patch', targetId, name?, category?, aliases? }` 存入 `exercise_overrides`。动作 `id` MUST NOT 可改；内置动作 MUST NOT 可删除。修改 SHALL 对所有用户生效，且 MUST NOT 影响任何按 `exerciseId` 的历史记录、曲线与 PR 聚合。

#### Scenario: 改名对全体生效
- **WHEN** 管理员把「卧推」改名为「平板杠铃卧推」并保存
- **THEN** 所有用户刷新后动作库、选择面板、历史记录显示新名称，`bench` 的历史与曲线聚合不受影响

#### Scenario: 改分类不影响聚合
- **WHEN** 管理员把某动作从「胸」改到「肩」
- **THEN** 该动作在新分类下展示，其历史记录、PR、曲线按 id 聚合的结果完全不变

#### Scenario: 改别名影响搜索
- **WHEN** 管理员给某动作增加别名
- **THEN** 用户按该别名搜索可命中该动作

### Requirement: 隐藏内置动作

管理员 SHALL 能隐藏内置动作（`{ kind:'patch', targetId, hidden:true }`），而非删除。隐藏动作 MUST 从动作库列表、动作选择面板与搜索结果中排除，但 `getExercise`/`getName` MUST 仍能按 id 解析出该动作——保证已引用它的历史记录仍正确显示名称，不退化为「已删除动作」。隐藏 SHALL 可撤销。

三大项（`MAIN_LIFTS`：`bench`/`squat`/`deadlift`）MUST NOT 可隐藏，该限制 MUST 在云函数**服务端**强制，不得仅依赖客户端 UI。

#### Scenario: 隐藏后不再可选
- **WHEN** 管理员隐藏某内置动作
- **THEN** 所有用户的动作库、选择面板、搜索结果中不再出现该动作

#### Scenario: 隐藏动作的历史仍正确显示
- **WHEN** 某用户的历史记录引用了一个已被隐藏的动作
- **THEN** 该记录仍显示该动作的正确名称，不显示「已删除动作」，其曲线与 PR 聚合不受影响

#### Scenario: 三大项拒绝隐藏
- **WHEN** 对 `bench`/`squat`/`deadlift` 之一提交 `hidden:true`（含绕过客户端 UI 直调云函数）
- **THEN** 云函数拒绝该请求，不写入，首页三大项曲线不受影响

#### Scenario: 撤销隐藏
- **WHEN** 管理员取消某动作的隐藏
- **THEN** 该动作重新出现在动作库、选择面板与搜索中

### Requirement: 新增全局动作

管理员 SHALL 能新增**全局**动作（对所有用户可见），经 `{ kind:'exercise', id:'gbl_xxx', name, category, aliases? }` 存入 `exercise_overrides`。全局动作 id MUST 使用 `gbl_` 前缀，与每用户私有自建动作的 `cus_` 前缀区分，MUST NOT 与既有 id 碰撞。全局动作 SHALL 可被所有用户在选择面板中选用，并 SHALL 支持定义别名。

#### Scenario: 新增后全体可见可选
- **WHEN** 管理员新增一个全局动作并保存
- **THEN** 所有用户刷新后可在动作库对应分类下看到该动作，并可在训练中选用

#### Scenario: 全局动作与用户自建互不干扰
- **WHEN** 系统合并动作库
- **THEN** 全局动作（`gbl_`）对所有用户可见，用户自建动作（`cus_`）仍仅对其创建者可见，两者 id 命名空间不碰撞

#### Scenario: 全局动作支持别名搜索
- **WHEN** 管理员为全局动作定义了别名，用户按该别名搜索
- **THEN** 命中该全局动作

### Requirement: 自定义类别与顺序

管理员 SHALL 能新增自定义类别并编排类别顺序，经 `{ kind:'categories', order:[...] }` 存入 `exercise_overrides`。分类展示顺序 SHALL 依该 `order`；`有氧` 类别 MUST 仍强制置于末位（既有规则保留），`order` 仅编排非有氧类别。无 `categories` 文档时 SHALL 回退现有顺序逻辑（`CATEGORIES` → 新出现类别追加 → `有氧` 置末）。空类别不显示。

#### Scenario: 按管理员顺序展示
- **WHEN** 管理员把类别顺序编排为「背 → 胸 → 腿…」并保存
- **THEN** 所有用户的动作库与选择面板按该顺序分组展示

#### Scenario: 有氧恒置末
- **WHEN** 管理员编排的 `order` 中未含或含「有氧」于任意位置
- **THEN** 系统仍把「有氧」排在最末，不受 `order` 影响

#### Scenario: 新增自定义类别
- **WHEN** 管理员新增类别「前臂」并把若干动作改归其下
- **THEN** 所有用户看到「前臂」分组，按 `order` 就位

#### Scenario: 无配置时回退
- **WHEN** `exercise_overrides` 中无 `kind:'categories'` 文档
- **THEN** 分类顺序按现有逻辑展示，不报错

## ADDED Requirements

### Requirement: 查看动作库
用户 SHALL 能查看完整动作库，内置动作按分类（胸/背/腿/肩/手臂/核心）分组，三大项有明显标记。

#### Scenario: 分类展示
- **WHEN** 用户进入动作库管理页
- **THEN** 系统合并 `config/exercises.js` 内置动作与 `custom_exercises` 自建动作，按 `CATEGORIES` 顺序分组展示，`isMainLift` 动作显示三大项标记

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

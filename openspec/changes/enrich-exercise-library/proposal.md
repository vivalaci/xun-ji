## Why

当前内置动作库仅 27 个、6 个粗分类，且每个动作只有 `id/name/category/isMainLift` 四个字段，缺少器械、肌群、动作模式等专业信息。进阶训练者的实际训练动作远多于此，找动作只能靠分类 tab 翻找。要让工具更具专业性，需要在不破坏既有数据口径的前提下，扩充动作广度、补充专业元数据，并提供搜索。

## What Changes

- 内置动作从 27 个扩充到约 120 个；细化分类（腿拆为股四头肌/腘绳肌/臀/小腿，手臂拆为肱二头肌/肱三头肌，新增前臂、斜方/颈等），按器械补全变式。
- 现有 27 个动作的 `id` 一律不变、不删，仅追加新动作；`MAIN_LIFTS` 三大项不变。
- 动作对象新增**可缺省**的专业元数据字段：`equipment`（器械）、`primaryMuscle`/`secondaryMuscles`（主/协同肌群）、`pattern`（动作模式）、`aliases`（别名，供搜索）。旧动作缺字段时不报错、不影响显示与曲线。
- 动作选择面板（`pages/workout/edit`、`pages/template/edit`）与动作库管理页（`pages/exercise/library`）新增按**名称 + 别名**的模糊搜索框。
- 非破坏：记录模型仍为 weight×reps，不支持有氧/计时类动作；不改 4 个云集合的既有字段。

## Capabilities

### New Capabilities
<!-- 无新增能力，沿用既有动作库能力 -->

### Modified Capabilities
- `exercise-library-management`: 动作库由扁平四字段扩展为含专业元数据（器械/肌群/模式/别名，均可缺省）；查看能力新增「按名称+别名模糊搜索」要求；分类集合扩展且向后兼容（旧 id 与历史引用不变）。

## Impact

- `config/exercises.js`：扩充 `EXERCISES`、`CATEGORIES`，新增元数据字段（可缺省）。
- `utils/exerciseLib.js`：透传新字段；新增搜索辅助函数（纯函数，按名称+别名匹配）。
- `pages/workout/edit`、`pages/template/edit`、`pages/exercise/library`（js/wxml/wxss）：动作选择面板加搜索框与结果渲染。
- `tests/algo.test.js`：补 `exerciseLib` 搜索 + 元数据缺省回退用例；动作 id 稳定性回归断言。
- 不影响：4 个云集合 schema、`utils/unit.js`、曲线/PR 聚合逻辑（仍按 id）。

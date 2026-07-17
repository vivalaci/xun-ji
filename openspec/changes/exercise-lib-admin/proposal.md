## Why

内置动作库是 `config/exercises.js` 里的静态常量（100 动作），改个名称或分类都得发版并**等微信审核**——对一个纯内容型的调整，代价荒谬。让 App 所有者（单一管理员）在「我的」→ 动作库里直接编辑，改动经云端下发给所有用户，不必发版。

## What Changes

- 新增云集合 `exercise_overrides`（**跨用户共享**，项目首个共享集合），只存**相对 config 基线的差异**，三种文档：
  - `{ kind:'patch', targetId, name?, category?, aliases?, hidden? }` — 改内置动作
  - `{ kind:'exercise', id:'gbl_xxx', name, category, aliases?, loadType?, ... }` — 新增**全局**动作（对所有用户可见，区别于每用户私有的 `custom_exercises`）
  - `{ kind:'categories', order:[...] }` — 自定义类别与顺序
- 新增**项目首个云函数** `exerciseAdmin`：承担全部管理写入，函数内校验 `cloud.getWXContext().OPENID === ADMIN_OPENID`（微信注入，客户端伪造不了）。集合权限设「所有用户可读，仅管理端可写」——客户端**根本写不了**。
- `utils/exerciseLib.js` 合并层扩展为：（内置 + 拼全局新增）→ 套 patch（对内置与全局均生效）→ 拼每用户自建。
- 「我的」→ 动作库页（`pages/exercise/library`）加管理模式：改名、改分类、改别名、隐藏、新增全局动作、编排类别顺序。管理入口经**隐藏手势**触发（避免每用户每启动调云函数产生调用开支），入口仅为 UI 便利、**不担安全职责**。
- **自建动作升格为全局动作（管理员专属，实现期扩展，见 design D8）**：管理模式下自建动作（`cus_`）行提供「升格」——确认名称/分类/别名后保存，云端新建 `gbl_` 全局动作（所有用户可见），原 `cus_` 自动隐藏作历史锚点（按 id 仍解析，历史/曲线/PR 不受影响；云写失败不动本地）；已隐藏的自建可「取消隐藏」。普通用户对自建动作维持仅删除。`aliases`/`hidden` 为 `custom_exercises` 可缺省新字段。
- **隐藏（hidden）语义**：从动作库/选择面板/搜索中消失，但 `getExercise`/`getName` **仍须按 id 解析** —— 否则隐藏一个动作会让所有用户的历史记录变成「已删除动作」。
- **三大项（`MAIN_LIFTS`：bench/squat/deadlift）禁止隐藏**——与首页曲线硬绑定。
- `有氧` 强制置末的既有规则**保留**，`kind:'categories'` 的 order 只管非有氧类别。

**BREAKING**（对项目既有前提，非对用户）：
- 引入首个云函数 → 新增部署步骤；云函数自带 `wx-server-sdk` 依赖。CLAUDE.md「无 npm 依赖、无构建步骤」需限定为「**小程序端**无 npm 依赖」。
- **架构铁律 1 开例外**：管理写入走云函数直调，**不走** `db.saveLocalFirst` 本地先写队列（服务端权威的共享内容，本地先写无意义）。读仍走 db 缓存优先 + refresh。

## Capabilities

### New Capabilities
- `exercise-lib-admin`: 管理员（单一 openid）对全局动作库的内容管理——覆盖集合、云函数权限门、改名/改类/别名/隐藏/全局新增/类别编排。

### Modified Capabilities
- `exercise-library-management`: 「查看动作库」的合并口径加入 `exercise_overrides`（patch + 全局动作）；新增 hidden 动作的展示与解析语义。

## Impact

- **新增** `cloudfunctions/exerciseAdmin/`（`index.js` + `package.json`，依赖 `wx-server-sdk`）；`ADMIN_OPENID` 存云函数**环境变量**，不进代码、不进 git。
- **新增** 云集合 `exercise_overrides`，权限「所有用户可读，仅管理端可写」（需在云开发控制台配置）。
- `utils/exerciseLib.js`：`allExercises`/`byCategory`/`getExercise`/`searchExercises` 接入覆盖合并；隐藏动作仅从列举/搜索排除，解析仍命中。
- `utils/db.js`：`exercise_overrides` 的读（缓存优先 + refresh）。
- `pages/exercise/library.*`：管理模式 UI + 隐藏手势入口。
- `tests/algo.test.js`：合并纯函数用例（patch 覆盖、hidden 排除但可解析、全局动作、类别排序、有氧置末、三大项拒绝隐藏）。
- `CLAUDE.md` / `docs/06` / `docs/07`：铁律 1 例外与依赖限定语。
- `docs/usermanual.md`：管理功能属所有者专用，按需决定是否写入面向用户的手册。
- 不改 4 集合既有字段；`config/exercises.js` 基线保留（离线/冷启兜底），无迁移。

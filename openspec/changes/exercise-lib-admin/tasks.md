## 1. 云环境准备（手工，开发者工具/控制台）

- [ ] 1.1 云开发控制台新建集合 `exercise_overrides`，权限设为「所有用户可读，仅管理端可写」（客户端不可写）
- [x] 1.2 建 `cloudfunctions/exerciseAdmin/`（`index.js` + `package.json`，依赖 `wx-server-sdk`）；确认 `project.config.json` 的 `cloudfunctionRoot` 已指向 `cloudfunctions/`
- [ ] 1.3 取得管理员 openid：先部署一个回显 `cloud.getWXContext().OPENID` 的版本，本机调用一次拿到 openid（或云开发控制台查）
- [ ] 1.4 在云函数配置中设环境变量 `ADMIN_OPENID`（不写进代码、不进 git）

## 2. 云函数（权限门 + 写入）

- [x] 2.1 `exerciseAdmin/index.js`：校验 `cloud.getWXContext().OPENID === process.env.ADMIN_OPENID`，不匹配直接拒绝（不产生任何写入）
- [x] 2.2 实现写入动作：patch（name/category/aliases/hidden）、新增全局动作（`gbl_` id）、类别顺序（`kind:'categories'`）
- [x] 2.3 **服务端**强制拒绝对 `MAIN_LIFTS`（bench/squat/deadlift）的 `hidden:true`
- [x] 2.4 服务端校验：id 不可改、内置动作不可删、`gbl_` id 不与既有 id 碰撞
- [x] 2.5 云函数保持极薄；可复用的判断（三大项名单等）抽纯函数供单测

## 3. 合并层（`utils/exerciseLib.js`）

- [x] 3.1 接入 `exercise_overrides`：合并顺序 内置 → 套 patch → 拼全局动作 → 拼 `custom_exercises`
- [x] 3.2 `byCategory`：按 `kind:'categories'` 的 order 排非有氧类别，`有氧` 仍强制置末；无该文档时回退现有逻辑；空类别不显示
- [x] 3.3 `hidden` 语义：`byCategory`/`searchExercises`/选择面板 排除；`getExercise`/`getName` **仍解析**（历史完整性）
- [x] 3.4 合并结果做一次性 memo，避免每次取动作重复套 patch
- [x] 3.5 `utils/db.js`：`exercise_overrides` 的读走缓存优先 + refresh；无网/首启安全回退基线

## 4. 管理端写入通道（铁律 1 例外）

- [x] 4.1 新增 `utils/adminApi.js` 薄封装 `wx.cloud.callFunction`（写入不走 `saveLocalFirst` 乐观队列，配真实 loading/失败态）
- [x] 4.2 在 `CLAUDE.md`、`docs/06-technical-architecture.md`、`docs/07-development-guide.md` 写明该例外与理由，避免被误读为破例先例

## 5. 管理 UI（`pages/exercise/library`）

- [x] 5.1 隐藏手势入口（如标题连点 5 次）→ 调云函数验证 → 进管理模式；**不在启动/进页时自动调用**
- [x] 5.2 管理模式：改名、改分类、改别名、隐藏/取消隐藏（三大项灰置并说明）
- [x] 5.3 管理模式：新增全局动作（名称/分类/别名）
- [x] 5.4 管理模式：新增自定义类别 + 编排类别顺序（有氧固定末位、不可拖动）
- [x] 5.5 失败态：云函数拒绝/网络失败时明确提示，不静默

## 6. 测试与验证

- [x] 6.1 `tests/algo.test.js` 补合并纯函数用例：patch 覆盖名称/分类/别名、hidden 排除于列举但可按 id 解析、全局动作拼接、`gbl_`/`cus_` 命名空间、类别 order + 有氧置末、无 overrides 回退基线
- [x] 6.2 三大项拒绝隐藏的纯函数用例
- [x] 6.3 语法检查：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`（注意排除或单独处理 cloudfunctions 的 node_modules）
- [x] 6.4 `node tests/algo.test.js` 全绿
- [ ] 6.5 真机/模拟器走查：管理员进管理模式改名 → 另一账号（或清缓存）验证改动下发；非管理员触发手势被拒；无网时看到基线不报错
- [ ] 6.6 **安全验证**：直接用客户端 `wx.cloud.database()` 写 `exercise_overrides` 应被集合权限拒绝；伪造调用 `exerciseAdmin` 应被 OPENID 校验拒绝

## 7. 文档与归档

- [x] 7.1 `CLAUDE.md`：「无 npm 依赖、无构建步骤」限定为「**小程序端**无 npm 依赖」；补云函数部署说明
- [x] 7.2 `docs/06`/`docs/07`：补首个云函数、共享集合、铁律 1 例外、云函数部署与环境变量流程
- [x] 7.3 `docs/usermanual.md`：管理功能属所有者专用——决定是否写入面向用户的手册（倾向不写）→ **决定：不写**。管理模式对普通用户不可见、无新交互；内容变化（改名/新动作/类别）对用户透明呈现，无需解释
- [x] 7.4 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 7.5 `/opsx:sync` → `/opsx:archive`（打 tag）

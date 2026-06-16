# 阶段七附录：开发指南（流程与规范）

> 本文是「训记」的开发操作手册：从环境搭建、日常开发流程、代码规范，到测试与发布。
> 产品/技术背景请读 [00-overview](./00-overview.md) 与 [06-technical-architecture](./06-technical-architecture.md)；本文只讲「怎么干活」。

---

## 一、项目现状速览（2026-06）

| 项 | 状态 |
|----|------|
| 迭代一（训练记录 + 三大项曲线闭环） | ✅ 代码完成 |
| 迭代二（身体数据、模板/动作库管理、设置 lb、动作详情、PR） | ✅ 代码完成，`node --check` + 7 个单测全过 |
| 真机/模拟器联调 | ✅ 通过（AppID 已配置，云环境已搭建） |
| 版本控制 | ✅ git 已初始化（基线 commit 已建） |

进度跟踪：`openspec/changes/iteration-2/tasks.md`（全部完成，待归档）。

---

## 二、环境搭建（一次性）

1. **注册小程序账号**：https://mp.weixin.qq.com → 选「小程序」→ 个人主体免费 → 拿到 AppID。
2. **安装微信开发者工具**：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
3. **导入项目**：开发者工具 →「导入项目」→ 目录选 `E:\训记` → 填 AppID。
4. **开通云开发**：工具顶栏「云开发」→ 开通免费基础版。项目用 `DYNAMIC_CURRENT_ENV`，一般无需改 `app.js`。
5. **建 4 个集合**（云开发控制台 → 数据库，权限均选「仅创建者可读写」）：
   `workouts`、`body_records`、`workout_templates`、`custom_exercises`。
6. **本地工具链**：仅需 Node.js（跑单测和语法检查），无 npm 依赖、无构建步骤。

---

## 三、日常开发流程（OpenSpec 工作流）

本项目用 OpenSpec 管理需求与变更，规格在 `openspec/specs/`（当前现状），变更在 `openspec/changes/<change-id>/`（提案 + 设计 + 任务 + 增量规格）。完整流程：

```
想法/问题
   │  /opsx:explore     —— 想清楚要不要做、做成什么样
   ▼
新建变更
   │  /opsx:propose     —— 生成 proposal.md / design.md / tasks.md / specs/ 增量
   ▼
实现
   │  /opsx:apply       —— 按 tasks.md 逐项实现并勾选
   │  （每完成一块：node --check 全部 js + node tests/algo.test.js）
   ▼
验证
   │  开发者工具编译 → 模拟器走主流程 → 「预览」扫码真机
   ▼
归档
   │  /opsx:sync        —— 把增量规格合回 openspec/specs/
   │  /opsx:archive     —— 变更移入 openspec/changes/archive/
   ▼
更新 README.md 进度区 + docs/00-overview.md 阶段表
```

约定：

- **一个迭代 = 一个 change**（如 `iteration-2`），小修小补可直接改，但凡动行为/页面/数据口径的都走 change。
- `tasks.md` 是唯一进度真相：做完一项勾一项，阻塞项标注原因（参见迭代二 8.3 的写法）。
- 设计决策写进 `design.md` 的 Decisions 一节，**附带被否方案和理由**——这是后人理解「为什么这样做」的唯一出处。

---

## 四、架构铁律（改代码前必读）

这些是迭代一/二验证过的核心约定，新代码必须遵守：

1. **所有云数据读写走 `utils/db.js`**，页面不直接 `wx.cloud.database()`。
   - 读：先 `db.getCache(coll)` 同步渲染首屏，再 `db.refresh(coll)` 异步更新。
   - 写：一律 `saveLocalFirst / updateLocalFirst / removeLocalFirst`（本地先落 + 失败重试队列）。
2. **重量数值只在边界换算**：落库恒为 kg、完整精度、不提前 round；显示/录入必须过 `unit.toDisplay / unit.toStore`。加新的重量展示点时全仓搜一遍，别裸读数字。
3. **动作身份靠 `exerciseId`，不靠名字**：曲线、PR、历史聚合全部按 id；展示名通过 `utils/exerciseLib.js` 合并表查（内置 + 自建，含被删动作占位回退）。
4. **PR 是读取侧现算**（`util.buildPRMap`），不落库字段。编辑/删除历史后自动重算，别试图缓存成数据库字段。
5. **图表只用 `utils/chart.js`**（Canvas 2D，无第三方库）；缺值断线不补零。
6. **不改 4 集合的 schema**。确需加字段时：新字段必须可缺省（老数据无感），并在 change 的 design.md 写迁移方案。
7. **页面目录扁平分组**：`pages/<域>/<页面>`（如 `pages/template/{manage,edit}`），新页面记得在 `app.json` 注册。

---

## 五、测试与验证

### 本地（无需微信环境，随手跑）

```powershell
# 语法检查（全部 js）
Get-ChildItem -Recurse -Filter *.js -Exclude node_modules | ForEach-Object { node --check $_.FullName }

# 核心算法单测（主力工作组重量、PR 识别、lb 往返换算）
node tests/algo.test.js
```

新算法逻辑（`utils/util.js`、`utils/unit.js` 一类纯函数）必须在 `tests/algo.test.js` 加用例；页面逻辑不强求单测，靠模拟器走查。

### 模拟器走查清单（每次改动后挑相关项）

- 新建训练：选模板 → 预填上次数据 → 步进调整 → 保存即出现在列表
- 首页曲线：三大项 + 体重/体脂趋势，1M/3M/6M/ALL 切换，点曲线进动作详情
- 弱网：开发者工具切「弱网/离线」→ 保存仍提示成功 → 恢复网络后队列自动重试
- 单位：设置切 lb → 录入步进 ±5、曲线/详情数值一致 → 切回 kg 数值不漂移
- PR：录一次创新高的主力工作组重量 → 列表徽标 + 动作详情标记出现

### 真机验证（已通过首次联调，后续迭代沿用）

每个迭代上线前重点验证：云端读写与 `_openid` 隔离、真机 Canvas 渲染、弱网队列在真实网络下的表现。真机操作需用户在微信开发者工具「预览」执行，Claude 应主动提请并给出验证点清单。

---

## 六、发布流程

1. 真机联调清单全过，`tasks.md` 全勾。
2. **同步更新 `docs/usermanual.md`（发版必需）**：凡新增/改变面向用户的功能、页面或交互，归档/发版前必须把用户手册更新到与当前版本一致；手册更新本身列入该 change 的 tasks。
3. 开发者工具「上传」→ mp.weixin.qq.com 后台「版本管理」→ 提交审核（类目选工具/健康类）。
4. 审核通过后「发布」。回滚方式：后台切回旧版本代码，数据 schema 向后兼容（见各 change 的 Migration Plan）。
5. 发布后更新 `docs/00-overview.md` 阶段表（阶段⑧）与 README 进度区。

---

## 七、版本控制

git 已初始化（基线 commit：迭代一+迭代二）。约定：

- 每个 OpenSpec 任务或一组相关任务一个 commit；change 归档时打 tag（如 `iteration-2`）。
- `project.config.json` / `project.private.config.json` 中的 AppID 属个人配置，若将来推远端仓库注意脱敏。

---

## 八、常见改动速查

| 想做的事 | 改哪里 |
|---------|--------|
| 加内置动作 | `config/exercises.js`（id 必须唯一且永不复用） |
| 改预设模板 | `config/templates.js` |
| 改主题色/全局样式 | `app.wxss` 顶部 CSS 变量 |
| 改曲线口径 | `utils/util.js` 的 `mainWorkingWeight`（同时更新 docs/06 第二节 + 补单测） |
| 加单位/改换算 | 只改 `utils/unit.js`（这是设计验证点，别在页面里散写换算） |
| 加新页面 | `pages/<域>/` 建目录 → `app.json` 注册 → 读写走 `db.js` |
| 加新集合 | 慎重——先走 change 流程，云控制台建集合 + 权限「仅创建者可读写」+ `db.js` 的 `COLL` 注册 |

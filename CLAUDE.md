# 训记 · 微信小程序（健身数据记录）

面向进阶训练者的训练记录工具。微信原生小程序 + 云开发，无 npm 依赖、无构建步骤。

**开发必须遵循 [docs/07-development-guide.md](docs/07-development-guide.md)**（流程与规范），技术背景见 [docs/06-technical-architecture.md](docs/06-technical-architecture.md)。下面是每次改代码都生效的硬约定。

## 工作流（OpenSpec）

- 凡动行为/页面/数据口径的改动，走 OpenSpec change：`/opsx:propose` → `/opsx:apply`（按 `tasks.md` 逐项勾选）→ 验证 → `/opsx:sync` + `/opsx:archive`。一个迭代 = 一个 change。
- 设计决策写进 change 的 `design.md` Decisions 节，附被否方案和理由。
- 完成后更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表。
- git：每个任务或一组相关任务一个 commit；change 归档时打 tag。

## 架构铁律

1. 云数据读写只走 `utils/db.js`（读：`getCache` 先渲染 + `refresh` 异步更新；写：`saveLocalFirst/updateLocalFirst/removeLocalFirst`），页面禁止直接 `wx.cloud.database()`。
2. 重量落库恒为 kg、完整精度、不提前 round；显示/录入必须过 `unit.toDisplay/toStore`，换算逻辑只许在 `utils/unit.js`。
3. 动作身份靠 `exerciseId`（曲线、PR、历史聚合都按 id）；展示名经 `utils/exerciseLib.js` 合并表查，含被删动作占位回退。
4. PR 读取侧现算（`util.buildPRMap`），不落库字段。
5. 图表只用 `utils/chart.js`（Canvas 2D，无第三方库）；缺值断线不补零。
6. 不改 4 集合（workouts/body_records/workout_templates/custom_exercises）的既有字段；新字段必须可缺省并写迁移方案。
7. 新页面放 `pages/<域>/<页面>` 扁平分组，并在 `app.json` 注册。

## 每次改动后的验证

```powershell
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }   # 语法
node tests/algo.test.js                                                             # 算法单测
```

- 纯函数逻辑（`utils/util.js`、`utils/unit.js` 等）改动必须在 `tests/algo.test.js` 补用例。
- 页面改动按指南第五节的模拟器走查清单自检；真机验证需用户在微信开发者工具操作，主动提请用户执行并给出验证点清单。

## 注意

- `project.private.config.json` 与 AppID 属个人配置，推远端前注意脱敏。
- 早期草稿在 `draft_archive/`，已作废，仅备查，不要从中复用代码。

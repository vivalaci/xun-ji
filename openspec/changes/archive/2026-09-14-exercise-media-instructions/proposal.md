## Why

动作库只有名字，没有「这个动作长什么样、怎么做」，新动作或冷门器械动作用户选的时候要靠猜。素材已备齐（workout-guide 100 个动作 3 帧线稿，CC BY-SA 4.0）；中文要领源数据（exercises-dataset，MIT）核查后发现 4 条缺失、5 条描述的是另一个动作、87 条带机翻套话，必须重写才能用。同时核查中暴露出若干内置动作中文名不规范（如「哑铃后撑」「斜板哑铃弯举」）和「海豹划船」与 T 杠划船混用，一并纠正。

## What Changes

- **动作示意图**：内置动作显示 3 帧线稿示意图，素材放微信云存储（不进包）。
  - 动作库、训练编辑页与模板编辑页的「添加动作」面板：每个动作行右端显示**静态缩略图**（懒加载）；首页「添加曲线」选择器不加。
  - 动作详情页：曲线下方显示示意图，**自动循环播放**（3 帧乒乓）。
  - 点击任意示意图打开**放大层**：大图循环 + 动作名 + 要领。
  - 无图（自建 `cus_`、全局 `gbl_`、海豹划船、加载失败、离线）时不显示图、不报错。
- **中文要领**：力量动作（含新增海豹划船，共 94 条）按「步骤 3–5 + 要点 1–2」统一重写，显示在详情页示意图下方与放大层；有氧动作不写。
- **内置动作改名**（旧名保留为别名）：哑铃俯身臂屈伸、上斜哑铃弯举、俯身哑铃飞鸟、哑铃颈后臂屈伸、直杆下压、粗绳下压、绳索髋屈伸、哑铃登阶、站姿哑铃推举、侧平板支撑、T杠划船、GHR臀腿提升；「斜托弯举」别名从上斜哑铃弯举移到牧师凳弯举。
- **新增内置动作「海豹划船」**（`seal_row`）；「海豹划船/俯卧划船/seal row」别名从 `t_bar_row` 移到新动作。内置动作 100 → 101。
- **历史记录动作名按 id 实时显示**：老记录跟随改名；动作已删除时回退显示保存时的名称，都没有才显示「已删除动作」。
- **素材流水线**：SVG 母版 + 转换脚本（`tools/media/`）进 git，PNG 不进 git。
- **署名**：使用说明新增末节「致谢」（示意图改编自 workout-guide/Everkinetic 并已重新着色，CC BY-SA 4.0；要领参考 exercises-dataset，MIT）。

## Capabilities

### New Capabilities
- `exercise-guide`: 动作示意图（列表缩略图、详情页循环、放大层）与中文要领的展示、素材来源与无图降级。

### Modified Capabilities
- `exercise-detail`: 详情页曲线下方新增示意图（自动循环、可放大）与要领。
- `exercise-library-management`: 内置动作中文命名规范与新增海豹划船；历史记录动作名按 id 实时解析并回退到保存时名称。
- `in-app-usermanual`: 末节由「参考资料」改为「致谢」（参考资料顺移为倒数第二节）。

## Impact

- **新增**：`components/`（首个自定义组件：缩略图、示意图播放、放大层）、`config/exerciseMedia.js`、`config/exerciseInstructions.js`、`utils/exerciseMedia.js`（纯函数 + 单测）、`tools/media/`（开发期脚本，自带 `sharp` 依赖，不打包）。
- **修改**：`config/exercises.js`（改名/别名/新增 seal_row）、`utils/exerciseLib.js`（带回退的取名函数）、`pages/exercise/{library,detail}`、`pages/workout/edit`、`pages/template/edit`、`pages/workout/list.js`、`project.config.json`（packOptions 忽略 tools）、`.gitignore`（忽略 PNG 成品）、`docs/usermanual.md` + `config/manual.js`、`docs/00`、`docs/10`、`CHANGELOG.md`、`CLAUDE.md`/`docs/06`（components 目录约定）。
- **数据/集合**：不改任何集合字段、无迁移。老记录中 `t_bar_row` 名下的数据将显示为「T杠划船」（手册 FAQ 说明）。
- **外部依赖**：微信云存储（需用户上传 PNG、设「所有用户可读」并提供 fileID 前缀）；云存储下载流量（每次详情页约 3 张图）。
- **不涉及**：`profile.js`（用户本地手工改动）、首页「添加曲线」选择器、`exercise_overrides`/云函数。

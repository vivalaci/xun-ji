# 训记 · 健身数据记录小程序

面向**进阶训练者**的训练记录工具：3 分钟记完一次训练，首页直接看三大项（卧推/深蹲/硬拉）进步曲线。

> 完整产品规划见 [`docs/`](docs/00-overview.md)。本文件只讲怎么把它跑起来。

---

## 功能

- 训练记录：选预设/自建模板快速录入，自动预填上次同类训练并按目标组次铺组
- 进步曲线 + 训练日历：三大项主力工作组重量曲线、可定制曲线、首页月视图日历，时间范围 1M/3M/6M/ALL
- 身体数据：体重 / 体脂 / 腰围录入与趋势图
- 动作库：内置动作（含三大项、自重、有氧）+ 自建动作，支持按名称/别名搜索
- 动作示意图与要领：动作库与「添加动作」面板显示缩略图，动作详情页循环播放示意图 + 中文要领，点击放大（图存微信云存储）
- 动作库云端内容管理（所有者专用）：改名/改分类/改别名/隐藏、新增全局动作、类别编排，改动经云端下发全体用户、不发版；安全边界在 `exerciseAdmin` 云函数（OPENID 校验）
- 设置与说明：重量单位 kg/lb 切换、应用内使用说明
- 分享：首页与身体页可转发好友/群、分享朋友圈，分享卡片用品牌图不带个人数据
- 底层：PR 自动标记、弱网本地优先存储（本地先写 + 失败重试队列 + 缓存优先读）

> 算法单测：`node tests/algo.test.js`。

---

## 目录结构

```
训记/
├── app.js / app.json / app.wxss     入口、4 Tab 配置、全局样式
├── config/
│   ├── exercises.js                 内置动作库（带稳定 id、三大项标记）
│   ├── exerciseMedia.js             示意图云存储前缀 + 有图动作清单
│   ├── exerciseInstructions.js      内置力量动作中文要领（步骤 + 要点）
│   └── templates.js                 预设模板（三分化 + 二分化，共 5 套）
├── utils/
│   ├── db.js                        数据访问层（缓存优先读 + 本地先写 + 队列）
│   ├── store.js                     本地存储底层（缓存 + 队列）
│   ├── util.js                      日期、主力工作组重量算法、PR 现算
│   ├── unit.js                      单位转换层（kg/lb，从设置读取）
│   ├── exerciseLib.js               动作合并查询（内置 + 全局覆盖层 + 自建，按 id 取名）
│   ├── exerciseMedia.js             示意图取图 / 要领取数纯函数
│   ├── adminApi.js                  管理写入通道（exerciseAdmin 云函数薄封装）
│   ├── templateLib.js               模板分组/迁移纯函数（分桶展示、存量迁移判定）
│   ├── curveConfig.js               曲线配置纯函数（合成/排序/增删校验/槽位配色）
│   ├── calendar.js                  训练日历纯函数（月网格/按日期聚合/分化分类配色）
│   └── chart.js                     Canvas 折线图
├── pages/
│   ├── curve/                       首页（Tab1）：训练日历 + 进步曲线 → 点曲线进动作详情
│   ├── workout/{list,edit}          训练列表 / 新建编辑（Tab2）
│   ├── body/{body,edit,detail}      身体数据 列表/录入/详情（Tab3）
│   ├── profile/                     我的（Tab4，含模板/动作库/设置入口）
│   ├── template/{manage,edit}       训练模板管理 / 编辑
│   ├── exercise/{library,detail}    动作库管理 / 动作详情
│   └── settings/                    设置（重量单位）
├── components/                      可复用展示组件：exercise-thumb / exercise-anim / exercise-guide / exercise-viewer
├── assets/exercise-media/           动作示意图 SVG 母版（PNG 由脚本生成、传云存储，不进 git）
├── tools/media/                     开发期出图脚本（sharp，不打包）
├── cloudfunctions/
│   └── exerciseAdmin/               云函数：全局动作库管理写入（权限门 + 校验纯函数）
├── tests/algo.test.js              核心算法单测（node 原生）
├── docs/                            产品规划文档（7 份）
└── draft_archive/                   早期草稿（已作废，保留备查）
```

---

## 运行步骤（首次部署参考）

### 1. 注册小程序账号
https://mp.weixin.qq.com → 立即注册 → 选「小程序」→ 拿到 **AppID**（个人主体免费）。

### 2. 安装微信开发者工具
https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 3. 导入项目
开发者工具 →「+ 导入项目」→ 目录选 `E:\训记` → 填入 AppID。

### 4. 开通云开发
点工具上方「云开发」→ 开通（免费基础版即可）。本项目用默认环境（`DYNAMIC_CURRENT_ENV`），通常无需改 `app.js`。

### 5. 建数据库集合
云开发控制台 → 数据库 → 新建集合：

| 集合名 | 用途 | 权限 |
| --- | --- | --- |
| `workouts` | 训练记录 | 仅创建者可读写 |
| `body_records` | 身体数据（体重/体脂） | 仅创建者可读写 |
| `workout_templates` | 训练模板（首次启动自动写入 5 套） | 仅创建者可读写 |
| `custom_exercises` | 自定义动作 | 仅创建者可读写 |
| `user_prefs` | 用户偏好（曲线顺序 / 自定义曲线，单文档） | 仅创建者可读写 |
| `exercise_overrides` | 全局动作库覆盖层（管理员内容管理） | **所有用户可读，仅管理端可写** |

### 6. 部署云函数（动作库管理用，普通功能不依赖）
开发者工具 → 云开发 → 对 `cloudfunctions/exerciseAdmin` 右键「上传并部署：云端安装依赖」；云开发控制台 → 云函数 → exerciseAdmin → 配置 → 环境变量设 `ADMIN_OPENID`（管理员 openid；首次可先部署，在动作库页底部计数连点 5 次触发调用，从云函数日志取 openid）。

### 7. 上传动作示意图（可选，不做则 App 不显示示意图、其余功能正常）
1. 出图：`cd tools/media`，`npm install`，`node build.js`（在 `assets/exercise-media/<id>/` 生成 `0/1/2.png` 与 `thumb.png`）。
2. 云开发控制台 → 存储 → 新建目录 `exercise-media`，把各动作子目录（仅 PNG）上传进去，保持 `exercise-media/<id>/0.png` 结构。
3. 存储权限设为「所有用户可读」。
4. 复制任一文件的 File ID，把 `.../exercise-media` 之前的部分连同 `exercise-media` 填进 `config/exerciseMedia.js` 的 `PREFIX`（形如 `cloud://<环境ID>.<存储桶>/exercise-media`，末尾不带 `/`）。

### 8. 编译运行
点「编译」即可在模拟器使用；首次进入「新建训练」会自动创建 5 套预设模板（三分化：推日/拉日/蹲日；二分化：上肢/下肢）。旧版本数据会自动迁移（模板归组、腿日更名蹲日、补种二分化）。「预览」可扫码真机体验。

---

## 改动指南

- **加动作**：编辑 `config/exercises.js`，给唯一 `id`（勿改/删既有 id），可选填元数据（equipment/primaryMuscle/secondaryMuscles/pattern/aliases）；自重动作标 `loadType:'bodyweight'`。要示意图：放 `assets/exercise-media/<id>/0|1|2.svg` → 重跑出图并上传 → 在 `config/exerciseMedia.js` 清单加 id；要要领：在 `config/exerciseInstructions.js` 加条目（单测校验格式与用词）。
- **改预设模板**：编辑 `config/templates.js`。
- **改主题色**：编辑 `app.wxss` 顶部 CSS 变量。
- **曲线口径/单位换算**：分别在 `utils/util.js` 的 `mainWorkingWeight` 和 `utils/unit.js`。

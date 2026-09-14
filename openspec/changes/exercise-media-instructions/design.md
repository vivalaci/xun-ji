## Context

- 内置动作 100 个在 `config/exercises.js`（静态常量随包），经 `utils/exerciseLib.js` 四层合并（内置+全局 `gbl_` → patch → 自建 `cus_`）。动作详情页 `pages/exercise/detail` 现为「范围切换 + 曲线卡 + 历史列表」。
- 素材已在本地：`assets/exercise-media/<id>/0|1|2.svg`（workout-guide 母版，单一 `path fill="#fff"`）与 `0|1|2.png`（512×512 透明、已改色 `#1F2937`，单张约 33KB、共约 10MB）。100/100 覆盖（93 精确 + 7 近似）。PNG 的生成方式无记录、仓库无脚本。`project.config.json` 已 `packOptions.ignore` 该目录。
- 要领源数据 `docs/exercise-instructions-map.json`（exercises-dataset，MIT）：93 条中 4 条空、5 条描述的是另一个动作、87 条带「重复所需的重复次数」机翻套话 → 只作参考，全部重写。
- 项目**零**云存储使用、**零**自定义组件；主包上限 2MB；「添加动作」面板 `.picker-panel` 为 `position:fixed` + `transform: translateY`。
- 用户本地 `pages/profile/profile.js` 有未提交手工改动（「关于训记」正文那一行）。
- 本机有 Node 24、Python 3.14 + Pillow，无任何 SVG 栅格化库。

## Goals / Non-Goals

**Goals:**
- 内置动作在动作库、两个「添加动作」面板、详情页可见示意图；详情页与放大层自动循环；放大层含要领。
- 94 条力量动作要领准确、口径统一。
- 纠正不规范中文名、拆分海豹划船与 T 杠划船。
- 老记录动作名跟随改名，且不让已删除动作退化成占位。
- 素材可复现（脚本 + 母版进 git）。

**Non-Goals:**
- 不给 `cus_`/`gbl_` 动作配图或要领，不做管理员上传图片/编辑要领（后续可经 `exercise_overrides` patch 扩展）。
- 不为海豹划船产图、不替换 7 个近似图。
- 首页「添加曲线」选择器不加缩略图。
- 不改任何集合字段、不迁移历史数据（含 `t_bar_row` 名下记录）。

## Decisions

### D1：素材放云存储，按「路径约定 + 前缀常量 + 有图清单」取图
云存储路径 `exercise-media/<id>/0.png|1.png|2.png|thumb.png`。`config/exerciseMedia.js` 只存 `PREFIX`（形如 `cloud://<env>.<bucket>/exercise-media`，用户上传后提供）与有图 id 清单（`{ bench: 3, ... }`）。`utils/exerciseMedia.js` 纯函数 `framesFor(id)` → 3 个 fileID 或 `[]`、`thumbFor(id)` → fileID 或 `''`，不在清单（`cus_`/`gbl_`/`seal_row`/未来新增内置）一律无图。
- 否决「打进包/分包」：10MB 远超主包 2MB；分包资源主包页面引用不到。
- 否决「每个动作存 fileID 字段」：300 个 fileID 绑死云环境，换环境全失效；且内置动作不在集合里，铁律 6 与之无关。
- 否决「默认内置动作都有图」：未来往 config 加动作忘了配图会破图；显式清单更稳。
- 否决 `wx.cloud.getTempFileURL`：多一次网络调用且 URL 会过期；`<image>` 原生支持 `cloud://` fileID。
- 管理员 patch 不改 id → 改名/隐藏后图照样对得上。

### D2：首个自定义组件 + 放大层挂页面根部
- `components/exercise-thumb`：静态缩略图（`thumbFor`，`lazy-load`，`binderror` 时隐藏），`catchtap` 触发 `enlarge` 事件（带 id），**不**冒泡到行点击（行点击仍是添加动作/进详情）。无图时组件不渲染任何占位。
- `components/exercise-anim`：内联循环播放（见 D3），详情页与放大层复用。
- `components/exercise-viewer`：全屏放大层（遮罩 + 大图循环 + 动作名 + 要领），由**页面**在根部放一个，页面收到 `enlarge` 后 `setData({ viewerId })` 打开。
- 否决「放大层嵌在缩略图组件里」：面板 `.picker-panel` 带 `transform`，其内的 `position:fixed` 会以面板为包含块被裁切，盖不住全屏。
- 否决 `wx.previewImage`：只能静态轮播，无法循环、无法附要领。
- `root-portal` 也可解（基础库 3.5.0 满足），但每个页面放一个查看器更直观、行为确定，选后者。
- 新增 `components/` 目录约定写入 CLAUDE.md 与 docs/06 代码地图。

### D3：动画用三层叠放 + CSS keyframes，列表只用静态缩略图
三张 `<image>` 绝对定位叠放、各加载一次，通过 CSS `@keyframes` 切 `opacity` 实现乒乓 0→1→2→1（每步 450ms，一轮 1.8s，`steps` 硬切不渐变）。三帧 `bindload` 全部到齐前只显示第 0 帧、到齐后加播放 class；任一帧 `binderror` → 整块隐藏。
- 否决方案文档里的 `setInterval` 切 `src`：云端图每次换 src 重新加载会闪白；每 450ms 一次跨线程 `setData` 且与 canvas 同页；还要在 onHide/onUnload 清定时器。
- 列表静态：动作库一屏可达 100 行，全循环 = 300 张图并发加载 + 100 个动画，扫名字晃眼且费流量（用户确认列表不循环）。
- 缩略图单独出 `thumb.png`（小尺寸，由脚本从 SVG 直接栅格化，比缩放 512 图更清晰），列表不下载 512 大图。缩略图取哪一帧在 apply 时对图择定（默认第 1 帧）。

### D4：要领随包，统一格式与用词口径
`config/exerciseInstructions.js`：`{ [id]: { steps: string[3..5], tips: string[1..2] } }`，94 条（93 力量 + `seal_row`），有氧不写；`utils/exerciseMedia.js` 提供 `instructionsFor(id)` → 对象或 `null`（无则 UI 不显示要领区）。
- 用词口径（与用户确认）：腘绳肌（非「腿筋」）；屈髋（臀部向后推），硬拉类首次括注「髋铰链」；握法一律写「掌心朝下/朝上/相对」，不单写正握/反握；倒蹬机（非「雪橇机」）；平凳/上斜凳/下斜凳（非「长凳」）；龙门架 + 直杆/粗绳/V 把；肩胛写「肩胛骨向后夹紧」；不写「重复所需的重复次数」。
- 内容按我们动作的实际形态写（如 `t_bar_row` 写胸部支撑器械、`overhead_extension` 写坐姿双手托一只哑铃、`calf_raise` 写站姿提踵机、`db_press` 写站姿），不照搬错配的源文本。
- 否决「放云端 / 走 `exercise_overrides`」：本次无「不发版改要领」诉求，随包离线可用最简单；将来需要可加 patch 字段。
- 体积：约 94×150 字，数十 KB 级，主包余量充足。
- 用户过目后才算完成（tasks 列为验收项）。

### D5：改名与新增海豹划船在 config 基线完成
- 改名（旧名保留进 `aliases`）：`db_kickback` 哑铃俯身臂屈伸、`incline_db_curl` 上斜哑铃弯举、`rear_delt_fly` 俯身哑铃飞鸟、`overhead_extension` 哑铃颈后臂屈伸、`tricep_pushdown` 直杆下压、`rope_pushdown` 粗绳下压、`cable_pull_through` 绳索髋屈伸、`step_up` 哑铃登阶、`db_press` 站姿哑铃推举、`side_plank` 侧平板支撑、`t_bar_row` T杠划船（补别名 胸部支撑T杠划船/胸部支撑划船/chest supported row/t bar row）、`glute_ham_raise` GHR臀腿提升。`reverse_curl` 保留「反握弯举」。
- 别名纠错：「斜托弯举」从 `incline_db_curl` 移到 `preacher_curl`（它是牧师凳弯举的叫法）。
- 新增 `seal_row` 海豹划船：背 / 杠铃 / 水平拉 / 主背阔肌，辅斜方肌、肱二头肌；别名 卧式划船、俯卧划船、seal row。**例外**：「海豹划船/俯卧划船/seal row」从 `t_bar_row` 移除（不按「旧名留作别名」处理），否则搜「海豹划船」出两个动作。
- id 一律不变 → 历史、曲线、PR、模板引用不受影响。
- 否决「改名走管理员 patch（不发版）」：本次本就要发版，基线正确比长期堆 patch 干净；patch 优先级高于 config，若线上已 patch 过同名动作以线上为准（风险见下）。

### D6：历史动作名按 id 实时解析，带快照回退
`exerciseLib.displayName(id, snapshot)`：`getExercise(id)` 存在（含 hidden）→ 当前名；否则 `snapshot`（保存时写入的 `name`）非空 → 快照；否则「已删除动作」。纯函数、补单测。调用点 4 处：`workout/edit.js` 力量 `loadExisting`、`buildCardioItem`（传入 prev 的 name）、`workout/list.js` 有氧摘要、`exercise/detail.js` 硬拉变式标注。保存时继续写 `name` 快照，供回退使用。
- 否决「直接 `getName(id)`」：自建动作删除、全局动作被删后，老记录会从「原名」退化成「已删除动作」，比现状更差。
- 否决「保持快照（B4①）」：用户选择老记录跟随改名。

### D7：素材流水线 `tools/media/`
`tools/media/package.json`（依赖 `sharp`，自带 `node_modules`，已被 `.gitignore` 的 `node_modules/` 覆盖）+ `build.js`：读 `assets/exercise-media/<id>/N.svg` → 替换 `fill="#fff"` 为 `#1F2937` → 栅格化 512 → 调色板压缩写 `N.png`；另出 `thumb.png`。输出就地写回 `assets/exercise-media/<id>/`。
- git：SVG 母版、`ATTRIBUTION.md`、脚本进 git；`.gitignore` 加 `assets/exercise-media/**/*.png`。
- 打包：`project.config.json` `packOptions.ignore` 加 `tools`；保留对 `assets/exercise-media` 的忽略；删除已不存在的 `assets/pose-ref` 条目（沿用本地未提交改动）。
- CLAUDE.md 验证命令已排除 `node_modules`，`node --check` 覆盖 `build.js` 本身。
- 否决 Python `cairosvg`：Windows 需额外装 Cairo 原生库；`sharp` 预编译二进制开箱即用，且一个库同时完成栅格化、缩放、调色板压缩。
- 上传不脚本化：由用户在云开发控制台上传并设权限（管理员手工一次性操作），脚本只负责产物。

### D8：署名放使用说明「致谢」末节，不动 profile.js
`docs/usermanual.md` 与 `config/manual.js` 同源新增末节「致谢」：示意图改编自 Bryl Lim（workout-guide）与 Everkinetic，**已重新着色**，CC BY-SA 4.0（附许可链接文本）；动作要领参考 exercises-dataset（MIT）并经重写。「参考资料」顺移为倒数第二节。
- 否决「写进『关于训记』弹窗」：用户未提交的手工改动正在那一行，会冲突；且弹窗不适合放长署名。
- 重新着色属改编：须注明「已修改」，衍生素材按 CC BY-SA 4.0 共享；`assets/exercise-media/ATTRIBUTION.md` 中「原样展示仅需署名」同步更正。

## Risks / Trade-offs

- [云存储批量上传方式未验证] 300+100 个文件分 101 个目录 → apply 第一步先用少量文件试控制台上传；不支持文件夹上传则改用 CloudBase CLI 或分批，产物目录结构不变。
- [读权限配错导致其他用户看不到图] → 真机走查清单要求换账号/清缓存验证；`binderror` 隐藏兜底，不会破图。
- [云存储流量] 详情页每次约 3 张图 + 列表缩略图 → 调色板压缩 + 小缩略图 + 列表懒加载；用户量小，可接受。
- [线上已有管理员 patch 覆盖改名] patch 优先于 config → 走查时核对被改名动作；如有冲突由管理员在管理模式撤掉 patch。
- [`t_bar_row` 老记录改显示为「T杠划船」] 若有用户实际记的是趴凳海豹划船，历史被改名且无法分辨迁移 → 手册 FAQ 说明；新海豹划船从零开始。
- [7 个近似图与动作不完全一致] 已知且接受（如直腿硬拉借用罗马尼亚硬拉图）。
- [脚本输出与现有 PNG 不一致] 现有 PNG 生成方式未知 → 首次运行后抽样目视对比，以脚本输出为准。
- [要领重写质量] 94 条人工撰写仍可能有笔误 → 用户过目为验收项。
- [首个自定义组件] 新约定 → 组件保持薄（只做展示），数据取自纯函数，写入 CLAUDE.md/docs/06。

## Migration Plan

无数据迁移。发布顺序：① 跑 `tools/media` 产出 PNG → ② 用户上传至云存储 `exercise-media/<id>/`、设「所有用户可读」、提供一个 fileID → ③ 填 `config/exerciseMedia.js` 的 `PREFIX` → ④ 真机走查 → ⑤ 发版。先于发版上传不影响线上（旧版本不读这些文件）。回滚：发版回退即可，云存储文件可保留。

## Open Questions

- 云存储批量上传的具体方式（apply 时实测决定）。
- 缩略图取第几帧（apply 时对图择定，默认第 1 帧）。

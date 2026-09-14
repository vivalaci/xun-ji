## 1. 素材流水线

- [x] 1.1 新建 `tools/media/package.json`（依赖 `sharp`）+ `build.js`：读 `assets/exercise-media/<id>/0|1|2.svg` → `fill="#fff"` 改为 `#1F2937` → 栅格化 512×512 调色板压缩写 `0|1|2.png`，另出小尺寸 `thumb.png`；输出就地写回
- [x] 1.2 `.gitignore` 加 `assets/exercise-media/**/*.png`；`project.config.json` `packOptions.ignore` 加 `tools`（连同已删目录 `assets/pose-ref` 条目的移除）
- [x] 1.3 运行脚本；抽样目视对比新旧 PNG（改色、线条、透明底），择定缩略图帧；记录单张与总体积（结果：与旧图目视一致；缩略图取第 1 帧 160px；300 帧共 3.36MB 均 11.2KB，100 缩略图共 295KB 均 2.9KB）
- [x] 1.4 更正 `assets/exercise-media/ATTRIBUTION.md`（重新着色属改编，须注明已修改、同协议共享）；SVG 母版 + ATTRIBUTION.md + 脚本入库，确认 PNG 未进暂存区
- [x] 1.5 【用户】在云开发控制台把 `assets/exercise-media/<id>/*.png`（共 400 个）上传到云存储 `exercise-media/<id>/`（`PREFIX` 已回填），存储权限设「所有用户可读」，发一个上传后文件的 fileID（我先给少量文件的试传步骤，确定批量方式）

## 2. 数据层与纯函数

- [x] 2.1 `config/exercises.js`：12 个改名（旧名入 `aliases`）；「斜托弯举」别名从 `incline_db_curl` 移到 `preacher_curl`；`t_bar_row` 别名改为 胸部支撑T杠划船/胸部支撑划船/chest supported row/t bar row（移除海豹划船/俯卧划船/seal row）；新增 `seal_row` 海豹划船（背/杠铃/水平拉/背阔肌，辅斜方肌、肱二头肌，别名 卧式划船/俯卧划船/seal row）
- [x] 2.2 `config/exerciseMedia.js`：`PREFIX`（占位，待 1.5 回填）+ 有图 id 清单（现有 100 个，不含 `seal_row`）
- [x] 2.3 `config/exerciseInstructions.js`：94 条要领（93 力量 + `seal_row`），每条 `steps` 3–5、`tips` 1–2，按 design D4 用词口径与本应用动作实际形态撰写；有氧不写
- [x] 2.4 `utils/exerciseMedia.js`：`framesFor(id)`、`thumbFor(id)`、`instructionsFor(id)`（无则 `[]`/`''`/`null`）
- [x] 2.5 `utils/exerciseLib.js`：`displayName(id, snapshot)`（可解析→当前名；否则快照；否则「已删除动作」）
- [x] 2.6 `tests/algo.test.js` 补用例：媒体路径与无图（`cus_`/`gbl_`/`seal_row`）、要领存在性与格式（94 条、步骤 3–5、要点 1–2、不含「重复所需」「正握」「反握」「腿筋」「雪橇」「长凳」）、`displayName` 三级回退、旧名别名搜索命中、「斜托弯举」只命中牧师凳弯举、「海豹划船」只命中 `seal_row`、内置 101 且 id 唯一
- [x] 2.7 【用户】过目 94 条要领（我给一份按分类排好的清单）

## 3. 组件（首个 `components/` 目录）

- [x] 3.1 `components/exercise-thumb`：静态缩略图，`lazy-load`，`binderror` 隐藏，无图不渲染；`catchtap` 触发 `enlarge`（带 id），不冒泡到行点击
- [x] 3.2 `components/exercise-anim`：三层 `<image>` 叠放，CSS keyframes 乒乓 0→1→2→1（每步 450ms、硬切），三帧 `bindload` 齐后才播、之前静显第 0 帧，任一 `binderror` 整块隐藏；点击触发 `enlarge`
- [x] 3.3 `components/exercise-viewer`：全屏遮罩（z-index 高于添加动作面板），动作名 + `exercise-anim` 大图 + 要领（有才显示），点遮罩或关闭按钮触发 `close`（实现时要领区抽为 `components/exercise-guide`，详情页与放大层复用）

## 4. 页面接入

- [x] 4.1 动作库页 `pages/exercise/library`：分类分组行与搜索结果行右端加缩略图（与管理模式的编辑/升格/删除按钮共存），页面根部放 viewer
- [x] 4.2 训练编辑页 `pages/workout/edit`：添加动作面板的分类列表行与搜索结果行加缩略图，页面根部放 viewer；关闭 viewer 后面板状态（分类、搜索词）保持
- [x] 4.3 模板编辑页 `pages/template/edit`：同 4.2
- [x] 4.4 详情页 `pages/exercise/detail`：曲线卡下方加 `exercise-anim` + 要领（步骤/要点），点击示意图打开 viewer；硬拉家族用锚点 id；无图无要领不渲染该区
- [x] 4.5 `displayName` 替换 4 处：`workout/edit.js` 力量 `loadExisting`、`buildCardioItem`（传入 prev 的 name）、`workout/list.js` 有氧摘要、`exercise/detail.js` 变式标注；保存仍写 `name`
- [x] 4.6 各页 `.json` 注册 `usingComponents`；确认首页「添加曲线」选择器未受影响

## 5. 文档

- [x] 5.1 `docs/usermanual.md` + `config/manual.js` 同源：动作库节改「内置 101 个」并说明缩略图/点击放大；首页或动作详情说明示意图与要领；FAQ 加「海豹划船已独立为新动作，此前记为『海豹划船』的记录现显示为『T杠划船』」；新增末节「致谢」（示意图改编已重新着色 CC BY-SA 4.0 + 许可链接文本；要领参考 exercises-dataset MIT）
- [x] 5.2 `CLAUDE.md` 与 `docs/06-technical-architecture.md`：`components/` 目录约定、云存储示意图、`tools/media` 开发期依赖说明；`docs/10-project-handoff.md` 代码地图/能力清单/动作数 101
- [x] 5.3 `README.md` 功能区（示意图与要领）+ `CHANGELOG.md` 迭代二十 + `docs/00-overview.md` 阶段表与迭代史
- [x] 5.4 `docs/11`、`docs/12`、`docs/13` 与两份映射 json：状态改为「已接入（迭代二十）」，要领以 `config/exerciseInstructions.js` 为准；一并入库

## 6. 验证与交接

- [x] 6.1 语法校验：`Get-ChildItem -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch 'node_modules' } | ForEach-Object { node --check $_.FullName }`
- [x] 6.2 算法单测：`node tests/algo.test.js` 全绿
- [x] 6.3 `openspec validate exercise-media-instructions`
- [x] 6.4 输出真机走查清单交给用户（含换账号/清缓存验证云存储读权限、面板内放大返回、离线无破图、改名与老记录显示、海豹划船无图）
- [x] 6.5 【用户】真机走查
- [ ] 6.6 【用户】`/opsx:sync` + `/opsx:archive`、push、开 PR、合并、打 tag

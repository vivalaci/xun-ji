## Context

三条用户反馈集中在训练录入与身体趋势图：

- **选模板返回跳错**：`pages/workout/edit` 用 `stage`（`pickTemplate` / `editing`）把"选模板"和"填数据"挤在一页。从训练列表 `navigateTo` 进来后选模板进入 `editing`，左上角系统返回是**页级** `navigateBack`，整页出栈直接回训练列表。小程序默认导航栏的返回键**无法在页内拦截**（只有整页 `navigationStyle:custom` 自绘才行）。
- **训练不能调序**：`pages/template/edit`（模板编辑）早有 `moveUp`/`moveDown`，`pages/workout/edit` 没有。
- **身体趋势看不到体重**：根因在 `utils/chart.js` `drawMultiLine`。每条线独立缩放，平线统一钉在垂直正中（`if(mn===mx){mn-=1;mx+=1}`），且画线顺序 体重(黑)先、腰围(橙)后，橙线把重合的黑线整条盖住；另外极小波动（如体重差 0.1kg）被独立缩放拉成贯穿全图的大斜线。

约束（CLAUDE.md 铁律）：图表只用 `utils/chart.js`（Canvas 2D，无三方库）；显示/换算过 `utils/unit.js`；纯函数改动补 `tests/algo.test.js`；不动 4 集合既有字段；新页面入 `app.json`；归档前同步 `docs/usermanual.md`。

## Goals / Non-Goals

**Goals:**
- 新建训练时左上角返回从编辑页天然退回选模板页；编辑既有训练不经选模板页。
- 训练编辑页（力量 + 有氧）可上移/下移动作。
- 身体趋势各指标线在"平线重合"和"极小波动"下均可辨，体重线不被遮挡、微小波动不被放大。

**Non-Goals:**
- 不重构图表的独立缩放模型（仍保留"每线独立缩放"以让不同量纲的趋势各自可见）。
- 不引入自定义导航栏。
- 不改身体数据/曲线的存储结构，无数据迁移。

## Decisions

### D1：选模板拆为独立页 `pages/workout/pick`（否决自定义导航栏拦截）

新建流程改为 `训练列表 →(新建) pick 页 →(选模板/空白) edit 页`。返回键全程走原生页栈：edit 返回退回 pick，pick 返回退回列表——天然满足预期，且符合小程序"一屏一页"的惯用结构。

- **页面职责**：`pick` 页承接原 `pickTemplate` 阶段的全部展示（`ensureTemplatesSeeded`、`withDotColors` 分化色点、`GROUP_NOTES` 循证说明、按组分节、"空白训练"入口）。`edit` 页删除 `stage`/选模板分支，只保留录入。
- **数据传递（选 URL 参数，不传对象）**：`pick` 仅把**标识**传给 `edit`：选模板 → `?templateId=<id>`；空白 → `?blank=1`。`edit.onLoad` 分三路：`options.id` → 编辑既有（`loadExisting`，行为不变）；`options.templateId` → 从缓存按 id 取模板并 `buildFromTemplate`（历史预填、目标组次等逻辑**留在 edit 页**，照旧读 workouts 缓存）；`options.blank` → 空白力量训练。strength/cardio 由模板 `type` 在 edit 页解析。
  - 否决"用全局变量/事件通道传整个模板对象"：URL 传 id 更简单、可深链、无状态泄漏；模板已在缓存，按 id 取零成本。
- **入口改动**：`pages/workout/list` 的"新建"由 `navigateTo edit` 改为 `navigateTo pick`。日历/列表打开既有训练仍 `navigateTo edit?id=`，不受影响。

### D2：训练编辑页动作调序复用模板页逻辑

照搬 `pages/template/edit` 的 `moveUp`/`moveDown`（slice + 交换 + `setData`），力量与有氧共用同一 `exercises` 数组、同一对处理函数；wxml 在每个动作/活动行加 ↑/↓ 按钮（首行禁上移、末行禁下移）。纯数组顺序操作，组数据随动作整体移动，低风险。

### D3：drawMultiLine —— 最小尺度下限 + 平线按序错位（否决仅改 z 序 / 全局共享缩放）

- **最小尺度**：为每条线引入 `minSpan`（该指标允许的最小取值跨度，**显示单位**计）。计算缩放区间时若实际 `mx-mn < minSpan`，按 `minSpan` 居中扩展。这样 0.1kg 的波动相对 minSpan 极小 → 呈近平线。`minSpan` 由调用方 `curve.js` 按指标供给（来自 `curveConfig` 身体序列配置）：体重阈值在 `lb` 单位下经 `unit` 换算，体脂/腰围无换算。默认阈值（可调）：体重 5（kg）、体脂 5（%）、腰围 5（cm）。
- **平线错位**：当一条线实际跨度≈0（平线），它会落在垂直正中。对所有平线按其在序列中的序号分配一个小的**像素级**垂直偏移（步长如 6px），使多条平线扇形错开而非精确重合；体重序号在腰围之前、错位后落于腰围之下。非平线不偏移。
- **抽纯函数补单测**：把"由 `ys` 与 `minSpan` 求缩放区间 `{lo,hi}`"抽成纯函数（如 `chart.computeBand(ys, minSpan)`），在 `tests/algo.test.js` 覆盖：实际跨度大于阈值按数据缩放、小于阈值按 minSpan 居中扩展、单点/全等的退化情形。平线判定与偏移序号分配也以可测的纯逻辑表达。
- **否决项**：
  - "仅把体重最后画（z 序置顶）"——只是把遮挡转嫁给腰围，平线仍重合。
  - "三线共享同一 y 轴缩放"——不同量纲（kg/%/cm）会让小量纲线被压平，丢掉"每线独立趋势可见"的设计意图。

## Risks / Trade-offs

- **[拆页改动入口多]**（list 入口、edit onLoad 分支、cardio/blank 预填路径）→ 缓解：build 逻辑整体保留在 edit 页，pick 只传 id/flag；走查清单覆盖"按模板新建/空白/有氧/编辑既有/各路返回"。
- **[最小尺度阈值取值]** 太大→中等真实变化被压平；太小→噪声仍被放大 → 缓解：阈值设为可调常量，取保守默认并以单测锁定边界；真机走查确认观感。
- **[平线偏移越界]** 平线多时像素偏移可能顶到边距 → 缓解：步长小、对偏移做 padding 内夹取。
- **[历史预填依赖缓存]** edit 页按 templateId 取模板/历史依赖 workouts、templates 缓存已就绪 → 缓解：pick 页已 `ensureTemplatesSeeded`；edit build 路径读缓存找不到时回退空白，不抛错。

## Migration Plan

无数据迁移（不动集合字段）。部署即页面与渲染层改动；回滚为还原相关文件、移除 `pages/workout/pick` 在 `app.json` 的注册。

## Open Questions

- 最小尺度三项阈值（体重/体脂/腰围）的最终数值与平线偏移步长，apply 阶段结合真机观感定稿（先用 5/5/5 与 6px 默认）。

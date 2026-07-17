## Context

选模板页 `pages/workout/pick` 首进空白，返回重进才有。已确认三处根因：

- **空缓存直接渲染**：`pick.js` `onShow(){ render() }`，`render()` 读 `db.getCache(TEMPLATES)`（新用户为空）→ `templateGroups=[]`；`pick.wxml` 仅 `wx:for` 分组、无加载/空态 → 预设区整块空白。生命周期 `onLoad→onShow`，onLoad 在 `await ensureTemplatesSeeded()` 卡住时 onShow 已渲染空白。
- **首播种串行慢**：`db.ensureTemplatesSeeded` 的"云端为空"分支 `for (const tpl of PRESET_TEMPLATES) { await add() }` —— 8 条串行云写、数秒。
- **吞异常**：`pick.js onLoad` `try{ await ensureTemplatesSeeded() }catch(e){}`，播种抛错时无声，页面停在空白，返回重进才走"查云端"补齐。

约束（CLAUDE.md）：云读写只走 `utils/db.js`；不改 4 集合字段。

## Goals / Non-Goals

**Goals:**
- 首进不再空白：未就绪显示加载态，就绪即渲染，无需返回重进。
- 首播种明显提速（并发）。
- 播种失败可见可重试，不静默。

**Non-Goals:**
- 不改预设内容与集合结构。
- 不改选模板页的分组展示/色点/删除等既有交互。
- 不动问题二（已由迭代十六修复，另行发布验证）。

## Decisions

### D1：pick 页引入 loading / error 态，渲染时序收敛

`data` 加 `loading:true`、`loadError:false`。`onLoad` 走：置 `loading:true` → `await ensureTemplatesSeeded()` → 成功 `render()` 并 `loading:false`；失败置 `loadError:true, loading:false`。`onShow` 不再无条件用空缓存覆盖：仅当缓存已有数据时 `render()`，否则保持加载态（避免 onShow 抢在播种前渲染空白）。`pick.wxml` 按 `loading`/`loadError`/正常三态渲染（加载中提示 / 错误+「重试」/ 模板列表）。

- 否决"仅加空态文案不加载态"：新用户是"正在加载"而非"没有模板"，空态文案会误导。

### D2：首播种并发化

`ensureTemplatesSeeded` 的"云端为空"分支由串行 `for...await add()` 改为 `Promise.all(PRESET_TEMPLATES.map(tpl => add(...)))`，取回各自 `_id` 组装缓存。预设顺序由 `order` 字段决定、与写入先后无关，故并发安全。8 次往返 → 约 1 次往返时长。

### D3：播种错误不再静默，可上抛供页面处理

`pick.js onLoad` 去掉"吞错"：`ensureTemplatesSeeded` 失败时进入 `loadError` 态，页面给「重试」按钮（重新调用 onLoad 的加载流程）。`db` 层保持抛出真实错误，便于页面区分。

### D4（可选）：启动预热

`app.js onLaunch` 触发一次 `db.ensureTemplatesSeeded().catch(()=>{})` 预热；用户点「+」时预设多已就绪、加载态一闪而过甚至不出现。作为增强项，失败不影响主流程。

## Risks / Trade-offs

- **[并发写入部分失败]** `Promise.all` 任一失败即整体 reject → 缓解：进入可重试的 error 态；重试幂等（云端仍空则重播，非空则走已存在分支）。
- **[onShow 时序]** 调整 onShow 渲染条件需避免"播种完成后 onShow 不刷新" → 缓解：onLoad 成功后主动 `render()`；onShow 仅在缓存有数据时渲染，两者互补。

## Migration Plan

无数据迁移。部署即页面 + db 播种改动；回滚还原 `pick.*` 与 `ensureTemplatesSeeded` 的并发/错误处理。

## Open Questions

- D4 启动预热是否纳入本次（增强项，可留到后续）。

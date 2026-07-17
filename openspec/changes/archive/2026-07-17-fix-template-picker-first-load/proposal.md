## Why

新用户首次点「+」进入选模板页（`pages/workout/pick`）时看到**空白页**，返回再进才加载出模板。根因经排查确认在三处：① 页面从空缓存直接渲染、无加载态兜底（`onShow` 先用空数据 `render()`）；② 首次播种是 8 条预设**串行** `await add()`，数秒之久；③ `onLoad` 用 `try/catch(e){}` 吞掉播种异常，一旦中途失败就一直空白、只能靠返回重进从云端补齐。这让新用户第一屏体验像"坏了"。

## What Changes

- **选模板页加加载态**：数据未就绪时显示「加载中…」，不再渲染空白；播种/加载完成后再渲染模板列表。
- **首次播种并行化**：`db.ensureTemplatesSeeded` 的"云端为空"播种分支由串行 `await` 改为 `Promise.all` 并发写入，数秒 → 约一次往返。
- **不吞异常、可重试**：播种失败时选模板页显示错误态与「重试」入口（而非静默空白）；`onLoad` 不再无声吞错。
- **（可选）启动预热**：`app.js onLaunch` 预热 `ensureTemplatesSeeded`，用户点「+」前预设多已就绪。

## Capabilities

### New Capabilities
<!-- 无 -->

### Modified Capabilities
- `template-management`: 选模板页首次加载有加载态、播种并发提速、失败可重试，消除"首进空白、返回重进才有"的问题。

## Impact

- **改动**：`pages/workout/pick.js`（loading/error/retry 态、渲染时序）、`pick.wxml`/`pick.wxss`（加载态与重试 UI）、`utils/db.js`（`ensureTemplatesSeeded` 播种并发化、错误可上抛）。
- **（可选）**：`app.js`（onLaunch 预热播种）。
- **数据/集合**：不改集合字段；播种写入内容不变，仅改并发方式与错误处理；无迁移。
- **文档**：本次为体验/稳健性修复，`docs/usermanual.md` 无需改（无新面向用户功能）；如加"加载中"文案可斟酌是否入手册。

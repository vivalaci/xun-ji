## 1. 选模板页加载/错误态

- [x] 1.1 `pages/workout/pick.js`：`data` 加 `loading:true`、`loadError:false`；抽 `load()` 流程（置 loading → `await ensureTemplatesSeeded()` → 成功 `render()`+`loading:false`，失败 `loadError:true`+`loading:false`）
- [x] 1.2 `onLoad` 调 `load()`（不再吞错）；`onShow` 仅当 `db.getCache(TEMPLATES)` 非空时 `render()`，否则保持加载态
- [x] 1.3 `pick.wxml`：按 `loading`/`loadError`/正常三态渲染——加载中提示、错误+「重试」（bind `load`）、模板列表
- [x] 1.4 `pick.wxss`：加载/错误态样式

## 2. 首播种并发化与错误上抛

- [x] 2.1 `utils/db.js ensureTemplatesSeeded`「云端为空」分支：`for...await add` 改为 `Promise.all(PRESET_TEMPLATES.map(...add))`，用返回 `_id` 组装 `created` 并 `setCache`
- [x] 2.2 确认播种失败时错误如实抛出（不在 db 层静默），供页面进入 error 态
- [x] 2.3 校验并发写入后缓存按 `order` 呈现正确（顺序由 order 字段而非写入先后决定）

## 3. （可选）启动预热

- [x] 3.1 `app.js onLaunch`：`db.ensureTemplatesSeeded().catch(()=>{})` 预热，失败不影响主流程（本项可留后续，视范围决定）

## 4. 验证与收尾

- [x] 4.1 语法校验：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`
- [x] 4.2 算法单测：`node tests/algo.test.js` 全绿（本次无纯函数变更，确认未回归）
- [ ] 4.3 真机走查：**新账号**首次点「+」→ 显示加载态、秒级出模板、无需返回重进；断网/失败 → 错误态可重试
- [ ] 4.4 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 4.5 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

## 1. 曲线首页移除身体趋势（固定 4→3）

- [x] 1.1 `utils/curveConfig.js`：`FIXED_CHARTS` 删 `body`（剩 3 项），抽出 `BODY_SERIES` 导出供身体页用；`defaultPrefs` 随之 3 项
- [x] 1.2 `pages/curve/curve.js`：移除 `compute`/`draw` 的 `bodyCombined` 分支与 body 缓存；`goDetail` 去掉身体 Tab 分支（均为 lift）
- [x] 1.3 `pages/curve/curve.wxml`：移除身体趋势卡片（图例分支），单线卡片保留（`.legend` 样式留用于身体页同款，curve.wxss 未删无害）
- [x] 1.4 单测更新：composeCharts 默认 3 项、旧 `body` 键自愈剔除（tests/algo.test.js）；编辑模式/固定项保护按 FIXED_CHARTS 派生自然为 3 项（真机走查）

## 2. 身体页上方新增趋势图

- [x] 2.1 `pages/body/body.js`：新增 `computeTrend`（`curveConfig.BODY_SERIES` 三线、体重经 `unit.toDisplay`、按 range 过滤、图例 latest）+ `drawTrend`（`chart.drawMultiLine`，体重 minSpan 经 unit 换算）；`renderFromCache`/`refresh` 调用
- [x] 2.2 范围切换（默认 3M）`switchRange` → `computeTrend`；空数据走 drawMultiLine 占位
- [x] 2.3 `body.wxml`/`wxss`：顶部加范围栏 + 图例 + `#bodyTrend` canvas（无标题，`records>0` 才显示），下接列表；`createSelectorQuery().in(this)` 绘制
- [x] 2.4 真机走查：身体页三线图、范围切换、图例最新值、缺值断线、平线错位+最小尺度；列表分页不受影响

## 3. 用户手册同步 + 参考资料

- [x] 3.1 `docs/usermanual.md`：§二去身体趋势；§五加「页面上方为身体趋势图（可切范围）」
- [x] 3.2 `docs/usermanual.md`：末尾新增「十一、参考资料」节（docs/09 四条文献 + 链接 + 循证说明）
- [x] 3.3 `config/manual.js`：同步首页/身体页文案 + 新增「十一、参考资料」末节（`li` 要点，链接文本呈现）
- [x] 3.4 `pages/manual/manual.*`：新增末节复用既有 `li`/`p` 渲染（已有 `.li-text` flex:1 换行，长链接不溢出）

## 4. 验证与收尾

- [ ] 4.1 语法校验：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`
- [ ] 4.2 算法单测：`node tests/algo.test.js` 全绿（缩放纯函数已有测，确认未回归）
- [ ] 4.3 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 4.4 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

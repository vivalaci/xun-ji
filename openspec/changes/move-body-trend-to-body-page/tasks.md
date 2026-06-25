## 1. 曲线首页移除身体趋势（固定 4→3）

- [ ] 1.1 `utils/curveConfig.js`：从 `FIXED_CHARTS` 删除 `body`（bodyCombined）项；确认 `defaultPrefs` 随之为卧推/深蹲/硬拉 3 项
- [ ] 1.2 `pages/curve/curve.js`：移除 `compute`/`draw`/`_series` 中 `bodyCombined` 分支与相关图例构建；`goDetail` 去掉跳身体 Tab 的 body 分支
- [ ] 1.3 `pages/curve/curve.wxml`/`wxss`：移除身体趋势卡片（图例 + canvas）相关模板与样式
- [ ] 1.4 走查：首次无配置显示 3 项；存量 `curveOrder` 含 `body` 时被自愈剔除、渲染正常；编辑模式排序/固定项保护正常

## 2. 身体页上方新增趋势图

- [ ] 2.1 `pages/body/body.js`：新增趋势 compute（三 series：体重经 `unit.toDisplay`、体脂、腰围；按 range 过滤、独立缩放、图例取各自 latest）与 `chart.drawMultiLine` 调用（复用首页 bodyCombined 口径）
- [ ] 2.2 范围切换（1M/3M/6M/ALL，默认 3M）：切换重算并重绘；空数据走 `drawMultiLine` 既有占位
- [ ] 2.3 `pages/body/body.wxml`/`wxss`：顶部加 范围切换栏 + 图例 + canvas（**不加「身体趋势」标题**），下接既有列表；canvas 用 `createSelectorQuery().in(this)` 绘制
- [ ] 2.4 走查：身体页顶部三线图正确、随范围切换、图例最新值、缺值断线、平线错位 + 最小尺度生效；列表分页不受影响

## 3. 用户手册同步 + 参考资料

- [ ] 3.1 `docs/usermanual.md`：§二首页去掉「身体趋势」描述；§五身体数据补充「页面上方为身体趋势图（体重/体脂/腰围，可切范围）」
- [ ] 3.2 `docs/usermanual.md`：末尾新增「参考资料」节，照搬 `docs/09` 参考文献 4 条（PubMed 2025 剂量反应、PubMed 2019 频率、SportRxiv 预印本、RP Strength 容量地标），每条一句中文简述 + 链接，说明为训练计划/分组设计的循证依据
- [ ] 3.3 `config/manual.js`：与 `docs/usermanual.md` 同步——首页/身体页文案对齐，新增「参考资料」末节（`li` 要点，链接以文本呈现）
- [ ] 3.4 `pages/manual/manual.*`：确认新增末节按既有 `li` 渲染正常（如链接文本过长不溢出）

## 4. 验证与收尾

- [ ] 4.1 语法校验：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`
- [ ] 4.2 算法单测：`node tests/algo.test.js` 全绿（缩放纯函数已有测，确认未回归）
- [ ] 4.3 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 4.4 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

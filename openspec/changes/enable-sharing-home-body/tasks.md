## 1. 首页开放转发分享

- [x] 1.1 `pages/curve/curve.js`：加 `onShareAppMessage`（title + `path:'/pages/curve/curve'` + `imageUrl:'/assets/share/cover-5x4.png'`）与 `onShareTimeline`（title + `imageUrl:'/assets/share/cover-1x1.png'`）
- [x] 1.2 `pages/curve/curve.js` 的 `onShow`：调 `wx.showShareMenu({ menus:['shareAppMessage','shareTimeline'] })`

## 2. 身体页开放转发分享

- [x] 2.1 `pages/body/body.js`：加 `onShareAppMessage`（title + `path:'/pages/body/body'` + `imageUrl:'/assets/share/cover-5x4.png'`）与 `onShareTimeline`（title + `imageUrl:'/assets/share/cover-1x1.png'`）
- [x] 2.2 `pages/body/body.js` 的 `onShow`：调 `wx.showShareMenu({ menus:['shareAppMessage','shareTimeline'] })`

## 3. 分享封面素材

- [x] 3.1 已产出中性品牌分享图（无个人数据）：`assets/share/cover-5x4.png`（1250×1000，转发用）+ `assets/share/cover-1x1.png`（1080×1080，朋友圈用）。白底 + 上升趋势折线 + 「训记」+ 标语「记录你的训练进步」，配色用品牌 `#1D4ED8`/三大项色
- [x] 3.2 已确认 `project.config.json` 仅排除 `assets/exercise-media`、`assets/pose-ref`，`assets/share` 会正常打包

## 4. 验证与收尾

- [x] 4.1 语法校验：`Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }`
- [ ] 4.2 真机走查：首页/身体页「···」菜单转发与朋友圈均可用、落点正确、封面为品牌图；训练/我的页仍不可转发
- [x] 4.3 同步 `docs/usermanual.md` + `config/manual.js`：说明首页/身体页可转发分享
- [x] 4.4 更新 `README.md` 进度区 + `docs/00-overview.md` 阶段表
- [ ] 4.5 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

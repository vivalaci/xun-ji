# Tasks: in-app-usermanual

## 1. 内容数据（config/manual.js）

- [x] 1.1 把 docs/usermanual.md 固化为结构化数据：`{ intro, sections:[{title, blocks}] }`，block.type ∈ {p, li, qa}
- [x] 1.2 文件头注明与 docs/usermanual.md 同源，面向用户改动两处一起更新
- [x] 1.3 与用户精简版 docs/usermanual.md 对齐（10 节、3 问 FAQ、单一单位节）

## 2. 说明页（pages/manual/）

- [x] 2.1 `manual.js`：require config/manual.js，渲染 intro + sections
- [x] 2.2 `manual.wxml`：按 block.type 分支渲染（p 段落 / li 要点带项目符号 / qa 问答）
- [x] 2.3 `manual.wxss`：复用全局 token，节标题/要点/问答层级清晰
- [x] 2.4 `manual.json`：导航标题「使用说明」

## 3. 入口接入

- [x] 3.1 `app.json` 注册 `pages/manual/manual`
- [x] 3.2 `pages/profile/profile.wxml`：设置与关于之间加「使用说明 ›」
- [x] 3.3 `pages/profile/profile.js`：`goManual` → `wx.navigateTo`

## 4. 验证

- [x] 4.1 `node --check` 全部 js + `node tests/algo.test.js` 全绿
- [x] 4.2 manual 结构校验：节数、所有 block.type 合法
- [x] 4.3 模拟器/真机走查：我的 → 使用说明，入口位置正确、各节排版正常、返回正常

## 5. 文档

- [x] 5.1 docs/usermanual.md 与 config/manual.js 保持同源（本迭代已对齐）
- [x] 5.2 README 进度 + docs/00 阶段表（归档时）

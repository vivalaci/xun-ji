## Why

`docs/usermanual.md` 是给用户看的手册，但它只活在仓库里——真实用户在小程序里无处可读。用户需要在 App 内就能查到"怎么用"，尤其是首次上手、单位切换、PR、数据同步等高频疑问。于是把用户手册搬进 App，作为「我的」页的一个使用说明入口。

## What Changes

- **「我的」页新增「使用说明」入口**：位于「设置」与「关于训记」之间，点击进入独立的使用说明页（`pages/manual/manual`）。
- **使用说明页**按节展示手册内容：整体结构、首页、记录力量/有氧、身体数据、模板管理、动作库、单位设置、PR、常见问题。支持段落 / 要点 / 问答三种排版块。
- **内容与 `docs/usermanual.md` 同源**：小程序运行时读不了 `.md`，故把手册内容固化为结构化数据 `config/manual.js`；页面只做渲染。两处约定同源——面向用户的功能/页面/交互改动后，`docs/usermanual.md` 与 `config/manual.js` 一起更新（已在文件头注明）。

## Capabilities

### New Capabilities
- `in-app-usermanual`: 应用内使用说明——「我的」页入口 + 独立说明页，按节渲染手册内容，内容源 `config/manual.js` 与 `docs/usermanual.md` 同源。

### Modified Capabilities
<!-- 无 -->

## Impact

- 代码（新增）：`config/manual.js`（手册结构化内容）、`pages/manual/manual.{js,wxml,wxss,json}`（说明页）。
- 代码（改）：`app.json`（注册 `pages/manual/manual`）、`pages/profile/profile.{wxml,js}`（设置下方加入口 + `goManual`）。
- 文档：`docs/usermanual.md`（用户已更新到精简版，`config/manual.js` 同步对齐）。
- 数据：无。纯展示页，不读写任何集合、不依赖新字段。
- 兼容：纯新增页面 + 一个菜单项，无迁移。

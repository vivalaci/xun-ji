## Context

`docs/usermanual.md` 已存在且随版本更新（发版必需，见 docs/07）。本变更把它呈现到 App 内。约束：小程序无构建、无第三方库，运行时不能读取仓库里的 `.md`（不进可读包，且无 Markdown 渲染器）。

## Decisions

### D1：内容固化为 `config/manual.js`，与 docs/usermanual.md 同源
小程序读不了 `.md`，故把手册内容抽成结构化数据模块 `config/manual.js`（`{ intro, sections:[{title, blocks:[{type,...}]}] }`）。页面 `require` 它并渲染。
- **同源约定**：`config/manual.js` 文件头注明"与 docs/usermanual.md 同源"，面向用户改动两处一起更新。
- **被否**：① 运行时拉取远程 Markdown——增加网络依赖与失败态，手册是静态内容不值当。② 用 `rich-text` 渲染 Markdown 字符串——需自带解析器（无第三方库约束）或手写，复杂度高于结构化数据直渲。

### D2：三种内容块 `p / li / qa`，覆盖手册全部排版
手册由段落、要点列表、问答三类构成。`block.type` 取 `'p'`（段落）/`'li'`（要点，带项目符号）/`'qa'`（问答，含 `q`/`a`）。WXML 用 `wx:if/elif` 分支渲染，样式复用全局 token（`--text`/`--muted`/`--accent`）。不支持行内强调（Markdown `**` 不渲染），靠分块与字号建立层级。

### D3：入口位置——设置与关于之间
「我的」页菜单顺序：训练模板管理 / 动作库 / 设置 / **使用说明** / 关于训记。放设置下方符合用户指定，且"使用说明"与"关于训记"同属信息类，相邻自然。`wx.navigateTo` 跳转（非 tab，可返回）。

## Risks / Trade-offs

- **双份维护**：手册内容在 `docs/usermanual.md` 与 `config/manual.js` 各存一份，存在不同步风险。缓解：文件头同源注明 + 发版流程已把手册更新列为必需（docs/07 §六）。后续若手册频繁变动，可考虑构建期从 md 生成 js，但当前无构建步骤、不引入。
- 纯展示页，无数据、无迁移、无弱网影响。

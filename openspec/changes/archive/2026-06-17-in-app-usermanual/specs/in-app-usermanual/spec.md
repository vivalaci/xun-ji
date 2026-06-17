# in-app-usermanual Delta

## ADDED Requirements

### Requirement: 使用说明入口
「我的」页 SHALL 在「设置」与「关于训记」之间提供「使用说明」入口；点击 SHALL 经 `wx.navigateTo` 进入独立的使用说明页（`pages/manual/manual`），可返回。

#### Scenario: 入口位置
- **WHEN** 用户进入「我的」页
- **THEN** 菜单依次为 训练模板管理 / 动作库 / 设置 / 使用说明 / 关于训记，「使用说明」位于设置下方

#### Scenario: 进入说明页
- **WHEN** 用户点击「使用说明」
- **THEN** 打开使用说明页（导航标题「使用说明」），可通过返回回到「我的」

### Requirement: 使用说明内容呈现
使用说明页 SHALL 按节展示用户手册内容，每节含标题与若干内容块；内容块 SHALL 支持段落（`p`）、要点（`li`，带项目符号）、问答（`qa`，含问与答）三种类型。页面 SHALL 仅做渲染，不读写任何云集合。

#### Scenario: 分节渲染
- **WHEN** 用户在使用说明页浏览
- **THEN** 页面顶部显示一句简介，随后按节（整体结构、首页、记录力量/有氧训练、身体数据、模板管理、动作库、单位设置、PR、常见问题）展示标题与内容

#### Scenario: 内容块按类型呈现
- **WHEN** 某节含段落、要点、问答
- **THEN** 段落以正文展示，要点带项目符号，问答以「Q：…」加答案展示

### Requirement: 说明内容与用户手册同源
应用内使用说明的内容 SHALL 来源于结构化数据模块 `config/manual.js`，且 SHALL 与 `docs/usermanual.md` 同源——凡面向用户的功能/页面/交互改动，两处 MUST 一起更新。

#### Scenario: 同源更新
- **WHEN** 面向用户的功能/页面/交互发生改动并更新了 `docs/usermanual.md`
- **THEN** `config/manual.js` 同步对齐，使应用内说明与文档手册内容一致

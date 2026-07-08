## Context

微信小程序转发/分享是**页面级**能力，`App()` 不支持全局配置：页面定义 `onShareAppMessage()` 才点亮「转发」，定义 `onShareTimeline()` 才点亮「分享到朋友圈」。当前全项目零定义，故所有页面不可转发。本次只给首页（`pages/curve/curve`）与身体页（`pages/body/body`）开放。

约束（CLAUDE.md）：面向用户改动同步 `docs/usermanual.md` + `config/manual.js`（同源）；不涉及云数据（转发只发卡片，纯客户端）。

## Goals / Non-Goals

**Goals:**
- 首页、身体页可转发好友/群 + 分享朋友圈，入口在「···」菜单点亮。
- 分享缩略图不带用户个人数据数字。

**Non-Goals:**
- 不开放其它页面的转发。
- 不做带参数的分享落地（如分享具体某条记录）——本次仅落到页面本身。
- 不引入转发统计/裂变逻辑。

## Decisions

### D1：两页各自定义 `onShareAppMessage` + `onShareTimeline` + `onShow` 内 `showShareMenu`

每页加：
```js
onShareAppMessage() {
  return { title: '<页面文案>', path: '<页面路径>', imageUrl: '<品牌图>' };
},
onShareTimeline() {
  return { title: '<页面文案>', imageUrl: '<品牌图>' };
}
```
并在 `onShow` 调 `wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })` 确保朋友圈项出现在「···」菜单。文案：首页「训记 · 记录你的训练进步」，身体页「训记 · 看见身体的变化」（可调）。

- 否决"只加 `onShareAppMessage`"：那样朋友圈不可用，用户要的是"转发分享"两者。

### D2：分享封面用固定品牌图，不用页面截图

`imageUrl` 指向静态素材。微信两种分享封面比例不同：好友转发（`onShareAppMessage`）推荐 **5:4**，朋友圈（`onShareTimeline`）推荐 **1:1**，故各出一张：`assets/share/cover-5x4.png`、`assets/share/cover-1x1.png`。原因：不传 `imageUrl` 时微信用**当前页面截图**做封面，身体页截图会把体重/体脂数字带进缩略图，泄露个人数据。用中性品牌图规避。

- **素材已产出**：白底 + 上升趋势折线 motif（收尾落绿色进步点）+「训记」+ 标语，配色用品牌 `#1D4ED8` 与三大项色；无任何个人数据。两页 `onShareAppMessage.imageUrl` 用 5:4、`onShareTimeline.imageUrl` 用 1:1。

### D3：只落到页面、不带业务参数

`path` 仅为页面路径，不带 query。接收方打开是其本人账号的对应页面（新用户为空态）。无需处理分享参数解析，零隐私外泄。

## Risks / Trade-offs

- **[朋友圈分享基础库/机型限制]** `onShareTimeline` 需较新基础库，老版本不显示朋友圈项 → 缓解：好友转发仍可用；属微信平台限制，不额外处理。
- **[身体页截图泄露]** 若临时未配 `imageUrl`，身体页截图含个人数字 → 缓解：D2 建议身体页优先补品牌图；tasks 明确该项。

## Migration Plan

无数据迁移。部署即页面方法 + 素材 + 文档改动；回滚删除两页的 share 方法与素材引用。

## Open Questions

- 品牌图素材已产出（5:4 + 1:1）；分享**文案**暂用「训记 · 记录你的训练进步」，可按最终视觉/运营口径调整。

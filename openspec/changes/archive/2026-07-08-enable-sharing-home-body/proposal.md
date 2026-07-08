## Why

小程序转发默认关闭——页面不定义 `onShareAppMessage`（好友/群转发）与 `onShareTimeline`（朋友圈）时，「···」菜单里的转发/分享是灰的。当前全项目无任何页面定义这两个方法，所以所有页面都不可转发分享。需要至少让**首页**和**身体页**可以转发给好友/群并分享到朋友圈，方便用户拉人使用。

## What Changes

- **首页（`pages/curve/curve`）开放转发分享**：定义 `onShareAppMessage`（转发到好友/群）与 `onShareTimeline`（分享到朋友圈），并在页面 `onShow` 调 `wx.showShareMenu` 点亮两项入口。转发落点 `/pages/curve/curve`。
- **身体页（`pages/body/body`）开放转发分享**：同上，落点 `/pages/body/body`。
- **分享卡片图用固定品牌图、不用页面截图**：避免自动截图把用户体重/体脂等个人数字带进分享缩略图（尤其身体页）。为两页各配置 `imageUrl` 指向一张中性品牌图。
- **其它页面维持不可转发**（本次只开这两页）。

## Capabilities

### New Capabilities
- `page-sharing`: 指定页面（首页、身体页）可转发给好友/群、分享到朋友圈；分享卡片使用固定品牌图而非页面截图，不泄露个人数据。

### Modified Capabilities
<!-- 无 -->

## Impact

- **改动**：`pages/curve/curve.js`、`pages/body/body.js`（各加 `onShareAppMessage`/`onShareTimeline` + `onShow` 内 `wx.showShareMenu`）。
- **素材**：已产出两张中性品牌图（无个人数据）——`assets/share/cover-5x4.png`（转发 5:4）+ `assets/share/cover-1x1.png`（朋友圈 1:1）；两页 `imageUrl` 分别引用。
- **文档**：`docs/usermanual.md` + `config/manual.js` 同步说明"首页/身体页可转发分享"。
- **数据/集合**：不涉及云数据读写；转发仅发送小程序卡片，接收方打开看到的是其本人数据，无隐私外泄。

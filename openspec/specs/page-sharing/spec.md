# page-sharing

## Purpose

指定页面（首页、身体页）可转发给微信好友/群、分享到朋友圈；分享卡片使用固定品牌图而非页面截图，不泄露用户个人数据。

## Requirements

### Requirement: 首页与身体页可转发分享

首页（`pages/curve/curve`）与身体页（`pages/body/body`）SHALL 支持转发给微信好友/群（`onShareAppMessage`）与分享到朋友圈（`onShareTimeline`）。两页 SHALL 在展示时经 `wx.showShareMenu` 点亮转发与朋友圈两项入口，使「···」菜单中的转发/分享可用。转发落点 SHALL 分别为各自页面路径（`/pages/curve/curve`、`/pages/body/body`）。其余页面 SHALL 维持默认不可转发。

#### Scenario: 首页可转发

- **WHEN** 用户在首页打开「···」菜单
- **THEN** 「转发」与「分享到朋友圈」可用；转发后接收方点开落到首页

#### Scenario: 身体页可转发

- **WHEN** 用户在身体页打开「···」菜单
- **THEN** 「转发」与「分享到朋友圈」可用；转发后接收方点开落到身体页

#### Scenario: 其它页面不可转发

- **WHEN** 用户在未开放的页面（如训练列表、我的）打开「···」菜单
- **THEN** 转发/分享维持灰置不可用

### Requirement: 分享卡片不泄露个人数据

转发/分享卡片 SHALL 使用固定品牌图作为封面（`imageUrl` 指向静态素材），SHALL NOT 使用会包含用户体重/体脂等个人数字的页面自动截图。卡片标题 SHALL 为中性的应用介绍文案。

#### Scenario: 卡片用品牌图

- **WHEN** 用户从身体页转发
- **THEN** 分享卡片封面为固定品牌图，不含该用户的身体数据数字

# Design: custom-curves

## Context

曲线首页的 5 条曲线定义是页面内硬编码常量 `CHARTS`，`compute/draw/goDetail` 已按 `key` 泛化。动作详情页支持任意 `exerciseId`；`utils/exerciseLib.js` 提供内置 + 自建动作合并查询（含已删动作占位回退）。数据访问层 `utils/db.js` 提供缓存优先读 + 本地先写队列，对任意集合通用。现有 4 集合不可改既有字段；kg/lb 设置目前存本地（不在本次范围）。

## Goals / Non-Goals

**Goals:**
- 曲线顺序可调、可加 ≤2 条自定义动作曲线、可删自定义曲线。
- 配置云端持久化（跨设备）+ 本地缓存（离线），复用既有 db 管线。
- 全 App 口径统一：自定义曲线同用主力工作组重量。

**Non-Goals:**
- 不做拖动手势排序（用上移/下移箭头）。
- 不允许删除/隐藏固定 5 条。
- 不让用户选色。
- 不把 kg/lb 设置迁入 `user_prefs`（留待后续）。

## Decisions

### D1：配置文档形态——`user_prefs` 单文档，存"完整顺序 + 自定义列表"
```js
// 集合 user_prefs（每用户一条，权限：仅创建者可读写）
{
  _id, _openid,
  curveOrder: ['bench','squat','deadlift','weight','bodyFat','ex_lat_pulldown'], // 全量 key 顺序
  customCurves: [ { key: 'ex_lat_pulldown', exerciseId: 'lat_pulldown', slot: 0 } ],
  createTime
}
```
- 固定曲线 key 沿用现有（`bench/squat/deadlift/weight/bodyFat`）；自定义 key = `'ex_' + exerciseId`，天然防重复。
- **被否方案**：只存自定义列表、顺序另存增量 —— 合成逻辑复杂；全量顺序数组简单直观，5+2 规模无性能顾虑。

### D2：渲染 = 纯函数合成 `composeCharts(prefs)`，对缺省/脏数据自愈
新增 `utils/curveConfig.js`（纯函数，node 可测）：
- 无配置/字段缺失 → 返回默认 5 条（现状不变）。
- `curveOrder` 缺少某固定 key → 追加到末尾；含未知 key（如自定义曲线已删）→ 剔除。
- 自定义条目 `exerciseId` 查不到名（自建动作被删）→ 仍渲染，标题经 `exerciseLib.getName` 回退占位名。
- **被否方案**：在页面里就地 if/else 修补 —— 不可单测，违背"纯函数逻辑进 tests"的项目规范。

### D3：`user_prefs` 读写走既有管线，新增薄封装 `db.ensurePrefs()/updatePrefs(patch)`
- 读：缓存优先（列表取第一条），后台 `refresh`；云端无文档时经 `saveLocalFirst` 创建默认文档（弱网下也立即可用）。
- 写：`updateLocalFirst`（或对未同步文档改队列内 add 数据，机制已有）。
- **被否方案**：新写一套单文档专用存取 —— 重复造轮子；现有队列机制已处理离线、临时 id 替换。

### D4：配色按"槽位"而非按动作
调色板 `['#D97706'（琥珀）, '#DB2777'（玫红）]`，`customCurves[].slot ∈ {0,1}`。添加时取最小空闲槽位，删除释放槽位——新曲线复用空出的颜色，保证同屏永不撞色，且与固定 5 色（蓝/紫/青/近黑/灰）可区分。
- **被否方案**：按 exerciseId 哈希取色 —— 可能与固定色或另一条自定义撞色。

### D5：编辑模式是页面内状态，不是新页面
`editing: true` 时整页切换为紧凑行列表（无 canvas），↑/↓ 交换 `curveOrder` 相邻项，⊝ 仅出现在自定义行；「完成」时一次性 `updatePrefs` 持久化并重新 compute/draw。
- 排序过程只改内存中的顺序数组，避免每次点击都写存储。
- 退出编辑的唯一出口是「完成」（无"取消/还原"，符合极简哲学；误操作可再调回来）。
- **被否方案**：独立"曲线管理"页 —— 多一跳，长按直达更顺手。

### D6：添加曲线面板复用动作选择 UI 模式
面板用 `exerciseLib.byCategory()` 渲染（与训练编辑页同款左右分栏），但**不含**"自定义动作输入"行（加曲线 ≠ 建动作）。已展示动作（三大项 + 已添加自定义）在面板中置灰禁选。体重/体脂非动作，不出现在面板。

## Risks / Trade-offs

- [canvas 数量增至最多 7 个] 同屏 Canvas 2D 实例增多，低端机渲染压力 → 上限 2 条自定义已是缓解；compute 仍是单次遍历，无额外查询。
- [user_prefs 集合未创建] 用户忘建集合 → 云端写入报错但本地先写已生效，队列持续重试；README/验证清单明确提示建集合。
- [多设备并发改配置] 单文档两端同时改，后写覆盖先写 → 单人 App 可接受（与全局"不做冲突合并"决策一致）。
- [编辑模式无取消] 误排序需手动调回 → 操作可逆且低频，换取交互极简。

## Migration Plan

1. 用户在云控制台新建集合 `user_prefs`（仅创建者可读写）。
2. 代码发布后首次进入曲线页：无配置 → 默认 5 条（零行为变化）；首次"完成编辑"或"添加曲线"时才创建配置文档。
3. 回滚：旧版本代码不读 `user_prefs`，固定 5 条照常工作，无数据回滚需求。

## Open Questions

（无）

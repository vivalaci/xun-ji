# 阶段六：技术方案

## 一、数据模型

### 集合一：`workouts`（训练记录）

```js
{
  _id:        "自动生成",
  _openid:    "云开发自动注入，用于数据隔离",
  date:       "2026-06-06",         // 字符串，便于排序和范围查询
  type:       "strength",           // 'strength'|'cardio'，缺省/旧记录=strength（change cardio-tracking）
  templateId: "tpl_xxx 或 null",    // 关联训练模板，用于"复用同类训练"
  name:       "推日",                // 训练名称（默认取模板名）
  exercises: [
    {
      exerciseId: "bench",          // 稳定身份，曲线按它聚合（关键）
      name: "卧推",                  // 冗余存名，方便展示
      sets: [
        { weight: 50,   reps: 5 },
        { weight: 50,   reps: 5 },
        { weight: 52.5, reps: 4 }
      ]
    }
    // ... 其余动作
  ],
  note:       "",                   // 可选备注
  createTime: "服务端时间戳"
}

// type:'cardio' 时，exercises 项形如（无 sets）：
//   { exerciseId:"run_outdoor", name:"室外跑步", duration:30, distance:5 }   // 距离类：时长 min + 距离 km
//   { exerciseId:"stairs",      name:"爬楼梯",   duration:15, floors:60 }    // 爬楼梯：时长 min + 层数
// 有氧项无 sets，故 PR/容量/三大项曲线天然跳过，不污染力量统计。
```

### 集合二：`body_records`（身体数据）

```js
{
  _id:        "自动生成",
  _openid:    "云开发自动注入",
  date:       "2026-06-06",
  weight:     70.5,    // 必填，kg（统一以 kg 落库，见第七节）
  bodyFat:    15.2,    // 可选，%
  waist:      80,      // 可选，cm（不经单位换算；体脂的低成本代理指标）
  createTime: "服务端时间戳"
}
```

### 集合三：`workout_templates`（训练模板）

```js
{
  _id:        "tpl_xxx",
  _openid:    "云开发自动注入",
  name:       "推日",               // 可编辑
  order:      0,                    // 排序
  exercises: [                      // 模板的默认动作清单
    { exerciseId: "bench", name: "卧推" },
    { exerciseId: "ohp",   name: "肩上推举" }
  ],
  createTime: "服务端时间戳"
}
```

首次启动时为用户写入 3 套预设模板（推/拉/腿）。

### 动作库（`exercises`）

```js
// 内置动作：静态配置文件，随代码发布，含稳定 id
[
  { id: "bench",    name: "卧推", category: "胸", isMainLift: true },
  { id: "squat",    name: "深蹲", category: "腿", isMainLift: true },
  { id: "deadlift", name: "硬拉", category: "背", isMainLift: true },
  { id: "ohp",      name: "肩上推举", category: "肩" }
  // ... 其余常见动作
]

// 用户自定义动作：集合 custom_exercises
{ _id, _openid, id: "cus_xxx", name: "自定义动作", category, createTime }
```

- **三大项**（bench / squat / deadlift）标记 `isMainLift`，与首页曲线绑定。
- 训练记录里存 `exerciseId`，曲线按 id 聚合，**不靠动作名字符串匹配**。

---

## 二、核心查询模式

| 功能 | 查询方式 | 说明 |
|------|---------|------|
| 训练列表 | `orderBy('date','desc').limit(100)` | 按日期倒序 |
| 上次训练（预填） | `orderBy('date','desc').limit(1)` | 取最近一条 |
| 三大项曲线 | 拉取近 N 个月全部训练，前端提取最大重量 | 见下方 |
| 身体数据趋势 | `orderBy('date','desc').limit(100)` | 前端绘制 |
| PR 检测 | 保存时前端对比历史最大值 | 不需要额外查询 |

### 曲线数据计算逻辑（前端）

```
拉取近 N 个月 workouts
  → 遍历每条训练
    → 找出 exerciseId === 目标动作 id（如 "bench"）的 exercise
    → 计算该次的【主力工作组重量】：
        · 按 weight 分组，统计每个重量出现的组数
        · 取组数最多的那个重量
        · 若并列，取较重的一个
    → 以 date 为 X 轴、主力工作组重量为 Y 轴，输出数据点
  → 深蹲 / 硬拉同理
```

示例：某日卧推 50×5 / 50×5 / 52.5×4 → 50 出现 2 组、52.5 出现 1 组 → 取 **50**。

数据量估算：每周 4 次 × 3 个月 ≈ 50 条，前端处理无压力。

---

## 三、职责划分

| 操作 | 位置 | 原因 |
|------|------|------|
| 增删改查训练/身体记录 | 前端直连数据库 | 逻辑简单 |
| 曲线数据计算 | 前端 | 数据量小，避免云函数冷启动 |
| PR 检测 | 前端 | 保存时实时对比 |
| 用户身份 | 云开发自动（_openid） | 无需手写 |
| 云函数 | 暂不需要 | 后续有复杂统计再加 |

---

## 四、数据库安全规则

三个用户数据集合（workouts / body_records / workout_templates / custom_exercises）均设「**仅创建者可读写**」：
- 每个用户只能读写自己的数据
- _openid 由云开发自动注入和匹配
- 无需任何手写登录逻辑

---

## 五、本地缓存策略

「缓存优先，后台更新」模式，确保曲线页秒开：

```
打开页面
  → 立即读取 Storage 缓存，先渲染
  → 异步请求云数据库
  → 新数据返回后更新视图 + 刷新缓存
```

| 缓存 Key | 内容 | 有效期 |
|---------|------|-------|
| `cache_workouts` | 全部训练记录 | 5 分钟 |
| `cache_body` | 全部身体数据 | 5 分钟 |
| `cache_templates` | 训练模板 | 长期（变更时刷新） |

### 全量分页拉取（绕过客户端 100 上限，见 change data-pagination）

微信小程序客户端 `collection.get()` 单次最多返回 100 条。`db.refresh` 循环 `skip/limit(100)` 累积全量后再写缓存，确保曲线/PR/日历/统计在记录 >100 后仍基于完整历史；设安全上限 `MAX_RECORDS=5000`。配合缓存优先：先用缓存秒开，后台分页拉全量更新。

列表页（训练/身体）则用 `visibleCount` 前端切片增量渲染（默认 30，上拉 +30），避免长列表一次性渲染；不增加查询。

---

## 六、弱网保存（#4，方案：轻量版）

### 背景澄清（微信小程序离线能力）

| 能力 | 支持情况 |
|------|---------|
| 代码包加载 | 微信本地缓存，回头客断网也能打开壳子（仅"首次安装即无网"打不开） |
| 本地存储 `wx.Storage` | ✅ 完全离线可用，单用户 10MB |
| 云数据库 | ❌ 必须联网，**无官方离线同步**，重试需自行实现 |

弱网真正的痛点不是"长时间无网"，而是"信号断续导致写入超时丢数据"。单人 App 无多设备冲突，故只做轻量兜底，不做完整同步引擎。

### 轻量版实现（MVP 即做）

**读：缓存优先**
```
打开页面 → 立即渲染 Storage 缓存 → 异步拉云端 → 回来后更新视图+刷新缓存
```

**写：本地先落 + 失败重试**
```
保存 → 写入 Storage 的 pending_writes 队列，UI 立即反馈"已保存"
     → 异步推云数据库
         ├─ 成功：出队
         └─ 失败：留队列，下次启动 / 联网 / 进列表页时重试
```

**不做**：多设备冲突合并、复杂同步状态机（非单人场景需求）。

---

## 七、单位策略（#5，MVP 只做 kg）

- **数据库统一以 kg 落库**：**kg 录入存完整精度、不提前 round**；**lb 录入换算落库取整到 0.5kg**（lb 本是近似量，唯一例外，见 change `record-and-deadlift-fixes`）。
- **训练组重量的显示统一量化到 0.5kg**（`unit.toDisplayWeight`，只现整数或 .5，覆盖历史脏值）；体重等身体数据用 `unit.toDisplay` 保留 0.1 精度。
- 曲线等计算始终基于 kg；单位切换（kg 起点）不影响曲线一致性。
- **MVP 只支持 kg**（国内进阶训练者通用），但代码层预留换算入口，迭代二加 lb 不返工：

```
迭代二加 lb 时的换算（仅发生在录入/显示边界）：
  录入 lb：步进 ±5 lb；保存 = lb × 0.453592 → kg，再取整到 0.5kg（roundHalfKg）
  显示：训练组重量量化到 0.5（toDisplayWeight）；体重等保留 0.1（toDisplay）
  kg 录入：步进 ±2.5 kg，直接存
```

**预留做法**：读写统一经过一个 `unit.js` 转换层（MVP 内为恒等函数 kg↔kg），迭代二只改这一层。

### 主单位 vs 本次输入单位（change per-entry-input-unit）

两条不同的轴，均经 `unit.js`，存储恒 kg：

- **主单位**（「我的-设置」，`currentUnit`）：决定全 App 显示 + 录入默认单位。kg/lb 主用户对称（lb 主用户全程见 lb）。`toStore/toDisplay/step` 按主单位。
- **本次输入单位**（训练录入页会话级段控）：临时覆盖某次录入的输入单位，默认=主单位。经显式换算族 `toStoreFrom(v,srcUnit)`/`toDisplayIn(kg,dstUnit)`/`stepFor(unit)`；切换时就地重表达已显示值。**纯输入便利**，不持久化原单位，保存后按主单位显示。

---

## 八、技术选型汇总

| 项目 | 选型 |
|------|------|
| 框架 | 微信原生小程序 |
| 后端 | 微信云开发（云数据库直连） |
| 云函数 | 暂无 |
| 图表 | Canvas 2D（原生，无第三方库） |
| 本地缓存 | wx.Storage（含弱网写入队列） |
| 集合数量 | 4（workouts / body_records / workout_templates / custom_exercises） |
| 单位 | 统一存 kg，MVP 只支持 kg |

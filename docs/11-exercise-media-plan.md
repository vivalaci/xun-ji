# 11 · 动作示意图方案 & 映射表

> **用途**：动作示意图的素材来源与 id→素材映射（方案期设计档）。
> **状态**：**已接入（迭代二十 `exercise-media-instructions`）**。下文「二、技术决策」「五、动态化实现」为方案期设想，**最终实现以该 change 的 design.md 为准**：按路径约定 + 前缀常量取图（不给动作加 fileID 字段）；列表静态缩略图 + 详情页/放大层三层叠放 CSS 循环（不用 setInterval 换 src）；PNG 由 `tools/media/build.js` 从 SVG 生成（PNG 不进 git）；署名放使用说明「致谢」并注明已重新着色。
> **最后更新**：2026-09-14

---

## 一、素材来源决策

**选定 [bryllim/workout-guide](https://github.com/bryllim/workout-guide)（素材 CC BY-SA 4.0，基于 Everkinetic；代码 MIT）**

| 维度 | 结论 |
|--|--|
| 风格 | 矢量线稿（Everkinetic 同源），统一、专业、可无损缩放 |
| 数量 | 302 个动作，每个 **3 帧 SVG（512×512 透明底）** |
| 覆盖 | 我们 **100 / 100 全覆盖**（93 精确 + 7 近似，0 留空） |
| 许可 | 素材 CC BY-SA 4.0 → 可商用，须**署名 + 衍生同协议**；署名连同 Everkinetic |

**取代历史选型**：先前的 OpenTraining 69 张 png（仅覆盖 37/93）已退役。workout-guide 是同源同风格但更全、更清（SVG）、3 帧的严格升级。

**形态**：每动作 3 帧 SVG 分解序列 → 可作静态示意图，也可 3 帧循环成流畅伪动图。

图片母版：`https://raw.githubusercontent.com/bryllim/workout-guide/main/packages/workout-guide/assets/<slug>/frame-N.svg`。已下载到 `assets/exercise-media/<id>/0.svg、1.svg、2.svg`。

---

## 二、技术决策（供开发）

1. **格式转换**：✅ **已完成**。每动作 `0/1/2.png`（512×512 透明底，重上色深墨 `#1F2937` 黑线稿）已生成在 `assets/exercise-media/<id>/`，与 `.svg` 母版并存。接入时直接取 PNG 上云存储即可（微信 `<image>` 用 PNG，SVG 留作母版/换色重出）。
2. **数据字段**：动作加可缺省字段（建议 `media`，存云存储 fileID 数组）；无图则只显示曲线、不报错（架构铁律 6）。映射见 [exercise-media-map.json](exercise-media-map.json)。
3. **存储**：转好的 PNG 上**微信云存储**，存 fileID；**不打进小程序包**（已 ignore `assets/exercise-media`、`assets/pose-ref`）。
4. **署名**：「关于/致谢」页注明 `Exercise illustrations by Bryl Lim (workout-guide) & Everkinetic, CC BY-SA 4.0`。
5. **范围**：改动作详情页 + 数据口径 → **另开 OpenSpec change**。

**建议开发步骤**：①SVG→PNG 批转 → ②上云存储回填 fileID → ③详情页曲线下方渲染（3 帧静态或循环）+ 无图占位 → ④署名页。

---

## 三、覆盖情况

- **100 / 100 全覆盖**，0 留空。
- **7 个近似**（源库无完全对应，用姿态/类型相近替代，画风一致；如需精确可后续自制或再找）：
  `incline_db_fly`→incline-cable-fly、`seated_ohp`→seated-dumbbell-press、`db_curl`→bicep-curl（与杠铃弯举共用）、`stiff_leg_deadlift`→romanian-deadlift（与 RDL 共用）、`glute_ham_raise`→nordic-hamstring-curl（与北欧腿弯举共用）、`run_indoor`→running（与室外跑共用）、`walk_indoor`→treadmill-incline-walk。
- **有氧类现也覆盖**（running/walking/cycling/elliptical/stair-climber，同风格）——先前因旧源无合适素材而跳过，现一并纳入。

---

## 四、映射表（id → workout-guide slug）

> 状态：OK=精确；近似=同风格相近替代（含少数共用图）。共 100 条。

| id | 名称 | 分类 | workout-guide slug | 状态 |
|--|--|--|--|--|
| `bench` | 卧推 | 胸 | bench-press | OK |
| `incline_bench` | 上斜卧推 | 胸 | incline-bench-press | OK |
| `decline_bench` | 下斜卧推 | 胸 | decline-bench-press | OK |
| `db_bench` | 哑铃卧推 | 胸 | dumbbell-bench-press | OK |
| `incline_db_bench` | 上斜哑铃卧推 | 胸 | incline-dumbbell-press | OK |
| `smith_bench` | 史密斯卧推 | 胸 | smith-machine-bench-press | OK |
| `machine_chest_press` | 器械推胸 | 胸 | machine-chest-press | OK |
| `dips` | 双杠臂屈伸 | 胸 | chest-dip | OK |
| `pushup` | 俯卧撑 | 胸 | push-up | OK |
| `incline_db_fly` | 上斜哑铃飞鸟 | 胸 | incline-cable-fly | 近似 |
| `db_fly` | 哑铃飞鸟 | 胸 | dumbbell-fly | OK |
| `cable_fly` | 绳索夹胸 | 胸 | cable-fly | OK |
| `pec_deck` | 蝴蝶机夹胸 | 胸 | pec-deck | OK |
| `deadlift` | 硬拉 | 背 | deadlift | OK |
| `rack_pull` | 架上拉 | 背 | rack-pull | OK |
| `pullup` | 引体向上 | 背 | pull-up | OK |
| `chinup` | 反手引体 | 背 | chin-up | OK |
| `lat_pulldown` | 高位下拉 | 背 | lat-pulldown | OK |
| `barbell_row` | 杠铃划船 | 背 | barbell-row | OK |
| `t_bar_row` | 海豹划船 | 背 | chest-supported-row | OK |
| `db_row` | 单臂哑铃划船 | 背 | one-arm-dumbbell-row | OK |
| `seated_row` | 坐姿划船 | 背 | seated-row | OK |
| `machine_row` | 器械划船 | 背 | machine-row | OK |
| `straight_arm_pulldown` | 直臂下拉 | 背 | straight-arm-pulldown | OK |
| `shrug` | 杠铃耸肩 | 背 | shrug | OK |
| `db_shrug` | 哑铃耸肩 | 背 | dumbbell-shrug | OK |
| `back_extension` | 山羊挺身 | 背 | back-extension | OK |
| `ohp` | 站姿肩上推举 | 肩 | overhead-press | OK |
| `seated_ohp` | 坐姿肩上推举 | 肩 | seated-dumbbell-press | 近似 |
| `db_press` | 哑铃推举 | 肩 | standing-dumbbell-press | OK |
| `seated_db_press` | 坐姿哑铃推举 | 肩 | seated-dumbbell-press | OK |
| `arnold_press` | 阿诺德推举 | 肩 | arnold-press | OK |
| `machine_shoulder_press` | 器械推肩 | 肩 | machine-shoulder-press | OK |
| `upright_row` | 直立划船 | 肩 | upright-row | OK |
| `lateral_raise` | 侧平举 | 肩 | lateral-raise | OK |
| `cable_lateral_raise` | 绳索侧平举 | 肩 | cable-lateral-raise | OK |
| `front_raise` | 前平举 | 肩 | front-raise | OK |
| `rear_delt_fly` | 后束反向飞鸟 | 肩 | rear-delt-fly | OK |
| `face_pull` | 面拉 | 肩 | face-pull | OK |
| `barbell_curl` | 杠铃弯举 | 肱二头肌 | bicep-curl | OK |
| `ez_bar_curl` | EZ杠弯举 | 肱二头肌 | ez-bar-curl | OK |
| `db_curl` | 哑铃弯举 | 肱二头肌 | bicep-curl | 近似 |
| `incline_db_curl` | 斜板哑铃弯举 | 肱二头肌 | incline-dumbbell-curl | OK |
| `hammer_curl` | 锤式弯举 | 肱二头肌 | hammer-curl | OK |
| `preacher_curl` | 牧师凳弯举 | 肱二头肌 | preacher-curl | OK |
| `cable_curl` | 绳索弯举 | 肱二头肌 | cable-curl | OK |
| `concentration_curl` | 集中弯举 | 肱二头肌 | concentration-curl | OK |
| `close_grip_bench` | 窄距卧推 | 肱三头肌 | close-grip-bench-press | OK |
| `bench_dip` | 凳上臂屈伸 | 肱三头肌 | bench-dip | OK |
| `tricep_pushdown` | 三头下压 | 肱三头肌 | tricep-pushdown | OK |
| `rope_pushdown` | 绳索下压 | 肱三头肌 | rope-tricep-pushdown | OK |
| `overhead_extension` | 过顶臂屈伸 | 肱三头肌 | dumbbell-overhead-tricep-extension | OK |
| `skullcrusher` | 仰卧臂屈伸 | 肱三头肌 | skull-crusher | OK |
| `db_kickback` | 哑铃后撑 | 肱三头肌 | tricep-kickback | OK |
| `reverse_curl` | 反握弯举 | 前臂 | reverse-curl | OK |
| `wrist_curl` | 腕弯举 | 前臂 | wrist-curl | OK |
| `reverse_wrist_curl` | 反向腕弯举 | 前臂 | wrist-extension | OK |
| `farmer_walk` | 农夫行走 | 前臂 | farmer-carry | OK |
| `squat` | 深蹲 | 股四头肌 | squat | OK |
| `front_squat` | 前蹲 | 股四头肌 | front-squat | OK |
| `hack_squat` | 哈克深蹲 | 股四头肌 | hack-squat | OK |
| `smith_squat` | 史密斯深蹲 | 股四头肌 | smith-machine-squat | OK |
| `leg_press` | 腿举 | 股四头肌 | leg-press | OK |
| `goblet_squat` | 高脚杯深蹲 | 股四头肌 | goblet-squat | OK |
| `bulgarian_split_squat` | 保加利亚分腿蹲 | 股四头肌 | bulgarian-split-squat | OK |
| `lunge` | 箭步蹲 | 股四头肌 | forward-lunge | OK |
| `walking_lunge` | 行走箭步蹲 | 股四头肌 | walking-lunge | OK |
| `step_up` | 上踏步 | 股四头肌 | step-up | OK |
| `leg_ext` | 腿屈伸 | 股四头肌 | leg-extension | OK |
| `rdl` | 罗马尼亚硬拉 | 腘绳肌 | romanian-deadlift | OK |
| `stiff_leg_deadlift` | 直腿硬拉 | 腘绳肌 | romanian-deadlift | 近似 |
| `good_morning` | 早安式 | 腘绳肌 | good-morning | OK |
| `glute_ham_raise` | GHR俯卧挺身 | 腘绳肌 | nordic-hamstring-curl | 近似 |
| `leg_curl` | 俯卧腿弯举 | 腘绳肌 | lying-leg-curl | OK |
| `seated_leg_curl` | 坐姿腿弯举 | 腘绳肌 | seated-leg-curl | OK |
| `nordic_curl` | 北欧腿弯举 | 腘绳肌 | nordic-hamstring-curl | OK |
| `hip_thrust` | 臀推 | 臀 | hip-thrust | OK |
| `sumo_deadlift` | 相扑硬拉 | 臀 | sumo-deadlift | OK |
| `glute_bridge` | 臀桥 | 臀 | glute-bridge | OK |
| `cable_pull_through` | 绳索髋拉 | 臀 | cable-pull-through | OK |
| `cable_kickback` | 绳索后踢腿 | 臀 | cable-kickback | OK |
| `hip_abduction` | 坐姿髋外展 | 臀 | hip-abduction-machine | OK |
| `calf_raise` | 站姿提踵 | 小腿 | standing-calf-raise | OK |
| `seated_calf_raise` | 坐姿提踵 | 小腿 | seated-calf-raise | OK |
| `leg_press_calf_raise` | 腿举机提踵 | 小腿 | leg-press-calf-raise | OK |
| `hanging_leg_raise` | 悬垂举腿 | 核心 | hanging-leg-raise | OK |
| `ab_wheel` | 健腹轮 | 核心 | ab-wheel | OK |
| `cable_crunch` | 绳索卷腹 | 核心 | cable-crunch | OK |
| `crunch` | 卷腹 | 核心 | crunch | OK |
| `leg_raise` | 仰卧举腿 | 核心 | lying-leg-raise | OK |
| `russian_twist` | 俄罗斯转体 | 核心 | russian-twist | OK |
| `plank` | 平板支撑 | 核心 | plank | OK |
| `side_plank` | 侧平板 | 核心 | side-plank | OK |
| `run_outdoor` | 室外跑步 | 有氧 | running | OK |
| `run_indoor` | 室内跑步 | 有氧 | running | 近似 |
| `walk_outdoor` | 室外走路 | 有氧 | walking | OK |
| `walk_indoor` | 室内走路 | 有氧 | treadmill-incline-walk | 近似 |
| `elliptical` | 椭圆机 | 有氧 | elliptical | OK |
| `cycling` | 单车 | 有氧 | cycling | OK |
| `stairs` | 爬楼梯 | 有氧 | stair-climber | OK |

---

## 五、动态化实现（前端切帧 · 推荐）

3 帧本身是一套分解动作，循环播放即动图。**不烘焙 GIF/WebP**（GIF 透明只有 1-bit 会锯齿；动图 WebP 微信 `<image>` 支持不可靠）。用前端在 3 帧 PNG 间**乒乓切帧**，保留完整透明、全机型支持、可控速。

**WXML**
```html
<image class="ex-anim" src="{{animSrc}}" mode="aspectFit" show-menu-by-longpress="{{false}}" />
```

**JS（详情页）**
```js
// frames: 该动作 3 帧的图源数组（云存储 fileID 或本地路径）
startAnim(frames) {
  this.stopAnim();
  if (!frames || frames.length < 2) { this.setData({ animSrc: (frames && frames[0]) || '' }); return; }
  this._frames = frames; this._fi = 0; this._dir = 1;
  this.setData({ animSrc: frames[0] });
  this._timer = setInterval(() => {
    let i = this._fi + this._dir;                       // 乒乓：0→1→2→1→0→…
    if (i >= frames.length - 1) { i = frames.length - 1; this._dir = -1; }
    else if (i <= 0) { i = 0; this._dir = 1; }
    this._fi = i;
    this.setData({ animSrc: frames[i] });
  }, 450);                                              // 每帧 ~450ms，可调
},
stopAnim() { if (this._timer) { clearInterval(this._timer); this._timer = null; } },
// 生命周期：onHide/onUnload 里调用 stopAnim()，避免后台空转
```

要点：进入动作时 `startAnim(该动作的3帧图源)`；离开/隐藏时 `stopAnim()`。首轮切换后图片进缓存，之后无闪烁（如需更稳可在 `startAnim` 里先 `wx.getImageInfo` 预热 3 帧）。静态展示则只用 `frames[0]`。

---

## 六、机器可读映射

[exercise-media-map.json](exercise-media-map.json)：`{ _source, _rawPrefix, _frames, _format, map: { [id]: { slug, wgName, frames:[文件名...], flag } } }`。

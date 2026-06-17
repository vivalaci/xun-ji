# Tasks: record-and-deadlift-fixes

## 1. 保存保留全部动作（问题 1）

- [x] 1.1 `pages/workout/edit.js` `onSave` 力量分支：移除 `sets.filter` 与 `exercises.filter`，空重量/次数落 0（`weight: s.weight===''? 0 : toStoreFrom(...)`、`reps: Number(s.reps)||0`）
- [x] 1.2 保存守卫改为"整训练至少一组有非空重量或次数"，否则拦截提示；cardio 分支不变
- [x] 1.3 自检：选模板只填一个动作保存 → 重开全部动作在、未填为 0；完全空白仍拦截（纯逻辑单测覆盖 0 不污染聚合；交互见 4.3 真机）

## 2. 训练组重量统一到 0.5（问题 2）

- [x] 2.1 `utils/unit.js` 新增 `roundHalfKg(n)=Math.round(n*2)/2`
- [x] 2.2 存储：`toStoreFrom(_,'lb')` 与 `toStore`(lb) 套 `roundHalfKg`；kg 路径完整精度不变
- [x] 2.3 显示：新增 `toDisplayWeight(kg,dstUnit)`（换算后 `roundHalfKg`）；替换组重量显示调用点 `edit.js` 83/125/179、`detail.js` 80；`toDisplay`（体重等）保持 0.1 不变
- [x] 2.4 确认 `onSwitchExerciseUnit` 往返稳定（0.5 取整，无浮点漂移）；历史预填的 44.9 现显示 45（单测覆盖；交互见 4.3）
- [x] 2.5 `CLAUDE.md` 铁律 2 与 `docs/06`/`docs/07`（及 `docs/10`）措辞补"lb 落库取整 0.5kg + 训练组重量显示量化到 0.5"例外

## 3. 硬拉曲线变式聚合（问题 3）

- [x] 3.1 `utils/util.js` 新增 `dayLiftValue(workout, ids)`：匹配 `ids` 各动作的 `mainWorkingWeight`，取最大（无则 null）
- [x] 3.2 `utils/curveConfig.js` 家族单一来源 `DEADLIFT_FAMILY` + `familyFor(id)`；硬拉固定项 `ids:DEADLIFT_FAMILY`，保留 `id:'deadlift'`
- [x] 3.3 `pages/curve/curve.js` lift 单线：`ids = c.ids||[c.id]`，用 `util.dayLiftValue` 取 y；range/排序/断线不变
- [x] 3.4 确认详情跳转仍 `id:'deadlift'`（curve.js:227）、重复校验（按 `c.id`）与自定义曲线不受影响
- [x] 3.5 **硬拉详情聚合家族**（修正点进去空白）：`pages/exercise/detail.js` 用 `familyFor` 解析 ids，曲线按 `dayLiftValue` 逐次取家族当日最大、历史列家族各变式并标注；`detail.wxml/wxss` 加变式标签、key 改唯一；rdl/直腿单独曲线不聚合

## 4. 验证

- [x] 4.1 `tests/algo.test.js` 补：`roundHalfKg`（33.4→33.5、99lb→45、77lb→35、62.5→62.5、kg 存储不变；返回数字 33 非 "33.0"）、`toDisplayWeight`（44.9→45、33.0→33、62.5→62.5）、`dayLiftValue`（单变式/多变式取最大/无数据）、`familyFor`（硬拉展开/其余单一）、0 重量组不污染聚合；同步更新受影响的旧 lb 存储用例
- [x] 4.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿（74 测）
- [x] 4.3 模拟器/真机走查（用户真机通过）：① 模板只填一项保存重开数据全在；② 组重量只显示整数或 .5（历史 44.9 显示 45）、lb 录入保存为 0.5 倍数、切换往返稳定、体重明细仍 0.1；③ 硬拉曲线计入罗马尼亚/直腿硬拉、当日多变式取最大、点击进硬拉详情且详情同样聚合（只做过 rdl 时详情非空、历史标注变式）

## 5. 文档

- [x] 5.1 `docs/usermanual.md`：硬拉曲线含罗马尼亚/直腿硬拉、训练组重量统一显示到 0.5（lb 录入同样取整）、保存保留全部动作说明（已同步 `config/manual.js`）
- [x] 5.2 README 进度 + docs/00 阶段表（迭代十）

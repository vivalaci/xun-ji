# Proposal: preset-program-upgrade

## Why

现预设模板每套仅 5 个动作、无组次信息，与循证训练计划（docs/09）有差距。需按 docs/09 的二分化/三分化方案升级预设：补齐动作组成、引入「目标组次」，让新建训练能按计划预填组数并提示次数区间。同时确立「用户手册随版本更新」为发版必需步骤，并借本次把手册补齐到当前版本。

## What Changes

- **模板动作项新增可缺省「目标组次」**：`targetSets`（目标组数）、`repLow`/`repHigh`（次数区间）。新建训练按模板时按 `targetSets` 预填组数、组旁显示次数区间提示。
- **预设按 docs/09 升级**（共 8 套）：
  - 三分化：推日 / 拉日 / 蹲日（3 套，动作与目标按 docs/09 更新）
  - 二分化：**上肢A / 下肢A / 上肢B / 下肢B**（由原 上肢/下肢 2 套扩为 4 套）
  - 有氧：有氧训练（沿用）
- **存量升级用 `user_prefs.presetVersion` 版本重刷**：版本落后则把预设组（三分化/二分化/有氧）重刷为新版，「我的模板」（自建）不动。
- **用户手册纳入发版流程**：docs/07 发布流程加「同步更新 docs/usermanual.md」为必需步骤；本次把 usermanual 补齐到当前版本（含迭代三~五：日历/自定义曲线/每动作单位/腰围与身体三线图/有氧/分页/动作搜索与自重/新预设）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `template-management`: 预设模板按 docs/09 升级（二分化 2→4、三分化动作更新）；模板动作项加可缺省目标组次；新建训练按目标预填组数 + 次数区间提示；存量经 `presetVersion` 版本重刷预设组（我的模板不动）。

## Impact

- `config/templates.js`：重写 8 套预设，每动作带 `targetSets`/`repLow`/`repHigh`（有氧项除外）。
- `utils/db.js`：`ensureTemplatesSeeded` 引入 `presetVersion` 重刷（取代仅靠 seededCardio 的补种）；重刷只动预设组、保留我的模板。
- `pages/workout/edit.js`：strength 按模板预填用 `targetSets` 决定组数、组旁显示 `repLow-repHigh` 提示（无历史时用目标；有历史仍优先复用上次实际重量）。
- `docs/07-development-guide.md`：发布流程加手册更新必需项。`docs/usermanual.md`：补齐到当前版本。
- 数据：`workout_templates` 仅新增可缺省字段，无破坏；`workouts` 不变。

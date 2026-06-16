# Design: preset-program-upgrade

## Context

`config/templates.js` 现 5 套预设（三分化 3 + 二分化 2），每套仅 5 个 `{exerciseId}`，无组次。`db.ensureTemplatesSeeded` 全新播种写全部预设；存量经 `migrateTemplateGroups`（补 group）+ `ensureCardioSeeded`（user_prefs.seededCardio 一次性补种有氧）。`workout/edit` 的 `buildFromTemplate` 力量路径：每动作默认 1 组，有上次同模板训练则复用其 sets。docs/09 给出循证的二分化(上A/下A/上B/下B)与三分化(推/拉/腿)方案，含组×次/RIR，所有动作 id 现库已覆盖。

## Goals / Non-Goals

**Goals:**
- 预设按 docs/09 升级（动作组成 + 目标组次），二分化扩 4 套。
- 录入按目标预填组数 + 次数区间提示，不丢「复用上次重量」。
- 存量无损升级（我的模板不动），数据模型仅加可缺省字段。
- 确立「手册随版本更新」流程并补齐 usermanual。

**Non-Goals:**
- 不存 RIR 到数据（仅 docs/09 设计参考；区间提示足够）。
- 不改 `workouts`、不改动作库。
- 不为有氧加组次目标。

## Decisions

### D1：目标组次为模板动作项的可缺省字段
模板动作项：`{ exerciseId, targetSets?, repLow?, repHigh? }`。力量预设填写；有氧项与自建/旧模板不填（缺省）。`workout_templates` 仅新增可缺省字段，符合铁律 6。

### D2：预填 = 目标定组数 + 历史定重量，二者结合
`buildFromTemplate`（strength）每动作：
- 有上次同模板训练记录 → 复用其 sets（渐进超负荷优先，现状逻辑）。
- 无历史 → 铺 `targetSets`（缺省 1）个空组。
- 组旁始终显示 `repLow–repHigh` 提示（若模板该动作有）。提示存于该动作项（`repLow/repHigh`），录入页透传到 set-head 或行旁。
- **被否**：用目标覆盖历史组数 —— 会抹掉用户真实历史，违背"复用上次"。

### D3：`presetVersion` 版本重刷取代零散补种
- 常量 `PRESET_VERSION = 2`。
- `ensureTemplatesSeeded`：全新播种后置 `presetVersion=2`；存量若 `presetVersion`<2（或缺失）→ 删除现有预设组（group∈{三分化,二分化,有氧}）模板、写入新版 PRESET_TEMPLATES、置 `presetVersion=2`；group 为空的「我的模板」保留。
- 取代 `seededCardio` 一次性补种（有氧并入预设组重刷）；旧 `seededCardio` 标记残留无害。
- **代价**：版本重刷会覆盖用户对预设的编辑、并恢复被删预设（预设 = App 托管，自定义请存「我的模板」）。已在 spec 言明。
- **被否**：仅补缺、不覆盖 —— 旧预设动作停留在 v1，无法享受 docs/09 升级，违背本 change 初衷。

### D4：重刷的本地先写一致性
删除/写入走 `removeLocalFirst`/`saveLocalFirst`（本地先落 + 队列同步），与全局弱网策略一致；置版本走 `updatePrefs({presetVersion:2})`。重刷后返回 `store.getCache(TEMPLATES)`。

### D5：用户手册流程化 + 补齐
- `docs/07` §六发布流程 增「同步更新 `docs/usermanual.md`」为必需项；§三流程的 archive 前清单提及。
- 本次把 usermanual 从迭代二水平补齐到当前：训练日历、自定义曲线与编辑、每动作输入单位、腰围 + 身体三线图、数据分页、动作搜索与自重、有氧训练、新预设与目标组次。

## Risks / Trade-offs

- [覆盖用户预设编辑] presetVersion 重刷会重置预设 → spec 明示「预设 App 托管，自定义存我的模板」；对单人开发者即"拿到 docs/09 新版"，符合预期。
- [二分化 2→4 的旧记录] 旧训练若 templateId 指向被删的旧「上肢/下肢」预设 → 训练记录存的是 exerciseId 快照，仍正常展示；仅「复用上次同模板」因 templateId 失配回落到按目标铺组，可接受。
- [手册维护成本] 设为必需项增量维护 → 但保证用户文档不腐化，值得。

## Migration Plan

发版后首次 `ensureTemplatesSeeded`：presetVersion<2 → 预设组重刷为 v2、置版本。我的模板保留。无 `workouts` 迁移。回滚：旧代码忽略 `targetSets` 等新字段照常运行。

## Open Questions

（无）

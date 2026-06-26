# 训记 · 项目规划总览

## 阶段进度

| 阶段 | 名称 | 状态 |
|------|------|------|
| ① | 产品定义 | ✅ 完成 |
| ② | 用户研究 | ✅ 完成 |
| ③ | 信息架构 | ✅ 完成 |
| ④ | 交互设计 | ✅ 完成 |
| ⑤ | 视觉设计 | ✅ 完成（组件定义留至开发阶段） |
| ⑥ | 技术方案 | ✅ 完成 |
| ⑦ | 开发实现 | ✅ 迭代一~十五全部完成、真机通过并归档（…十四=模板命名去重+纯自重趋势+选模板删除 template-naming-and-bodyweight-trend；十五=身体趋势图迁身体页+首页固定项4→3+手册参考资料 move-body-trend-to-body-page） |
| ⑧ | 测试上线 | 🔄 进行中（备案 / 隐私指引 / 类目 / 提审待办） |

> 迭代二（身体数据、模板/动作库管理、设置含 lb、动作详情、PR 标记）、迭代三（模板分组 + 曲线首页可定制）均已真机验证并归档至 `openspec/changes/archive/`。主 specs 7 个：body-tracking、curve-customization、exercise-detail、exercise-library-management、pr-tracking、template-management、unit-settings。集合共 5 个（含 `user_prefs`）。
>
> 迭代四 `enrich-exercise-library`（代码完成，待真机验证）：内置动作 27→92、按肌群细化分类、补元数据（器械/肌群/模式/别名）；三处面板按名称+别名搜索；自重动作 `loadType` 记录额外负重。修改主 spec `exercise-library-management`，不新增集合。
>
> 迭代六 `preset-program-upgrade`（代码完成 + 真机通过）：预设按 docs/09 升级为 8 套（二分化 2→4），模板动作加可缺省「目标组次」`targetSets`/`repLow`/`repHigh`，新建按目标铺组 + 次数区间提示；存量经 `user_prefs.presetVersion` 版本重刷预设组、我的模板不动；选模板二/三分化组下附循证说明；用户手册纳入发版必需流程。修改主 spec `template-management`，仅新增可缺省字段不破坏。
>
> 迭代七 `calendar-split-palette`（代码完成 + 真机通过）：日历配色改为「色相编码系统」——三分化=蓝族、二分化=绿族、有氧=橙、其他=灰，族内区分单日。纯展示层换色（`utils/calendar.js` `TYPES`），不动数据、不新增字段。修改主 spec `training-calendar`。
>
> 迭代八 `template-picker-split-dots`（代码完成 + 真机通过）：把"颜色钥匙"从日历图例移到选模板行——每个模板行右侧显示该训练日的分化色点（取色收敛 `calendar.typeOf`，与日历同源），空白训练为黑点；移除日历图例。修改主 spec `training-calendar`（撤图例）、`template-management`（加选模板色点）。
>
> 迭代九 `in-app-usermanual`（代码完成 + 真机通过）：「我的」页设置下方加「使用说明」入口，进独立页按节渲染用户手册（段落/要点/问答）；内容固化为 `config/manual.js`，与 `docs/usermanual.md` 同源。新增主 spec `in-app-usermanual`（共 12 个），纯展示不动集合。
>
> 迭代十 `record-and-deadlift-fixes`（代码完成 + 真机通过）：三个真机问题——① 保存力量训练保留全部动作、未填落 0（`edit.js` onSave 去过滤）；② 训练组重量统一量化到 0.5（`unit.roundHalfKg`/`toDisplayWeight`，含历史脏值），lb 录入落库取整 0.5kg，体重保留 0.1；③ 硬拉曲线与详情聚合家族（硬拉/罗马尼亚硬拉/直腿硬拉，`util.dayLiftValue`、`curveConfig.familyFor`）。改 3 主 spec（template-management/per-entry-input-unit/curve-customization），不新增集合；铁律 2 定向放宽已同步 CLAUDE.md/docs/06/07/10。
>
> 迭代十一 `record-to-template`（代码完成 + 真机通过）：编辑已有记录顶部【保存模板】一键存为「我的模板」（`templateLib.recordToTemplatePayload`：力量取 exerciseId+组数、有氧 type:cardio、名称加「（我的）」）；「我的模板」分组置顶；预设模板 App 托管不可删除（`isPresetGroup` + 删除入口仅我的模板渲染）。改主 spec `template-management`，不新增集合。首个走 PR 分支流程的迭代。
>
> 迭代十二 `workout-flow-and-trend-fixes`（代码完成 + 真机通过）：①选模板拆为独立页 `pages/workout/pick`（返回导航正确，保存新建退 2 层回列表）；②训练编辑页动作上移/下移（力量+有氧）；③身体趋势图体重线渲染修复（`chart.computeBand` 最小尺度 + 近平线错位）。改 3 主 spec（template-management/cardio-tracking/curve-customization），不新增集合。
>
> 迭代十三 `highlight-today-workout`（代码完成 + 真机通过）：训练列表对今天（`util.isToday`）的记录卡片左侧加强调色竖条，一眼定位今日训练；纯展示（`list.decorate` 打 `isToday`），不动排序/分页/字段。新增主 spec `workout-list`（共 13 个）。
>
> 迭代十四 `template-naming-and-bodyweight-trend`（代码完成 + 真机通过）：①模板命名后缀幂等去重 + 重名编号 + 保存确认窗可编辑（`templateLib.baseTemplateName`/`recordToTemplatePayload`）；②纯自重动作趋势按当日最大次数（`util.dayRepsValue`，曲线/详情整条统一口径）；③选模板页 `pages/workout/pick` 加删除「我的模板」（预设不可删）。改 3 主 spec（template-management/curve-customization/exercise-detail），不新增集合。
>
> 迭代十五 `move-body-trend-to-body-page`（代码完成 + 真机通过）：身体趋势三线合并图从曲线首页迁至「身体」页上方（无标题、范围切换、复用 `drawMultiLine`），首页固定项 4→3（`curveConfig` 去 body、抽 `BODY_SERIES`，旧 body 配置自愈剔除）；手册新增「参考资料」节（docs/09 四条文献）。改 3 主 spec（curve-customization/body-tracking/in-app-usermanual），不新增集合。

## 文档索引

- [01-product-definition.md](./01-product-definition.md) — 产品定义
- [02-user-research.md](./02-user-research.md) — 用户研究
- [03-information-architecture.md](./03-information-architecture.md) — 信息架构
- [04-interaction-design.md](./04-interaction-design.md) — 交互设计
- [05-visual-design.md](./05-visual-design.md) — 视觉设计
- [06-technical-architecture.md](./06-technical-architecture.md) — 技术方案
- [07-development-guide.md](./07-development-guide.md) — 开发指南（流程与规范）
- [10-project-handoff.md](./10-project-handoff.md) — 项目交接 / 入职速览（接手先读这篇）
- [08-launch-checklist.md](./08-launch-checklist.md) — 测试上线（边界测试 + 上线检查表）

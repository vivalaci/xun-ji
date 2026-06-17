# Tasks: preset-program-upgrade

## 1. 预设内容（config/templates.js）

- [x] 1.1 三分化 推日/拉日/蹲日：动作与 `targetSets`/`repLow`/`repHigh` 按 docs/09 三分化
- [x] 1.2 二分化扩为 上肢A/下肢A/上肢B/下肢B 四套：动作与目标按 docs/09 二分化（order 递增）
- [x] 1.3 有氧训练沿用（无组次目标）；校验所有 exerciseId 在库、order 唯一

## 2. 版本重刷（utils/db.js）

- [x] 2.1 `PRESET_VERSION=2`；全新播种后置 `user_prefs.presetVersion=2`
- [x] 2.2 存量：`presetVersion`<2 → 删除预设组（三分化/二分化/有氧）模板、写新版、置版本；我的模板（group 空）保留
- [x] 2.3 重刷走 removeLocalFirst/saveLocalFirst + updatePrefs；返回最新缓存

## 3. 录入预填（pages/workout/edit.js）

- [x] 3.1 `buildFromTemplate` strength：无历史按 `targetSets` 铺组（缺省 1）；有历史仍复用上次
- [x] 3.2 动作项透传 `repLow/repHigh`；录入页组旁/表头显示「{repLow}–{repHigh} 次」提示（有则显示）
- [x] 3.3 样式：次数区间提示（muted 小字），缺字段不显示
- [x] 3.4 选模板界面在「二分化/三分化」组标题下展示循证说明（`templateLib.GROUP_NOTES`，来源 docs/09）

## 4. 验证

- [x] 4.1 `tests/algo.test.js`：补预设一致性（8 套、id 在库、二分化4套）、目标字段存在性、presetVersion 重刷纯函数（若抽取）；现有全绿
- [x] 4.2 `node --check` 全部 js + `node tests/algo.test.js` 全绿
- [x] 4.3 模拟器走查：升级后预设变 8 套、二分化4套、动作按 docs/09；选模板首次按目标铺组+区间提示；有历史复用上次；我的模板未被动；有氧不受影响（已验证：迭代七/八在本升级之上真机开发并归档，预设 8 套/目标组次/选模板循证说明均在线运行）
- [x] 4.4 提请用户真机验证并给出验证点清单

## 5. 用户手册流程化 + 补齐

- [x] 5.1 `docs/07-development-guide.md` 发布流程加「同步更新 docs/usermanual.md」为必需项
- [x] 5.2 `docs/usermanual.md` 补齐到当前版本：日历/自定义曲线与编辑/每动作单位/腰围与身体三线图/分页/动作搜索与自重/有氧训练/新预设与目标组次
- [x] 5.3 README 进度 + docs/00 阶段表（归档时）

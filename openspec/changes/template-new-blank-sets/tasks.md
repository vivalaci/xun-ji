## 1. 取消按模板新建的历史值预填

- [x] 1.1 `pages/workout/edit.js` `buildFromTemplate` 力量分支：移除 `lastSame`/`prev.sets` 复用，统一按 `targetSets`（||1）铺空组 + `repLow/repHigh` 区间提示
- [x] 1.2 有氧分支：去掉 `lastSame`，每活动 `buildCardioItem(te.exerciseId, null)`
- [x] 1.3 清理 `workouts` 缓存局部变量（不再用）；`mainUnit` 仍用于 `unit: mainUnit` 故保留；grep 确认无 `lastSame`/`prev.sets` 残留
- [x] 1.4 编辑既有记录 `loadExisting` 未改，照常按已存值回显

## 2. 用户手册同步

- [x] 2.1 `docs/usermanual.md` §三：「预填」改为「空组铺好」（目标组数铺空组 + 区间提示，不预填上次值）
- [x] 2.2 `config/manual.js` 同源条目同步改写

## 3. 验证与收尾

- [x] 3.1 语法校验：全量 `node --check` 通过
- [x] 3.2 算法单测：`node tests/algo.test.js` 全绿（95 测，无回归）
- [ ] 3.3 模拟器/真机走查：选模板新建后**每个动作每一组的重量与次数都为空（清零）**，无任何上次数值残留；未填任何组保存被拦截；填部分保存只存真实值（未填补 0）；有氧模板新建时长/距离/层数均为空；编辑既有记录照常回显
- [ ] 3.4 更新 `README.md`/`CHANGELOG.md` 进度 + `docs/00-overview.md` 阶段表
- [ ] 3.5 `openspec validate`，归档前 `/opsx:sync` + `/opsx:archive` 并打 tag

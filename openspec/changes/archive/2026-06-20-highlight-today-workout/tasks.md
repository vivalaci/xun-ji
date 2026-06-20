## 1. 渲染层判定

- [x] 1.1 `pages/workout/list.js`：`decorate` 给每条卡片加 `isToday`（`util.isToday(w.date)`）
- [x] 1.2 抽 `util.isToday(date)` 纯函数（与落库同源字符串等值），`tests/algo.test.js` 补用例

## 2. 高亮样式

- [x] 2.1 `pages/workout/list.wxml`：卡片按 `isToday` 加 `today` 修饰类
- [x] 2.2 `pages/workout/list.wxss`：`.workout-item.today::before` 左侧强调色竖条（`var(--accent)` #1D4ED8），不影响卡片其余布局

## 3. 验证

- [x] 3.1 语法检查：改动 js `node --check` 通过
- [x] 3.2 算法单测：`node tests/algo.test.js` 全绿（86 测）
- [x] 3.3 模拟器走查（用户真机通过）：当天有 1 条→竖条；当天多条→均有竖条；当天无记录→无竖条；排序/分页不变

## 4. 文档与归档

- [x] 4.1 `docs/usermanual.md` + `config/manual.js`（同源）：训练列表"今日训练高亮"说明
- [x] 4.2 `CHANGELOG.md` 迭代十三 + `docs/00-overview.md` 阶段表 + `docs/10` 交接
- [x] 4.3 `/opsx:sync`：新建 `openspec/specs/workout-list/spec.md`（新 capability）
- [x] 4.4 `/opsx:archive`：归档；tag 合并后打

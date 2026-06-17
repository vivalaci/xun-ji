## 1. 取色收敛

- [x] 1.1 `utils/calendar.js` 新增纯函数 `typeOf({name,type})`：`type==='cardio'`→`TYPES.cardio`，否则 `classify(name)`；返回 TYPES 条目。
- [x] 1.2 `aggregateByDate` 改用 `typeOf` 取每条 workout 的 type（行为等价）。
- [x] 1.3 删除 `LEGEND_GROUPS` 导出（不再使用）。

## 2. 选模板色点

- [x] 2.1 `pages/workout/edit.js`：载入 `templateGroups` 后给每个 item 附 `dotColor = calendar.typeOf(item).color`（`withDotColors`）；空白训练用常量黑点 `#111827`。
- [x] 2.2 `pages/workout/edit.wxml`：`tpl-card` 改为左内容 + 右色点行布局，色点取 `item.dotColor`（含空白训练卡黑点）。
- [x] 2.3 `pages/workout/edit.wxss`：色点样式 + 卡片行对齐（右侧居中色点）。

## 3. 移除日历图例

- [x] 3.1 `pages/curve/curve.wxml`：删 `cal-legend` 块。
- [x] 3.2 `pages/curve/curve.wxss`：删 `.cal-legend*` 样式。
- [x] 3.3 `pages/curve/curve.js`：删 `calLegend` data 字段。

## 4. 测试与验证

- [x] 4.1 `tests/algo.test.js`：删"图例按系统分组"用例；新增 `typeOf` 用例（cardio 优先、名称归类、缺省）。
- [x] 4.2 跑全库 `node --check`（0 错）与 `node tests/algo.test.js`（64 通过）。
- [x] 4.3 模拟器走查：选模板每行右侧色点与日历同色（推靛蓝/有氧橙/自定义灰/空白黑）、日历图例已消失——用户走查通过。

## 5. 文档与归档

- [x] 5.1 更新 `docs/usermanual.md`：日历不再描述图例；选模板段补"每行右侧色点对应日历颜色"。
- [x] 5.2 真机/模拟器验证：用户确认选模板色点与日历配色一致。
- [ ] 5.3 归档（合并两条 delta 进主 spec）+ 更新 README/`docs/00-overview.md` + 打 tag。

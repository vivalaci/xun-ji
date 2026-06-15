// tests/algo.test.js —— 核心算法单测（node 原生，无需框架）
// 运行：node tests/algo.test.js
const assert = require('assert');

// ---- 最小 wx mock（让 store/unit 可在 node 环境运行）----
const storage = {};
global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; }
};

const util = require('../utils/util.js');
const unit = require('../utils/unit.js');
const store = require('../utils/store.js');
const templateLib = require('../utils/templateLib.js');
const PRESETS = require('../config/templates.js');
const curveConfig = require('../utils/curveConfig.js');
const calendar = require('../utils/calendar.js');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }

console.log('mainWorkingWeight:');
test('取组数最多的重量', () => {
  assert.strictEqual(util.mainWorkingWeight([
    { weight: 50, reps: 5 }, { weight: 50, reps: 5 }, { weight: 52.5, reps: 4 }
  ]), 50);
});
test('组数并列取较重', () => {
  assert.strictEqual(util.mainWorkingWeight([
    { weight: 60, reps: 5 }, { weight: 65, reps: 5 }
  ]), 65);
});
test('空组返回 null', () => {
  assert.strictEqual(util.mainWorkingWeight([]), null);
});

console.log('buildPRMap:');
test('主力工作组重量创新高才标记 PR', () => {
  const workouts = [
    { _id: 'w1', date: '2026-01-01', exercises: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] }] },
    { _id: 'w2', date: '2026-02-01', exercises: [{ exerciseId: 'bench', sets: [{ weight: 65, reps: 5 }] }] },
    { _id: 'w3', date: '2026-03-01', exercises: [{ exerciseId: 'bench', sets: [{ weight: 62, reps: 5 }] }] }
  ];
  const pr = util.buildPRMap(workouts);
  assert.ok(pr['w1'] && pr['w1'].has('bench'), 'w1 首次应为 PR');
  assert.ok(pr['w2'] && pr['w2'].has('bench'), 'w2 创新高应为 PR');
  assert.ok(!pr['w3'], 'w3 未创新高不应为 PR');
});
test('不同动作各自独立计 PR', () => {
  const workouts = [
    { _id: 'a', date: '2026-01-01', exercises: [
      { exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] },
      { exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] }
    ] }
  ];
  const pr = util.buildPRMap(workouts);
  assert.strictEqual(pr['a'].size, 2);
});

console.log('unit (lb 换算):');
test('kg 模式恒等', () => {
  store.setSettings({ weightUnit: 'kg' });
  assert.strictEqual(unit.toStore(100), 100);
  assert.strictEqual(unit.toDisplay(100), 100);
  assert.strictEqual(unit.step(), 2.5);
});
test('lb 模式：输入 lb 落库 kg，读回显示 lb', () => {
  store.setSettings({ weightUnit: 'lb' });
  const kg = unit.toStore(100);           // 100 lb → kg
  assert.ok(Math.abs(kg - 45.359237) < 1e-6, 'toStore 应为 45.359237');
  assert.strictEqual(unit.toDisplay(kg), 100); // 往返一致（toDisplay 保留 1 位）
  assert.strictEqual(unit.step(), 5);
  assert.strictEqual(unit.label(), 'lb');
});

console.log('templateLib.groupTemplates:');
test('预设组在前、我的模板垫底、空桶剔除', () => {
  const groups = templateLib.groupTemplates([
    { _id: 'a', name: '自建', group: '', order: 9 },
    { _id: 'b', name: '上肢', group: '二分化', order: 3 },
    { _id: 'c', name: '推日', group: '三分化', order: 0 }
  ]);
  assert.deepStrictEqual(groups.map((g) => g.name), ['三分化', '二分化', '我的模板']);
});
test('缺 group 字段也归我的模板', () => {
  const groups = templateLib.groupTemplates([{ _id: 'x', name: '旧模板', order: 0 }]);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].name, '我的模板');
});
test('桶内按 order 升序', () => {
  const groups = templateLib.groupTemplates([
    { _id: 'b', name: '拉日', group: '三分化', order: 1 },
    { _id: 'a', name: '推日', group: '三分化', order: 0 }
  ]);
  assert.deepStrictEqual(groups[0].items.map((t) => t.name), ['推日', '拉日']);
});

console.log('templateLib.planTemplateMigration:');
test('旧三件套归三分化且腿日改名蹲日，补种二分化', () => {
  const plan = templateLib.planTemplateMigration([
    { _id: 't1', name: '推日', order: 0 },
    { _id: 't2', name: '拉日', order: 1 },
    { _id: 't3', name: '腿日', order: 2 }
  ], PRESETS);
  assert.strictEqual(plan.needed, true);
  assert.deepStrictEqual(plan.updates.find((u) => u.id === 't1').data, { group: '三分化' });
  assert.deepStrictEqual(plan.updates.find((u) => u.id === 't3').data, { group: '三分化', name: '蹲日' });
  assert.deepStrictEqual(plan.additions.map((p) => p.name), ['上肢', '下肢']);
});
test('用户已改名的模板归我的模板（不动名称）', () => {
  const plan = templateLib.planTemplateMigration([{ _id: 't9', name: '我的腿部计划', order: 5 }], PRESETS);
  assert.deepStrictEqual(plan.updates[0].data, { group: '' });
});
test('迁移幂等：全部有 group 后不再触发', () => {
  const plan = templateLib.planTemplateMigration([
    { _id: 't1', name: '推日', group: '三分化', order: 0 },
    { _id: 't9', name: '自建', group: '', order: 5 }
  ], PRESETS);
  assert.strictEqual(plan.needed, false);
  assert.strictEqual(plan.additions.length, 0);
});
test('补种前检：同名同组已存在则跳过', () => {
  const plan = templateLib.planTemplateMigration([
    { _id: 't1', name: '推日', order: 0 },
    { _id: 't8', name: '上肢', group: '二分化', order: 3 }
  ], PRESETS);
  assert.deepStrictEqual(plan.additions.map((p) => p.name), ['下肢']);
});

console.log('curveConfig.composeCharts:');
test('无配置返回默认 4 项（三大项 + 身体趋势）', () => {
  const charts = curveConfig.composeCharts(null);
  assert.deepStrictEqual(charts.map((c) => c.key), ['bench', 'squat', 'deadlift', 'body']);
  assert.ok(charts.every((c) => c.fixed));
  const body = charts.find((c) => c.key === 'body');
  assert.strictEqual(body.type, 'bodyCombined');
  assert.deepStrictEqual(body.series.map((s) => s.field), ['weight', 'bodyFat', 'waist']);
});
test('按配置顺序渲染，缺失固定 key 自动追加', () => {
  const charts = curveConfig.composeCharts({ curveOrder: ['squat', 'bench'], customCurves: [] });
  assert.deepStrictEqual(charts.map((c) => c.key), ['squat', 'bench', 'deadlift', 'body']);
});
test('旧键 weight/bodyFat 自愈：剔除并补入 body', () => {
  const charts = curveConfig.composeCharts({
    curveOrder: ['bench', 'squat', 'deadlift', 'weight', 'bodyFat'],
    customCurves: []
  });
  assert.ok(!charts.some((c) => c.key === 'weight' || c.key === 'bodyFat'));
  assert.deepStrictEqual(charts.map((c) => c.key), ['bench', 'squat', 'deadlift', 'body']);
});
test('未知 key 剔除', () => {
  const charts = curveConfig.composeCharts({
    curveOrder: ['bench', 'ex_ghost', 'squat', 'deadlift', 'body'],
    customCurves: []
  });
  assert.ok(!charts.some((c) => c.key === 'ex_ghost'));
  assert.strictEqual(charts.length, 4);
});
test('自定义曲线取名 + 槽位配色，已删自建动作回退占位名', () => {
  const charts = curveConfig.composeCharts({
    curveOrder: ['bench', 'squat', 'deadlift', 'body', 'ex_lat_pulldown', 'ex_cus_gone'],
    customCurves: [
      { key: 'ex_lat_pulldown', exerciseId: 'lat_pulldown', slot: 0 },
      { key: 'ex_cus_gone', exerciseId: 'cus_gone', slot: 1 }
    ]
  });
  const c1 = charts.find((c) => c.key === 'ex_lat_pulldown');
  const c2 = charts.find((c) => c.key === 'ex_cus_gone');
  assert.strictEqual(c1.name, '高位下拉');
  assert.strictEqual(c1.color, curveConfig.CUSTOM_PALETTE[0]);
  assert.strictEqual(c2.name, '已删除动作');
  assert.strictEqual(c2.color, curveConfig.CUSTOM_PALETTE[1]);
  assert.ok(!c1.fixed && !c2.fixed);
});

console.log('curveConfig.moveKey:');
test('上移/下移交换相邻项', () => {
  assert.deepStrictEqual(curveConfig.moveKey(['a', 'b', 'c'], 'b', 'up'), ['b', 'a', 'c']);
  assert.deepStrictEqual(curveConfig.moveKey(['a', 'b', 'c'], 'b', 'down'), ['a', 'c', 'b']);
});
test('首行上移/末行下移不动', () => {
  assert.deepStrictEqual(curveConfig.moveKey(['a', 'b'], 'a', 'up'), ['a', 'b']);
  assert.deepStrictEqual(curveConfig.moveKey(['a', 'b'], 'b', 'down'), ['a', 'b']);
});

console.log('curveConfig.addCustom / removeCustom:');
test('添加：入顺序末位 + 取最小空闲槽位', () => {
  const r = curveConfig.addCustom(null, 'lat_pulldown');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.prefs.curveOrder[r.prefs.curveOrder.length - 1], 'ex_lat_pulldown');
  assert.strictEqual(r.prefs.customCurves[0].slot, 0);
});
test('重复拦截：三大项与已添加动作', () => {
  assert.strictEqual(curveConfig.addCustom(null, 'bench').ok, false);
  const r1 = curveConfig.addCustom(null, 'lat_pulldown');
  assert.strictEqual(curveConfig.addCustom(r1.prefs, 'lat_pulldown').ok, false);
});
test('上限 2 条拦截', () => {
  const r1 = curveConfig.addCustom(null, 'lat_pulldown');
  const r2 = curveConfig.addCustom(r1.prefs, 'ohp');
  const r3 = curveConfig.addCustom(r2.prefs, 'leg_press');
  assert.strictEqual(r3.ok, false);
  assert.strictEqual(r3.reason, 'limit');
});
test('删除后槽位颜色复用', () => {
  const r1 = curveConfig.addCustom(null, 'lat_pulldown');
  const r2 = curveConfig.addCustom(r1.prefs, 'ohp');
  const removed = curveConfig.removeCustom(r2.prefs, 'ex_lat_pulldown');  // 释放槽位 0
  const r3 = curveConfig.addCustom(removed, 'leg_press');
  assert.strictEqual(r3.ok, true);
  assert.strictEqual(r3.prefs.customCurves.find((c) => c.key === 'ex_leg_press').slot, 0);
  assert.ok(!r3.prefs.curveOrder.includes('ex_lat_pulldown'));
});

console.log('calendar.classify:');
test('5 类按关键词归类，其余归其他', () => {
  assert.strictEqual(calendar.classify('推日').key, 'push');
  assert.strictEqual(calendar.classify('拉日').key, 'pull');
  assert.strictEqual(calendar.classify('蹲日').key, 'squat');
  assert.strictEqual(calendar.classify('腿日').key, 'squat');
  assert.strictEqual(calendar.classify('胸三头').key, 'other');
});
test('上肢/下肢优先判定，不被其他关键词误吃', () => {
  assert.strictEqual(calendar.classify('上肢').key, 'upper');
  assert.strictEqual(calendar.classify('下肢').key, 'lower');
});

console.log('calendar.aggregateByDate / trainedDaysInMonth:');
test('按日期聚合 + 当月训练天数', () => {
  const ws = [
    { _id: 'a', date: '2026-06-01', name: '推日' },
    { _id: 'b', date: '2026-06-01', name: '下肢' },
    { _id: 'c', date: '2026-06-03', name: '拉日' },
    { _id: 'd', date: '2026-05-30', name: '蹲日' }
  ];
  const byDate = calendar.aggregateByDate(ws);
  assert.strictEqual(byDate['2026-06-01'].length, 2);
  assert.strictEqual(calendar.trainedDaysInMonth(byDate, 2026, 5), 2); // 6月(month=5)有 1日、3日
});

console.log('calendar.monthMatrix:');
test('周一起始、今日标记、跨月单元格标记', () => {
  const byDate = calendar.aggregateByDate([{ _id: 'a', date: '2026-06-15', name: '推日' }]);
  const cells = calendar.monthMatrix(2026, 5, byDate, '2026-06-15'); // 2026-06-01 是周一
  assert.strictEqual(cells[0].dateStr, '2026-06-01');
  assert.strictEqual(cells[0].inMonth, true);
  const d15 = cells.find((c) => c.dateStr === '2026-06-15');
  assert.strictEqual(d15.isToday, true);
  assert.deepStrictEqual(d15.dots, ['#1D4ED8']);
});
test('一天多练超 3 个圆点折叠 +N', () => {
  const ws = ['推日', '拉日', '蹲日', '上肢'].map((n, i) => ({ _id: 'x' + i, date: '2026-06-10', name: n }));
  const byDate = calendar.aggregateByDate(ws);
  const cell = calendar.monthMatrix(2026, 5, byDate, '2026-06-01').find((c) => c.dateStr === '2026-06-10');
  assert.strictEqual(cell.dots.length, 3);
  assert.strictEqual(cell.more, 1);
});

console.log('unit 显式单位换算族（per-entry-input-unit）:');
test('toStoreFrom：kg 恒等 / lb→kg 精度', () => {
  assert.strictEqual(unit.toStoreFrom(100, 'kg'), 100);
  assert.ok(Math.abs(unit.toStoreFrom(225, 'lb') - 225 * 0.45359237) < 1e-9);
});
test('toDisplayIn：kg 恒等 / kg→lb round / 空透传', () => {
  assert.strictEqual(unit.toDisplayIn(100, 'kg'), 100);
  assert.strictEqual(unit.toDisplayIn(100, 'lb'), +(100 / 0.45359237).toFixed(1));
  assert.strictEqual(unit.toDisplayIn('', 'lb'), '');
  assert.strictEqual(unit.toDisplayIn(null, 'lb'), null);
});
test('stepFor：lb 5 / kg 2.5', () => {
  assert.strictEqual(unit.stepFor('lb'), 5);
  assert.strictEqual(unit.stepFor('kg'), 2.5);
});
test('toDisplayIn/toDisplay：消除浮点长尾，round 到 1 位', () => {
  assert.strictEqual(unit.toDisplayIn(60.010270551000005, 'kg'), 60); // 长尾 → 60
  assert.strictEqual(unit.toDisplayIn(62.5, 'kg'), 62.5);             // 半 kg 保留
  store.setSettings({ weightUnit: 'kg' });
  assert.strictEqual(unit.toDisplay(60.010270551000005), 60);
  store.setSettings({ weightUnit: 'kg' });
});
test('切换单位往返：kg 显示值经 lb 再回 kg 一致', () => {
  // 模拟录入页切换逻辑：显示值 -(原单位)-> kg -(新单位)-> 显示值
  const kg = unit.toStoreFrom(100, 'kg');        // 100kg
  const lbShown = unit.toDisplayIn(kg, 'lb');     // 显示 lb
  const backKg = unit.toStoreFrom(lbShown, 'lb'); // 切回时存 kg
  assert.ok(Math.abs(backKg - 100) < 0.05);       // 往返误差在 round 容忍内
});

console.log(`\nAll ${passed} tests passed ✓`);

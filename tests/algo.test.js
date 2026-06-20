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
const exercises = require('../config/exercises.js');
const exerciseLib = require('../utils/exerciseLib.js');

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
test('lb 模式：输入 lb 落库 kg 取整到 0.5（见 record-and-deadlift-fixes）', () => {
  store.setSettings({ weightUnit: 'lb' });
  const kg = unit.toStore(100);            // 100 lb → 45.359 → 取整 45.5
  assert.strictEqual(kg, 45.5);
  assert.strictEqual(unit.step(), 5);
  assert.strictEqual(unit.label(), 'lb');
  store.setSettings({ weightUnit: 'kg' });
});

console.log('templateLib.groupTemplates:');
test('我的模板置顶、预设组随后、空桶剔除（record-to-template）', () => {
  const groups = templateLib.groupTemplates([
    { _id: 'a', name: '自建', group: '', order: 9 },
    { _id: 'b', name: '上肢', group: '二分化', order: 3 },
    { _id: 'c', name: '推日', group: '三分化', order: 0 }
  ]);
  assert.deepStrictEqual(groups.map((g) => g.name), ['我的模板', '三分化', '二分化']);
});
test('无自建模板时预设自然占顶（我的模板不输出）', () => {
  const groups = templateLib.groupTemplates([
    { _id: 'b', name: '上肢', group: '二分化', order: 3 },
    { _id: 'c', name: '推日', group: '三分化', order: 0 }
  ]);
  assert.deepStrictEqual(groups.map((g) => g.name), ['三分化', '二分化']);
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

console.log('templateLib.recordToTemplatePayload（记录→模板）:');
test('力量记录：每动作取 exerciseId + 组数 targetSets，不含重量/次数', () => {
  const p = templateLib.recordToTemplatePayload({
    name: '上肢A', type: 'strength',
    exercises: [
      { exerciseId: 'bench', name: '卧推', sets: [{ weight: 60, reps: 5 }, { weight: 60, reps: 5 }, { weight: 62.5, reps: 4 }, { weight: 62.5, reps: 4 }] },
      { exerciseId: 'db_row', name: '划船', sets: [{ weight: 30, reps: 10 }] }
    ]
  });
  assert.strictEqual(p.name, '上肢A（我的）');
  assert.strictEqual(p.group, '');
  assert.strictEqual(p.type, undefined); // 力量不写 type
  assert.deepStrictEqual(p.exercises, [
    { exerciseId: 'bench', targetSets: 4 },
    { exerciseId: 'db_row', targetSets: 1 }
  ]);
});
test('有氧记录：type:cardio，动作仅 exerciseId、无组次', () => {
  const p = templateLib.recordToTemplatePayload({
    name: '有氧', type: 'cardio',
    exercises: [{ exerciseId: 'run_outdoor', duration: 30, distance: 5 }]
  });
  assert.strictEqual(p.name, '有氧（我的）');
  assert.strictEqual(p.type, 'cardio');
  assert.deepStrictEqual(p.exercises, [{ exerciseId: 'run_outdoor' }]);
});
test('缺名/空动作不报错', () => {
  const p = templateLib.recordToTemplatePayload({});
  assert.strictEqual(p.name, '训练（我的）');
  assert.deepStrictEqual(p.exercises, []);
});
test('isPresetGroup：预设组不可删、我的模板（空 group）可删', () => {
  assert.strictEqual(templateLib.isPresetGroup('三分化'), true);
  assert.strictEqual(templateLib.isPresetGroup('二分化'), true);
  assert.strictEqual(templateLib.isPresetGroup('有氧'), true);
  assert.strictEqual(templateLib.isPresetGroup(''), false);
  assert.strictEqual(templateLib.isPresetGroup(undefined), false);
});

console.log('templateLib.planTemplateMigration:');
test('旧三件套归三分化且腿日改名蹲日（迁移只补 group，不补种）', () => {
  const plan = templateLib.planTemplateMigration([
    { _id: 't1', name: '推日', order: 0 },
    { _id: 't2', name: '拉日', order: 1 },
    { _id: 't3', name: '腿日', order: 2 }
  ]);
  assert.strictEqual(plan.needed, true);
  assert.deepStrictEqual(plan.updates.find((u) => u.id === 't1').data, { group: '三分化' });
  assert.deepStrictEqual(plan.updates.find((u) => u.id === 't3').data, { group: '三分化', name: '蹲日' });
  assert.strictEqual(plan.additions, undefined); // 补种改由 presetVersion 重刷负责
});
test('用户已改名的模板归我的模板（不动名称）', () => {
  const plan = templateLib.planTemplateMigration([{ _id: 't9', name: '我的腿部计划', order: 5 }]);
  assert.deepStrictEqual(plan.updates[0].data, { group: '' });
});
test('迁移幂等：全部有 group 后不再触发', () => {
  const plan = templateLib.planTemplateMigration([
    { _id: 't1', name: '推日', group: '三分化', order: 0 },
    { _id: 't9', name: '自建', group: '', order: 5 }
  ]);
  assert.strictEqual(plan.needed, false);
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
  assert.deepStrictEqual(d15.dots, ['#4F46E5']); // 推日·靛蓝（三分化蓝族）
});
test('一天多练超 3 个圆点折叠 +N', () => {
  const ws = ['推日', '拉日', '蹲日', '上肢'].map((n, i) => ({ _id: 'x' + i, date: '2026-06-10', name: n }));
  const byDate = calendar.aggregateByDate(ws);
  const cell = calendar.monthMatrix(2026, 5, byDate, '2026-06-01').find((c) => c.dateStr === '2026-06-10');
  assert.strictEqual(cell.dots.length, 3);
  assert.strictEqual(cell.more, 1);
});

console.log('unit 显式单位换算族（per-entry-input-unit）:');
test('toStoreFrom：kg 完整精度恒等 / lb→kg 取整到 0.5', () => {
  assert.strictEqual(unit.toStoreFrom(100, 'kg'), 100);
  assert.strictEqual(unit.toStoreFrom(100.3, 'kg'), 100.3);   // kg 不取整
  assert.strictEqual(unit.toStoreFrom(225, 'lb'), 102);       // 102.06 → 102.0
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

console.log('record-and-deadlift-fixes（问题2 重量 0.5 量化）:');
test('roundHalfKg：四舍五入到 0.5，整数返回数字（非 "33.0"）', () => {
  assert.strictEqual(unit.roundHalfKg(33.4), 33.5);
  assert.strictEqual(unit.roundHalfKg(33.2), 33);
  assert.strictEqual(unit.roundHalfKg(33.25), 33.5);
  assert.strictEqual(unit.roundHalfKg(33.75), 34);
  assert.strictEqual(unit.roundHalfKg(62.5), 62.5);
  assert.strictEqual(unit.roundHalfKg(33), 33);
  assert.strictEqual(typeof unit.roundHalfKg(33), 'number'); // 数字非字符串
});
test('toStoreFrom(lb) 落库取整到 0.5kg；kg 完整精度不变', () => {
  assert.strictEqual(unit.toStoreFrom(99, 'lb'), 45);     // 44.9056 → 45
  assert.strictEqual(unit.toStoreFrom(77, 'lb'), 35);     // 34.926 → 35
  assert.strictEqual(unit.toStoreFrom(60.3, 'kg'), 60.3); // kg 原样完整精度
});
test('toStore(lb) 同样取整到 0.5kg', () => {
  store.setSettings({ weightUnit: 'lb' });
  assert.strictEqual(unit.toStore(99), 45);
  store.setSettings({ weightUnit: 'kg' });
  assert.strictEqual(unit.toStore(60.3), 60.3);
});
test('toDisplayWeight：组重量量化到 0.5（含历史脏值），整数不带 .0，空透传', () => {
  assert.strictEqual(unit.toDisplayWeight(44.9056, 'kg'), 45);
  assert.strictEqual(unit.toDisplayWeight(33.0, 'kg'), 33);
  assert.strictEqual(unit.toDisplayWeight(62.5, 'kg'), 62.5);
  assert.strictEqual(unit.toDisplayWeight('', 'kg'), '');
  assert.strictEqual(unit.toDisplayWeight(null, 'kg'), null);
});
test('体重显示仍保留 0.1（不被 0.5 量化）', () => {
  store.setSettings({ weightUnit: 'kg' });
  assert.strictEqual(unit.toDisplay(70.3), 70.3);
});

console.log('record-and-deadlift-fixes（问题3 硬拉变式聚合）:');
test('dayLiftValue：单一变式取其主力工作组重量', () => {
  const w = { exercises: [{ exerciseId: 'rdl', sets: [{ weight: 100, reps: 8 }, { weight: 100, reps: 8 }] }] };
  assert.strictEqual(util.dayLiftValue(w, ['deadlift', 'rdl', 'stiff_leg_deadlift']), 100);
});
test('dayLiftValue：当日多变式取各自主力组的最大值', () => {
  const w = { exercises: [
    { exerciseId: 'deadlift', sets: [{ weight: 140, reps: 3 }, { weight: 140, reps: 3 }] },
    { exerciseId: 'stiff_leg_deadlift', sets: [{ weight: 100, reps: 8 }] }
  ] };
  assert.strictEqual(util.dayLiftValue(w, ['deadlift', 'rdl', 'stiff_leg_deadlift']), 140);
});
test('dayLiftValue：无匹配变式返回 null（断线不补零）', () => {
  const w = { exercises: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 5 }] }] };
  assert.strictEqual(util.dayLiftValue(w, ['deadlift', 'rdl', 'stiff_leg_deadlift']), null);
});
test('硬拉固定曲线配置含三变式 ids，且保留 id=deadlift 供详情跳转', () => {
  const dl = curveConfig.FIXED_CHARTS.find((c) => c.key === 'deadlift');
  assert.deepStrictEqual(dl.ids, ['deadlift', 'rdl', 'stiff_leg_deadlift']);
  assert.strictEqual(dl.id, 'deadlift');
});
test('familyFor：硬拉锚点展开家族，其余（含 rdl/直腿）保持单一', () => {
  assert.deepStrictEqual(curveConfig.familyFor('deadlift'), ['deadlift', 'rdl', 'stiff_leg_deadlift']);
  assert.deepStrictEqual(curveConfig.familyFor('rdl'), ['rdl']);
  assert.deepStrictEqual(curveConfig.familyFor('stiff_leg_deadlift'), ['stiff_leg_deadlift']);
  assert.deepStrictEqual(curveConfig.familyFor('bench'), ['bench']);
});

console.log('record-and-deadlift-fixes（问题1 0 重量组不污染聚合）:');
test('0 重量组不计入主力组/容量/PR（保留全部动作的前提）', () => {
  const sets = [{ weight: 0, reps: 0 }, { weight: 60, reps: 5 }];
  assert.strictEqual(util.mainWorkingWeight(sets), 60);
  assert.strictEqual(util.totalVolume([{ sets }]), 300);
  const prMap = util.buildPRMap([
    { _id: 'w1', date: '2026-01-01', exercises: [{ exerciseId: 'squat', sets: [{ weight: 0, reps: 0 }] }] }
  ]);
  assert.strictEqual(Object.keys(prMap).length, 0); // 全 0 动作不产生 PR
});

console.log('exercises 动作库稳定性:');
test('原 27 个内置 id 全部存在', () => {
  const ORIG = ['bench', 'incline_bench', 'db_bench', 'db_fly', 'dips',
    'deadlift', 'pullup', 'lat_pulldown', 'barbell_row', 'seated_row',
    'squat', 'rdl', 'leg_press', 'leg_ext', 'leg_curl', 'calf_raise',
    'ohp', 'db_press', 'lateral_raise', 'face_pull',
    'barbell_curl', 'db_curl', 'tricep_pushdown', 'close_grip_bench',
    'crunch', 'plank', 'hanging_leg_raise'];
  const ids = exercises.EXERCISES.map((e) => e.id);
  ORIG.forEach((id) => assert.ok(ids.includes(id), '缺少原始 id: ' + id));
});
test('id 唯一', () => {
  const ids = exercises.EXERCISES.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
test('MAIN_LIFTS 不变', () => {
  assert.deepStrictEqual(exercises.MAIN_LIFTS, ['bench', 'deadlift', 'squat']);
});
test('所有动作 category 都在 CATEGORIES 内（有氧除外，故意不入 CATEGORIES）', () => {
  exercises.EXERCISES.forEach((e) => {
    if (e.category === '有氧') return; // 有氧不参与力量分类/自建归类
    assert.ok(exercises.CATEGORIES.includes(e.category), '游离分类: ' + e.category);
  });
});

console.log('exerciseLib.searchExercises:');
test('名称命中', () => {
  store.setCache('custom_exercises', []);
  const r = exerciseLib.searchExercises('卧推');
  assert.ok(r.length > 0);
  assert.ok(r.some((e) => e.id === 'bench'));
});
test('别名命中（中英）', () => {
  assert.ok(exerciseLib.searchExercises('bench').some((e) => e.id === 'bench'));
  assert.ok(exerciseLib.searchExercises('rdl').some((e) => e.id === 'rdl'));
});
test('大小写无关', () => {
  assert.ok(exerciseLib.searchExercises('BENCH').some((e) => e.id === 'bench'));
});
test('空/空白关键词返回 null（不过滤）', () => {
  assert.strictEqual(exerciseLib.searchExercises(''), null);
  assert.strictEqual(exerciseLib.searchExercises('   '), null);
  assert.strictEqual(exerciseLib.searchExercises(null), null);
});
test('无命中返回空数组', () => {
  assert.deepStrictEqual(exerciseLib.searchExercises('zzzznotexist'), []);
});

console.log('exerciseLib 元数据透传与缺省回退:');
test('内置动作透传元数据', () => {
  const ex = exerciseLib.getExercise('bench');
  assert.strictEqual(ex.equipment, '杠铃');
  assert.strictEqual(ex.primaryMuscle, '胸大肌');
});
test('自建动作缺元数据不报错，getExercise/getName 正常', () => {
  store.setCache('custom_exercises', [{ _id: 'd1', id: 'cus_x', name: '我的动作' }]);
  const ex = exerciseLib.getExercise('cus_x');
  assert.strictEqual(ex.name, '我的动作');
  assert.strictEqual(ex.category, '其他');
  assert.strictEqual(ex.equipment, undefined); // 缺字段
  assert.strictEqual(exerciseLib.getName('cus_x'), '我的动作');
  assert.ok(exerciseLib.searchExercises('我的动作').some((e) => e.id === 'cus_x'));
  store.setCache('custom_exercises', []);
});
test('未知 id getName 回退占位', () => {
  assert.strictEqual(exerciseLib.getName('cus_gone'), '已删除动作');
  assert.strictEqual(exerciseLib.getExercise('cus_gone'), null);
});

console.log('util.formatLoad:');
test('weighted 返回数值字符串，空透传', () => {
  assert.strictEqual(util.formatLoad(50, 'weighted'), '50');
  assert.strictEqual(util.formatLoad(50), '50');
  assert.strictEqual(util.formatLoad('', 'weighted'), '');
  assert.strictEqual(util.formatLoad(null, 'weighted'), '');
});
test('bodyweight：0/空 → 自重', () => {
  assert.strictEqual(util.formatLoad(0, 'bodyweight'), '自重');
  assert.strictEqual(util.formatLoad('', 'bodyweight'), '自重');
  assert.strictEqual(util.formatLoad(null, 'bodyweight'), '自重');
});
test('bodyweight：正值 → 自重+X', () => {
  assert.strictEqual(util.formatLoad(20, 'bodyweight'), '自重+20');
});
test('bodyweight：负值 → 辅助−X（防御）', () => {
  assert.strictEqual(util.formatLoad(-15, 'bodyweight'), '辅助−15');
});

console.log('cardio（有氧）:');
test('7 个有氧活动齐备且 metrics 正确', () => {
  const cardio = exercises.EXERCISES.filter((e) => e.category === '有氧');
  assert.strictEqual(cardio.length, 7);
  assert.ok(cardio.every((e) => e.kind === 'cardio' && Array.isArray(e.metrics)));
  const stairs = cardio.find((e) => e.id === 'stairs');
  assert.deepStrictEqual(stairs.metrics, ['duration', 'floors']);
  assert.deepStrictEqual(exercises.getExercise('run_outdoor').metrics, ['duration', 'distance']);
});
test('有氧活动 id 不与力量冲突、全库 id 唯一', () => {
  const ids = exercises.EXERCISES.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
test('byCategory 中「有氧」排在末位', () => {
  const cats = Object.keys(exerciseLib.byCategory());
  assert.strictEqual(cats[cats.length - 1], '有氧');
});
test('有氧训练（无 sets）不进 PR / 容量', () => {
  const workouts = [
    { _id: 'c1', date: '2026-06-14', type: 'cardio', exercises: [{ exerciseId: 'run_outdoor', name: '室外跑步', duration: 30, distance: 5 }] }
  ];
  assert.deepStrictEqual(util.buildPRMap(workouts), {});
  assert.strictEqual(util.totalVolume(workouts[0].exercises), 0);
  assert.strictEqual(util.totalSets(workouts[0].exercises), 0);
});
test('日历按 type=cardio 归有氧色（不按名称）', () => {
  const byDate = calendar.aggregateByDate([
    { _id: 'c1', date: '2026-06-14', type: 'cardio', name: '有氧训练' }
  ]);
  assert.strictEqual(byDate['2026-06-14'][0].type.key, 'cardio');
  assert.strictEqual(byDate['2026-06-14'][0].type.color, '#EA580C');
});
test('力量训练仍按名称归类（不受 type 影响）', () => {
  const byDate = calendar.aggregateByDate([
    { _id: 's1', date: '2026-06-14', type: 'strength', name: '推日' }
  ]);
  assert.strictEqual(byDate['2026-06-14'][0].type.key, 'push');
});
test('typeOf：有氧按 type 优先，力量按名称，缺省归其他', () => {
  assert.strictEqual(calendar.typeOf({ name: '有氧训练', type: 'cardio' }).key, 'cardio');
  assert.strictEqual(calendar.typeOf({ name: '推日', type: 'strength' }).key, 'push');
  assert.strictEqual(calendar.typeOf({ name: '上肢A' }).key, 'upper');
  assert.strictEqual(calendar.typeOf({ name: '我的自定义' }).key, 'other');
  // 与日历同源：色值取自 TYPES
  assert.strictEqual(calendar.typeOf({ name: '推日' }).color, calendar.TYPES.push.color);
});
test('模板分组含「有氧」且排在二分化之后', () => {
  const groups = templateLib.groupTemplates([
    { _id: 'a', name: '有氧训练', group: '有氧', order: 5 },
    { _id: 'b', name: '推日', group: '三分化', order: 0 },
    { _id: 'c', name: '上肢', group: '二分化', order: 3 }
  ]);
  assert.deepStrictEqual(groups.map((g) => g.name), ['三分化', '二分化', '有氧']);
});

console.log('preset-program-upgrade（预设升级）:');
test('预设 8 套：三分化3 + 二分化4 + 有氧1', () => {
  const byGroup = {};
  PRESETS.forEach((t) => { byGroup[t.group] = (byGroup[t.group] || 0) + 1; });
  assert.strictEqual(PRESETS.length, 8);
  assert.strictEqual(byGroup['三分化'], 3);
  assert.strictEqual(byGroup['二分化'], 4);
  assert.strictEqual(byGroup['有氧'], 1);
});
test('二分化为 上肢A/下肢A/上肢B/下肢B', () => {
  const names = PRESETS.filter((t) => t.group === '二分化').map((t) => t.name);
  assert.deepStrictEqual(names, ['上肢A', '下肢A', '上肢B', '下肢B']);
});
test('力量预设动作带目标组次且 id 都在库', () => {
  const { getExercise } = exercises;
  PRESETS.forEach((t) => {
    t.exercises.forEach((e) => {
      assert.ok(getExercise(e.exerciseId), '缺动作: ' + e.exerciseId);
      if (t.group !== '有氧') {
        assert.ok(e.targetSets >= 1 && e.repLow >= 1 && e.repHigh >= e.repLow, '目标组次异常: ' + e.exerciseId);
      }
    });
  });
});
test('有氧预设动作无组次目标', () => {
  const cardio = PRESETS.find((t) => t.group === '有氧');
  assert.strictEqual(cardio.type, 'cardio');
  assert.ok(cardio.exercises.every((e) => e.targetSets === undefined));
});
test('预设 order 唯一递增', () => {
  const orders = PRESETS.map((t) => t.order);
  assert.strictEqual(new Set(orders).size, orders.length);
});
test('分组循证说明含二分化/三分化', () => {
  assert.ok(templateLib.GROUP_NOTES['二分化'] && templateLib.GROUP_NOTES['二分化'].length > 10);
  assert.ok(templateLib.GROUP_NOTES['三分化'] && templateLib.GROUP_NOTES['三分化'].length > 10);
});

console.log(`\nAll ${passed} tests passed ✓`);

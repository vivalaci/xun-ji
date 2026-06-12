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

console.log(`\nAll ${passed} tests passed ✓`);

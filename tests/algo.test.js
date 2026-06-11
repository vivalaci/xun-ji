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

console.log(`\nAll ${passed} tests passed ✓`);

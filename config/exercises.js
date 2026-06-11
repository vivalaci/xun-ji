// config/exercises.js —— 内置动作库
// 每个动作有稳定 id，训练记录里存 id，曲线按 id 聚合（不靠动作名字符串匹配）。
// isMainLift: true 的三大项与首页曲线绑定。
// 用户自定义动作存在云端 custom_exercises 集合，id 形如 cus_xxx。

const EXERCISES = [
  // 胸
  { id: 'bench',          name: '卧推',         category: '胸', isMainLift: true },
  { id: 'incline_bench',  name: '上斜卧推',     category: '胸' },
  { id: 'db_bench',       name: '哑铃卧推',     category: '胸' },
  { id: 'db_fly',         name: '哑铃飞鸟',     category: '胸' },
  { id: 'dips',           name: '双杠臂屈伸',   category: '胸' },

  // 背
  { id: 'deadlift',       name: '硬拉',         category: '背', isMainLift: true },
  { id: 'pullup',         name: '引体向上',     category: '背' },
  { id: 'lat_pulldown',   name: '高位下拉',     category: '背' },
  { id: 'barbell_row',    name: '杠铃划船',     category: '背' },
  { id: 'seated_row',     name: '坐姿划船',     category: '背' },

  // 腿
  { id: 'squat',          name: '深蹲',         category: '腿', isMainLift: true },
  { id: 'rdl',            name: '罗马尼亚硬拉', category: '腿' },
  { id: 'leg_press',      name: '腿举',         category: '腿' },
  { id: 'leg_ext',        name: '腿屈伸',       category: '腿' },
  { id: 'leg_curl',       name: '腿弯举',       category: '腿' },
  { id: 'calf_raise',     name: '提踵',         category: '腿' },

  // 肩
  { id: 'ohp',            name: '肩上推举',     category: '肩' },
  { id: 'db_press',       name: '哑铃推举',     category: '肩' },
  { id: 'lateral_raise',  name: '侧平举',       category: '肩' },
  { id: 'face_pull',      name: '面拉',         category: '肩' },

  // 手臂
  { id: 'barbell_curl',     name: '杠铃弯举',   category: '手臂' },
  { id: 'db_curl',          name: '哑铃弯举',   category: '手臂' },
  { id: 'tricep_pushdown',  name: '三头下压',   category: '手臂' },
  { id: 'close_grip_bench', name: '窄距卧推',   category: '手臂' },

  // 核心
  { id: 'crunch',           name: '卷腹',       category: '核心' },
  { id: 'plank',            name: '平板支撑',   category: '核心' },
  { id: 'hanging_leg_raise',name: '悬垂举腿',   category: '核心' }
];

// 三大项 id，首页曲线用
const MAIN_LIFTS = EXERCISES.filter((e) => e.isMainLift).map((e) => e.id); // ['bench','deadlift','squat']

// 分类顺序（动作选择面板左侧）
const CATEGORIES = ['胸', '背', '腿', '肩', '手臂', '核心'];

// 按 id 查动作
const byId = {};
EXERCISES.forEach((e) => { byId[e.id] = e; });

function getExercise(id) {
  return byId[id] || null;
}

module.exports = { EXERCISES, MAIN_LIFTS, CATEGORIES, getExercise };

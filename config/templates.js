// config/templates.js —— 预设训练模板（三分化 + 二分化 + 有氧，共 8 套）
// 首次启动写入 workout_templates；之后用户可编辑名称、动作、增删。
// group 分组标签；用户自建模板 group 为空串，归"我的模板"。
// 力量动作项带可缺省「目标组次」：targetSets / repLow / repHigh（按 docs/09 循证方案）。
// 有氧动作项无组次目标（kind:cardio）。每个动作只存 exerciseId，名称从动作库按 id 取。
// 升级此文件须同步 utils/db.js 的 PRESET_VERSION 以触发存量重刷。

// 力量动作项简写
function s(exerciseId, targetSets, repLow, repHigh) {
  return { exerciseId, targetSets, repLow, repHigh };
}

module.exports = [
  // ===== 三分化（推/拉/腿，docs/09 三）=====
  {
    name: '推日', group: '三分化', order: 0,
    exercises: [
      s('bench', 4, 5, 8),
      s('ohp', 3, 6, 10),
      s('incline_db_bench', 3, 8, 12),
      s('machine_chest_press', 3, 10, 12),
      s('lateral_raise', 4, 12, 20),
      s('tricep_pushdown', 3, 10, 15),
      s('overhead_extension', 3, 10, 15)
    ]
  },
  {
    name: '拉日', group: '三分化', order: 1,
    exercises: [
      s('deadlift', 3, 3, 5),
      s('pullup', 4, 6, 10),
      s('barbell_row', 4, 8, 10),
      s('seated_row', 3, 10, 12),
      s('face_pull', 3, 15, 20),
      s('barbell_curl', 3, 8, 12),
      s('hammer_curl', 3, 10, 12)
    ]
  },
  {
    name: '蹲日', group: '三分化', order: 2,
    exercises: [
      s('squat', 4, 5, 8),
      s('rdl', 3, 8, 12),
      s('leg_press', 3, 10, 15),
      s('leg_curl', 3, 10, 15),
      s('hip_thrust', 3, 8, 12),
      s('calf_raise', 4, 12, 20),
      s('hanging_leg_raise', 3, 12, 15)
    ]
  },

  // ===== 二分化（上A→下A→上B→下B，docs/09 二）=====
  {
    name: '上肢A', group: '二分化', order: 3,
    exercises: [
      s('bench', 4, 5, 8),
      s('barbell_row', 4, 6, 10),
      s('ohp', 3, 6, 10),
      s('lat_pulldown', 3, 8, 12),
      s('lateral_raise', 3, 12, 20),
      s('barbell_curl', 3, 8, 12),
      s('tricep_pushdown', 3, 10, 15)
    ]
  },
  {
    name: '下肢A', group: '二分化', order: 4,
    exercises: [
      s('squat', 4, 5, 8),
      s('rdl', 3, 8, 12),
      s('leg_press', 3, 10, 15),
      s('leg_curl', 3, 10, 15),
      s('calf_raise', 4, 10, 15),
      s('hanging_leg_raise', 3, 10, 15)
    ]
  },
  {
    name: '上肢B', group: '二分化', order: 5,
    exercises: [
      s('pullup', 4, 6, 10),
      s('incline_db_bench', 4, 8, 12),
      s('seated_db_press', 3, 8, 12),
      s('seated_row', 3, 10, 12),
      s('cable_fly', 3, 12, 15),
      s('lateral_raise', 4, 12, 20),
      s('hammer_curl', 3, 10, 12),
      s('overhead_extension', 3, 10, 15)
    ]
  },
  {
    name: '下肢B', group: '二分化', order: 6,
    exercises: [
      s('sumo_deadlift', 3, 3, 5),
      s('front_squat', 3, 6, 10),
      s('hip_thrust', 3, 8, 12),
      s('bulgarian_split_squat', 3, 8, 12),
      s('seated_leg_curl', 3, 10, 15),
      s('seated_calf_raise', 4, 12, 20),
      s('cable_crunch', 3, 12, 15)
    ]
  },

  // ===== 有氧 =====
  {
    name: '有氧训练', group: '有氧', type: 'cardio', order: 7,
    exercises: [
      { exerciseId: 'run_outdoor' } // 起步含室外跑步，用户可增删有氧活动
    ]
  }
];

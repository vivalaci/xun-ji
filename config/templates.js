// config/templates.js —— 预设训练模板（三分化 + 二分化，共 5 套）
// 首次启动时写入用户的 workout_templates 集合，之后用户可编辑名称、动作、增删模板。
// group 为分组标签（"三分化"/"二分化"）；用户自建模板 group 为空串，归"我的模板"。
// 每个动作只存 exerciseId，名称展示时从动作库取，保证 id 一致。

module.exports = [
  {
    name: '推日',
    group: '三分化',
    order: 0,
    exercises: [
      { exerciseId: 'bench' },          // 卧推（三大项）
      { exerciseId: 'incline_bench' },  // 上斜卧推
      { exerciseId: 'ohp' },            // 肩上推举
      { exerciseId: 'lateral_raise' },  // 侧平举
      { exerciseId: 'tricep_pushdown' } // 三头下压
    ]
  },
  {
    name: '拉日',
    group: '三分化',
    order: 1,
    exercises: [
      { exerciseId: 'deadlift' },     // 硬拉（三大项）
      { exerciseId: 'pullup' },       // 引体向上
      { exerciseId: 'barbell_row' },  // 杠铃划船
      { exerciseId: 'face_pull' },    // 面拉
      { exerciseId: 'db_curl' }       // 哑铃弯举
    ]
  },
  {
    name: '蹲日',
    group: '三分化',
    order: 2,
    exercises: [
      { exerciseId: 'squat' },      // 深蹲（三大项）
      { exerciseId: 'rdl' },        // 罗马尼亚硬拉
      { exerciseId: 'leg_press' },  // 腿举
      { exerciseId: 'leg_curl' },   // 腿弯举
      { exerciseId: 'calf_raise' }  // 提踵
    ]
  },
  {
    name: '上肢',
    group: '二分化',
    order: 3,
    exercises: [
      { exerciseId: 'bench' },          // 卧推（三大项）
      { exerciseId: 'barbell_row' },    // 杠铃划船
      { exerciseId: 'ohp' },            // 肩上推举
      { exerciseId: 'lat_pulldown' },   // 高位下拉
      { exerciseId: 'db_curl' },        // 哑铃弯举
      { exerciseId: 'tricep_pushdown' } // 三头下压
    ]
  },
  {
    name: '下肢',
    group: '二分化',
    order: 4,
    exercises: [
      { exerciseId: 'squat' },      // 深蹲（三大项）
      { exerciseId: 'rdl' },        // 罗马尼亚硬拉
      { exerciseId: 'leg_press' },  // 腿举
      { exerciseId: 'leg_curl' },   // 腿弯举
      { exerciseId: 'calf_raise' }  // 提踵
    ]
  }
];

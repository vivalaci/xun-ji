// config/exercises.js —— 内置动作库
// 每个动作有稳定 id，训练记录里存 id，曲线按 id 聚合（不靠动作名字符串匹配）。
// isMainLift: true 的三大项与首页曲线绑定。
// 用户自定义动作存在云端 custom_exercises 集合，id 形如 cus_xxx。
//
// —— 字段（除 id/name/category 外均可缺省）——
//   equipment        器械：杠铃 | 哑铃 | 绳索 | 器械 | 史密斯 | 自重
//   primaryMuscle    主肌群
//   secondaryMuscles 协同肌群数组
//   pattern          动作模式（水平推/垂直拉/深蹲/髋铰链/夹胸/伸膝… 仅用于展示，不入聚合）
//   aliases          别名数组（搜索用，含中英常见叫法）
//   loadType         'weighted'(默认,外部负荷) | 'bodyweight'(weight=额外负重,0=纯自重)
//
// —— 排序约定 ——
//   同分类内「多关节/复合」动作在前，「单关节/孤立」动作在后（科学训练优先大重量复合动作）。
//
// —— 分类细化（旧 → 新）——
//   腿 → 股四头肌 / 腘绳肌 / 臀 / 小腿；  手臂 → 肱二头肌 / 肱三头肌 / 前臂
//   胸/背/肩/核心 保留；斜方耸肩并入「背」。
//   注：category 仅用于分组展示，改归类不影响任何按 id 的历史/曲线/PR 聚合。
//   原 27 个动作 id 一律不变、不删（见 tests/algo.test.js 的稳定性回归）。

const EXERCISES = [
  // ===== 胸 =====
  { id: 'bench',               name: '卧推',           category: '胸', isMainLift: true, equipment: '杠铃', primaryMuscle: '胸大肌', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '水平推', aliases: ['平板卧推', 'bench', 'bench press'] },
  { id: 'incline_bench',       name: '上斜卧推',       category: '胸', equipment: '杠铃', primaryMuscle: '上胸', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '上斜推', aliases: ['上斜杠铃卧推', 'incline bench'] },
  { id: 'decline_bench',       name: '下斜卧推',       category: '胸', equipment: '杠铃', primaryMuscle: '下胸', secondaryMuscles: ['肱三头肌'], pattern: '下斜推', aliases: ['decline bench'] },
  { id: 'db_bench',            name: '哑铃卧推',       category: '胸', equipment: '哑铃', primaryMuscle: '胸大肌', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '水平推', aliases: ['dumbbell bench', 'db bench'] },
  { id: 'incline_db_bench',    name: '上斜哑铃卧推',   category: '胸', equipment: '哑铃', primaryMuscle: '上胸', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '上斜推', aliases: ['上斜哑铃推举', 'incline db press'] },
  { id: 'smith_bench',         name: '史密斯卧推',     category: '胸', equipment: '史密斯', primaryMuscle: '胸大肌', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '水平推', aliases: ['smith bench'] },
  { id: 'machine_chest_press', name: '器械推胸',       category: '胸', equipment: '器械', primaryMuscle: '胸大肌', secondaryMuscles: ['三角肌前束', '肱三头肌'], pattern: '水平推', aliases: ['坐姿推胸', 'chest press', 'machine press'] },
  { id: 'dips',                name: '双杠臂屈伸',     category: '胸', equipment: '自重', primaryMuscle: '下胸', secondaryMuscles: ['肱三头肌', '三角肌前束'], pattern: '垂直推', aliases: ['臂屈伸', 'dips'], loadType: 'bodyweight' },
  { id: 'pushup',              name: '俯卧撑',         category: '胸', equipment: '自重', primaryMuscle: '胸大肌', secondaryMuscles: ['肱三头肌', '三角肌前束'], pattern: '水平推', aliases: ['push up', 'pushup'], loadType: 'bodyweight' },
  { id: 'incline_db_fly',      name: '上斜哑铃飞鸟',   category: '胸', equipment: '哑铃', primaryMuscle: '上胸', secondaryMuscles: [], pattern: '夹胸', aliases: ['上斜飞鸟', 'incline fly'] },
  { id: 'db_fly',              name: '哑铃飞鸟',       category: '胸', equipment: '哑铃', primaryMuscle: '胸大肌', secondaryMuscles: [], pattern: '夹胸', aliases: ['飞鸟', 'dumbbell fly'] },
  { id: 'cable_fly',           name: '绳索夹胸',       category: '胸', equipment: '绳索', primaryMuscle: '胸大肌', secondaryMuscles: [], pattern: '夹胸', aliases: ['龙门夹胸', '绳索交叉', 'cable fly', 'cable crossover'] },
  { id: 'pec_deck',            name: '蝴蝶机夹胸',     category: '胸', equipment: '器械', primaryMuscle: '胸大肌', secondaryMuscles: [], pattern: '夹胸', aliases: ['夹胸机', 'pec deck'] },

  // ===== 背 =====
  { id: 'deadlift',            name: '硬拉',           category: '背', isMainLift: true, equipment: '杠铃', primaryMuscle: '背阔肌', secondaryMuscles: ['竖脊肌', '臀大肌', '腘绳肌'], pattern: '髋铰链', aliases: ['传统硬拉', 'deadlift'] },
  { id: 'rack_pull',           name: '架上拉',         category: '背', equipment: '杠铃', primaryMuscle: '背阔肌', secondaryMuscles: ['竖脊肌', '斜方肌'], pattern: '髋铰链', aliases: ['架上硬拉', 'rack pull'] },
  { id: 'pullup',              name: '引体向上',       category: '背', equipment: '自重', primaryMuscle: '背阔肌', secondaryMuscles: ['肱二头肌', '后三角肌'], pattern: '垂直拉', aliases: ['正手引体', 'pull up', 'pullup'], loadType: 'bodyweight' },
  { id: 'chinup',              name: '反手引体',       category: '背', equipment: '自重', primaryMuscle: '背阔肌', secondaryMuscles: ['肱二头肌'], pattern: '垂直拉', aliases: ['反握引体', 'chin up', 'chinup'], loadType: 'bodyweight' },
  { id: 'lat_pulldown',        name: '高位下拉',       category: '背', equipment: '器械', primaryMuscle: '背阔肌', secondaryMuscles: ['肱二头肌'], pattern: '垂直拉', aliases: ['高位下拉', 'lat pulldown'] },
  { id: 'barbell_row',         name: '杠铃划船',       category: '背', equipment: '杠铃', primaryMuscle: '背阔肌', secondaryMuscles: ['斜方肌', '肱二头肌'], pattern: '水平拉', aliases: ['俯身划船', 'barbell row', 'bent over row'] },
  { id: 't_bar_row',           name: '海豹划船',       category: '背', equipment: '器械', primaryMuscle: '背阔肌', secondaryMuscles: ['斜方肌', '肱二头肌'], pattern: '水平拉', aliases: ['海豹划船', '俯卧划船', 'seal row'] },
  { id: 'db_row',              name: '单臂哑铃划船',   category: '背', equipment: '哑铃', primaryMuscle: '背阔肌', secondaryMuscles: ['斜方肌', '肱二头肌'], pattern: '水平拉', aliases: ['哑铃划船', 'dumbbell row', 'one arm row'] },
  { id: 'seated_row',          name: '坐姿划船',       category: '背', equipment: '绳索', primaryMuscle: '背阔肌', secondaryMuscles: ['斜方肌', '肱二头肌'], pattern: '水平拉', aliases: ['坐姿绳索划船', 'seated row', 'cable row'] },
  { id: 'machine_row',         name: '器械划船',       category: '背', equipment: '器械', primaryMuscle: '背阔肌', secondaryMuscles: ['斜方肌', '肱二头肌'], pattern: '水平拉', aliases: ['坐姿器械划船', 'machine row'] },
  { id: 'straight_arm_pulldown', name: '直臂下拉',     category: '背', equipment: '绳索', primaryMuscle: '背阔肌', secondaryMuscles: [], pattern: '直臂下拉', aliases: ['直臂下压', 'straight arm pulldown'] },
  { id: 'shrug',               name: '杠铃耸肩',       category: '背', equipment: '杠铃', primaryMuscle: '斜方肌', secondaryMuscles: [], pattern: '耸肩', aliases: ['耸肩', 'shrug', 'barbell shrug'] },
  { id: 'db_shrug',            name: '哑铃耸肩',       category: '背', equipment: '哑铃', primaryMuscle: '斜方肌', secondaryMuscles: [], pattern: '耸肩', aliases: ['dumbbell shrug'] },
  { id: 'back_extension',      name: '山羊挺身',       category: '背', equipment: '自重', primaryMuscle: '竖脊肌', secondaryMuscles: ['臀大肌', '腘绳肌'], pattern: '髋伸', aliases: ['背伸展', '罗马椅', 'back extension', 'hyperextension'], loadType: 'bodyweight' },

  // ===== 肩 =====
  { id: 'ohp',                 name: '站姿肩上推举',   category: '肩', equipment: '杠铃', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['肩上推举', '站姿推举', '过头推举', 'ohp', 'overhead press'] },
  { id: 'seated_ohp',          name: '坐姿肩上推举',   category: '肩', equipment: '杠铃', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['坐姿肩上推举', '坐姿推举', '坐姿杠铃推举', 'seated ohp', 'seated overhead press'] },
  { id: 'db_press',            name: '哑铃推举',       category: '肩', equipment: '哑铃', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['哑铃肩推', 'dumbbell shoulder press'] },
  { id: 'seated_db_press',     name: '坐姿哑铃推举',   category: '肩', equipment: '哑铃', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['seated db press'] },
  { id: 'arnold_press',        name: '阿诺德推举',     category: '肩', equipment: '哑铃', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['arnold press'] },
  { id: 'machine_shoulder_press', name: '器械推肩',    category: '肩', equipment: '器械', primaryMuscle: '三角肌前束', secondaryMuscles: ['三角肌中束', '肱三头肌'], pattern: '垂直推', aliases: ['坐姿器械推肩', 'machine shoulder press'] },
  { id: 'upright_row',         name: '直立划船',       category: '肩', equipment: '杠铃', primaryMuscle: '三角肌中束', secondaryMuscles: ['斜方肌'], pattern: '垂直拉', aliases: ['直立提拉', 'upright row'] },
  { id: 'lateral_raise',       name: '侧平举',         category: '肩', equipment: '哑铃', primaryMuscle: '三角肌中束', secondaryMuscles: [], pattern: '侧举', aliases: ['哑铃侧平举', 'lateral raise', 'side raise'] },
  { id: 'cable_lateral_raise', name: '绳索侧平举',     category: '肩', equipment: '绳索', primaryMuscle: '三角肌中束', secondaryMuscles: [], pattern: '侧举', aliases: ['cable lateral raise'] },
  { id: 'front_raise',         name: '前平举',         category: '肩', equipment: '哑铃', primaryMuscle: '三角肌前束', secondaryMuscles: [], pattern: '前举', aliases: ['哑铃前平举', 'front raise'] },
  { id: 'rear_delt_fly',       name: '后束反向飞鸟',   category: '肩', equipment: '哑铃', primaryMuscle: '三角肌后束', secondaryMuscles: [], pattern: '后束', aliases: ['后束飞鸟', '反向飞鸟', 'rear delt fly', 'reverse fly'] },
  { id: 'face_pull',           name: '面拉',           category: '肩', equipment: '绳索', primaryMuscle: '三角肌后束', secondaryMuscles: ['斜方肌'], pattern: '后束', aliases: ['面拉', 'face pull'] },

  // ===== 肱二头肌 =====
  { id: 'barbell_curl',        name: '杠铃弯举',       category: '肱二头肌', equipment: '杠铃', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['barbell curl'] },
  { id: 'ez_bar_curl',         name: 'EZ杠弯举',       category: '肱二头肌', equipment: '杠铃', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['ez bar curl', 'ez弯举'] },
  { id: 'db_curl',             name: '哑铃弯举',       category: '肱二头肌', equipment: '哑铃', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['dumbbell curl'] },
  { id: 'incline_db_curl',     name: '斜板哑铃弯举',   category: '肱二头肌', equipment: '哑铃', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['斜托弯举', 'incline curl'] },
  { id: 'hammer_curl',         name: '锤式弯举',       category: '肱二头肌', equipment: '哑铃', primaryMuscle: '肱肌', secondaryMuscles: ['肱二头肌', '肱桡肌'], pattern: '肘屈', aliases: ['hammer curl'] },
  { id: 'preacher_curl',       name: '牧师凳弯举',     category: '肱二头肌', equipment: '器械', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['牧师弯举', 'preacher curl'] },
  { id: 'cable_curl',          name: '绳索弯举',       category: '肱二头肌', equipment: '绳索', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['cable curl'] },
  { id: 'concentration_curl',  name: '集中弯举',       category: '肱二头肌', equipment: '哑铃', primaryMuscle: '肱二头肌', secondaryMuscles: [], pattern: '肘屈', aliases: ['concentration curl'] },

  // ===== 肱三头肌 =====
  { id: 'close_grip_bench',    name: '窄距卧推',       category: '肱三头肌', equipment: '杠铃', primaryMuscle: '肱三头肌', secondaryMuscles: ['胸大肌', '三角肌前束'], pattern: '水平推', aliases: ['窄握卧推', 'close grip bench'] },
  { id: 'bench_dip',           name: '凳上臂屈伸',     category: '肱三头肌', equipment: '自重', primaryMuscle: '肱三头肌', secondaryMuscles: ['三角肌前束'], pattern: '垂直推', aliases: ['凳上反屈伸', 'bench dip'], loadType: 'bodyweight' },
  { id: 'tricep_pushdown',     name: '三头下压',       category: '肱三头肌', equipment: '绳索', primaryMuscle: '肱三头肌', secondaryMuscles: [], pattern: '肘伸', aliases: ['三头下压', 'tricep pushdown'] },
  { id: 'rope_pushdown',       name: '绳索下压',       category: '肱三头肌', equipment: '绳索', primaryMuscle: '肱三头肌', secondaryMuscles: [], pattern: '肘伸', aliases: ['绳索三头下压', 'rope pushdown'] },
  { id: 'overhead_extension',  name: '过顶臂屈伸',     category: '肱三头肌', equipment: '哑铃', primaryMuscle: '肱三头肌', secondaryMuscles: [], pattern: '肘伸', aliases: ['过顶臂屈伸', 'overhead extension'] },
  { id: 'skullcrusher',        name: '仰卧臂屈伸',     category: '肱三头肌', equipment: '杠铃', primaryMuscle: '肱三头肌', secondaryMuscles: [], pattern: '肘伸', aliases: ['碎颅式', 'skullcrusher', 'lying tricep extension'] },
  { id: 'db_kickback',         name: '哑铃后撑',       category: '肱三头肌', equipment: '哑铃', primaryMuscle: '肱三头肌', secondaryMuscles: [], pattern: '肘伸', aliases: ['俯身臂屈伸', 'kickback'] },

  // ===== 前臂 =====
  { id: 'reverse_curl',        name: '反握弯举',       category: '前臂', equipment: '杠铃', primaryMuscle: '肱桡肌', secondaryMuscles: ['前臂伸肌'], pattern: '肘屈', aliases: ['正握弯举', 'reverse curl'] },
  { id: 'wrist_curl',          name: '腕弯举',         category: '前臂', equipment: '杠铃', primaryMuscle: '前臂屈肌', secondaryMuscles: [], pattern: '腕屈', aliases: ['wrist curl'] },
  { id: 'reverse_wrist_curl',  name: '反向腕弯举',     category: '前臂', equipment: '杠铃', primaryMuscle: '前臂伸肌', secondaryMuscles: [], pattern: '腕伸', aliases: ['reverse wrist curl'] },
  { id: 'farmer_walk',         name: '农夫行走',       category: '前臂', equipment: '哑铃', primaryMuscle: '前臂', secondaryMuscles: ['斜方肌', '核心'], pattern: '握力', aliases: ['农夫走', 'farmer walk', 'farmer carry'] },

  // ===== 股四头肌 =====
  { id: 'squat',               name: '深蹲',           category: '股四头肌', isMainLift: true, equipment: '杠铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌', '竖脊肌'], pattern: '深蹲', aliases: ['杠铃深蹲', '背蹲', 'squat', 'back squat'] },
  { id: 'front_squat',         name: '前蹲',           category: '股四头肌', equipment: '杠铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌', '核心'], pattern: '深蹲', aliases: ['前置深蹲', 'front squat'] },
  { id: 'hack_squat',          name: '哈克深蹲',       category: '股四头肌', equipment: '器械', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '深蹲', aliases: ['hack squat'] },
  { id: 'smith_squat',         name: '史密斯深蹲',     category: '股四头肌', equipment: '史密斯', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '深蹲', aliases: ['smith squat'] },
  { id: 'leg_press',           name: '腿举',           category: '股四头肌', equipment: '器械', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '深蹲', aliases: ['倒蹬', 'leg press'] },
  { id: 'goblet_squat',        name: '高脚杯深蹲',     category: '股四头肌', equipment: '哑铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌', '核心'], pattern: '深蹲', aliases: ['酒杯深蹲', 'goblet squat'] },
  { id: 'bulgarian_split_squat', name: '保加利亚分腿蹲', category: '股四头肌', equipment: '哑铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '弓步', aliases: ['保加利亚蹲', 'bulgarian split squat'] },
  { id: 'lunge',               name: '箭步蹲',         category: '股四头肌', equipment: '哑铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '弓步', aliases: ['弓步蹲', 'lunge'] },
  { id: 'walking_lunge',       name: '行走箭步蹲',     category: '股四头肌', equipment: '哑铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '弓步', aliases: ['行走弓步', 'walking lunge'] },
  { id: 'step_up',             name: '上踏步',         category: '股四头肌', equipment: '哑铃', primaryMuscle: '股四头肌', secondaryMuscles: ['臀大肌'], pattern: '弓步', aliases: ['登台阶', 'step up'] },
  { id: 'leg_ext',             name: '腿屈伸',         category: '股四头肌', equipment: '器械', primaryMuscle: '股四头肌', secondaryMuscles: [], pattern: '伸膝', aliases: ['腿屈伸', '坐姿腿屈伸', 'leg extension'] },

  // ===== 腘绳肌 =====
  { id: 'rdl',                 name: '罗马尼亚硬拉',   category: '腘绳肌', equipment: '杠铃', primaryMuscle: '腘绳肌', secondaryMuscles: ['臀大肌', '竖脊肌'], pattern: '髋铰链', aliases: ['罗马尼亚硬拉', 'rdl', 'romanian deadlift'] },
  { id: 'stiff_leg_deadlift',  name: '直腿硬拉',       category: '腘绳肌', equipment: '杠铃', primaryMuscle: '腘绳肌', secondaryMuscles: ['臀大肌', '竖脊肌'], pattern: '髋铰链', aliases: ['直腿硬拉', 'stiff leg deadlift'] },
  { id: 'good_morning',        name: '早安式',         category: '腘绳肌', equipment: '杠铃', primaryMuscle: '腘绳肌', secondaryMuscles: ['臀大肌', '竖脊肌'], pattern: '髋铰链', aliases: ['早安式体前屈', 'good morning'] },
  { id: 'glute_ham_raise',     name: 'GHR俯卧挺身',    category: '腘绳肌', equipment: '自重', primaryMuscle: '腘绳肌', secondaryMuscles: ['臀大肌'], pattern: '屈膝', aliases: ['glute ham raise', 'ghr'], loadType: 'bodyweight' },
  { id: 'leg_curl',            name: '俯卧腿弯举',     category: '腘绳肌', equipment: '器械', primaryMuscle: '腘绳肌', secondaryMuscles: [], pattern: '屈膝', aliases: ['腿弯举', '俯卧腿弯举', 'leg curl', 'lying leg curl'] },
  { id: 'seated_leg_curl',     name: '坐姿腿弯举',     category: '腘绳肌', equipment: '器械', primaryMuscle: '腘绳肌', secondaryMuscles: [], pattern: '屈膝', aliases: ['seated leg curl'] },
  { id: 'nordic_curl',         name: '北欧腿弯举',     category: '腘绳肌', equipment: '自重', primaryMuscle: '腘绳肌', secondaryMuscles: [], pattern: '屈膝', aliases: ['北欧挺', 'nordic curl'], loadType: 'bodyweight' },

  // ===== 臀 =====
  { id: 'hip_thrust',          name: '臀推',           category: '臀', equipment: '杠铃', primaryMuscle: '臀大肌', secondaryMuscles: ['腘绳肌'], pattern: '髋伸', aliases: ['杠铃臀推', 'hip thrust'] },
  { id: 'sumo_deadlift',       name: '相扑硬拉',       category: '臀', equipment: '杠铃', primaryMuscle: '臀大肌', secondaryMuscles: ['股四头肌', '内收肌', '背阔肌'], pattern: '髋铰链', aliases: ['相扑硬拉', 'sumo deadlift'] },
  { id: 'glute_bridge',        name: '臀桥',           category: '臀', equipment: '杠铃', primaryMuscle: '臀大肌', secondaryMuscles: ['腘绳肌'], pattern: '髋伸', aliases: ['臀桥', 'glute bridge'] },
  { id: 'cable_pull_through',  name: '绳索髋拉',       category: '臀', equipment: '绳索', primaryMuscle: '臀大肌', secondaryMuscles: ['腘绳肌'], pattern: '髋伸', aliases: ['绳索前拉', 'pull through'] },
  { id: 'cable_kickback',      name: '绳索后踢腿',     category: '臀', equipment: '绳索', primaryMuscle: '臀大肌', secondaryMuscles: [], pattern: '髋伸', aliases: ['后踢腿', 'cable kickback'] },
  { id: 'hip_abduction',       name: '坐姿髋外展',     category: '臀', equipment: '器械', primaryMuscle: '臀中肌', secondaryMuscles: [], pattern: '髋外展', aliases: ['髋外展', 'hip abduction'] },

  // ===== 小腿 =====
  { id: 'calf_raise',          name: '站姿提踵',       category: '小腿', equipment: '器械', primaryMuscle: '腓肠肌', secondaryMuscles: ['比目鱼肌'], pattern: '提踵', aliases: ['提踵', '站姿提踵', 'calf raise'] },
  { id: 'seated_calf_raise',   name: '坐姿提踵',       category: '小腿', equipment: '器械', primaryMuscle: '比目鱼肌', secondaryMuscles: ['腓肠肌'], pattern: '提踵', aliases: ['seated calf raise'] },
  { id: 'leg_press_calf_raise', name: '腿举机提踵',    category: '小腿', equipment: '器械', primaryMuscle: '腓肠肌', secondaryMuscles: ['比目鱼肌'], pattern: '提踵', aliases: ['倒蹬提踵', 'leg press calf raise'] },

  // ===== 核心 =====
  { id: 'hanging_leg_raise',   name: '悬垂举腿',       category: '核心', equipment: '自重', primaryMuscle: '腹直肌', secondaryMuscles: ['髋屈肌'], pattern: '核心屈曲', aliases: ['悬垂举腿', 'hanging leg raise'], loadType: 'bodyweight' },
  { id: 'ab_wheel',            name: '健腹轮',         category: '核心', equipment: '自重', primaryMuscle: '腹直肌', secondaryMuscles: ['核心'], pattern: '抗伸展', aliases: ['腹肌轮', 'ab wheel', 'ab rollout'], loadType: 'bodyweight' },
  { id: 'cable_crunch',        name: '绳索卷腹',       category: '核心', equipment: '绳索', primaryMuscle: '腹直肌', secondaryMuscles: [], pattern: '核心屈曲', aliases: ['跪姿绳索卷腹', 'cable crunch'] },
  { id: 'crunch',              name: '卷腹',           category: '核心', equipment: '自重', primaryMuscle: '腹直肌', secondaryMuscles: [], pattern: '核心屈曲', aliases: ['卷腹', 'crunch'], loadType: 'bodyweight' },
  { id: 'leg_raise',          name: '仰卧举腿',       category: '核心', equipment: '自重', primaryMuscle: '腹直肌', secondaryMuscles: ['髋屈肌'], pattern: '核心屈曲', aliases: ['仰卧举腿', 'lying leg raise'], loadType: 'bodyweight' },
  { id: 'russian_twist',       name: '俄罗斯转体',     category: '核心', equipment: '自重', primaryMuscle: '腹斜肌', secondaryMuscles: [], pattern: '核心抗旋', aliases: ['俄罗斯转体', 'russian twist'], loadType: 'bodyweight' },
  { id: 'plank',               name: '平板支撑',       category: '核心', equipment: '自重', primaryMuscle: '腹直肌', secondaryMuscles: ['核心'], pattern: '抗伸展', aliases: ['平板支撑', 'plank'], loadType: 'bodyweight' },
  { id: 'side_plank',          name: '侧平板',         category: '核心', equipment: '自重', primaryMuscle: '腹斜肌', secondaryMuscles: [], pattern: '抗侧屈', aliases: ['侧平板支撑', 'side plank'], loadType: 'bodyweight' },

  // ===== 有氧（kind:cardio；指标 metrics：距离类=时长+距离，爬楼梯=时长+层数；无 sets，不入力量聚合） =====
  { id: 'run_outdoor',  name: '室外跑步', category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['户外跑', '路跑', 'outdoor run'] },
  { id: 'run_indoor',   name: '室内跑步', category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['跑步机', '机跑', 'treadmill'] },
  { id: 'walk_outdoor', name: '室外走路', category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['户外走', '健走', 'outdoor walk'] },
  { id: 'walk_indoor',  name: '室内走路', category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['室内健走', 'indoor walk'] },
  { id: 'elliptical',   name: '椭圆机',   category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['椭圆仪', 'elliptical'] },
  { id: 'cycling',      name: '单车',     category: '有氧', kind: 'cardio', metrics: ['duration', 'distance'], aliases: ['骑行', '动感单车', 'bike', 'cycling'] },
  { id: 'stairs',       name: '爬楼梯',   category: '有氧', kind: 'cardio', metrics: ['duration', 'floors'], aliases: ['爬楼', '楼梯机', 'stairs', 'stair climber'] }
];

// 三大项 id，首页曲线用
const MAIN_LIFTS = EXERCISES.filter((e) => e.isMainLift).map((e) => e.id); // ['bench','deadlift','squat']

// 分类顺序（动作选择面板左侧）：复合大肌群在前，细分肌群在后
const CATEGORIES = ['胸', '背', '肩', '肱二头肌', '肱三头肌', '前臂', '股四头肌', '腘绳肌', '臀', '小腿', '核心'];

// 按 id 查动作
const byId = {};
EXERCISES.forEach((e) => { byId[e.id] = e; });

function getExercise(id) {
  return byId[id] || null;
}

module.exports = { EXERCISES, MAIN_LIFTS, CATEGORIES, getExercise };

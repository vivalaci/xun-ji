// config/exerciseMedia.js —— 动作示意图（微信云存储）
// 取图规则见 utils/exerciseMedia.js：<PREFIX>/<id>/0.png|1.png|2.png（循环帧）与 thumb.png（列表缩略图）。
// 素材由 tools/media/build.js 从 assets/exercise-media/<id>/*.svg 生成，按 <动作id>/ 文件夹上传到云存储。
// 来源：bryllim/workout-guide（基于 Everkinetic），已重新着色，CC BY-SA 4.0（署名见使用说明「致谢」）。

// 云存储前缀 = 动作文件夹所在位置（末尾不带 /）。当前各动作文件夹直接放在存储桶根目录：
//   cloud://<环境ID>.<存储桶>/<id>/0.png
// 若日后改放到子目录，把子目录名接在前缀后面即可（如 '.../exercise-media'）。
// 留空 = 未上传：所有动作按「无图」处理，页面不显示示意图、不报错。
const PREFIX = 'cloud://cloud1-d2g9e9fcu17d998fe.636c-cloud1-d2g9e9fcu17d998fe-1442218470';

// 有图动作清单：id → 帧数。只列出已上传素材的内置动作；
// 自建（cus_）/全局（gbl_）动作、seal_row 等不在清单即视为无图，新增内置动作忘记配图也不会破图。
const MEDIA = {
  // 胸
  bench: 3, incline_bench: 3, decline_bench: 3, db_bench: 3, incline_db_bench: 3, smith_bench: 3,
  machine_chest_press: 3, dips: 3, pushup: 3, incline_db_fly: 3, db_fly: 3, cable_fly: 3, pec_deck: 3,
  // 背
  deadlift: 3, rack_pull: 3, pullup: 3, chinup: 3, lat_pulldown: 3, barbell_row: 3, t_bar_row: 3,
  db_row: 3, seated_row: 3, machine_row: 3, straight_arm_pulldown: 3, shrug: 3, db_shrug: 3, back_extension: 3,
  // 肩
  ohp: 3, seated_ohp: 3, db_press: 3, seated_db_press: 3, arnold_press: 3, machine_shoulder_press: 3,
  upright_row: 3, lateral_raise: 3, cable_lateral_raise: 3, front_raise: 3, rear_delt_fly: 3, face_pull: 3,
  // 肱二头肌
  barbell_curl: 3, ez_bar_curl: 3, db_curl: 3, incline_db_curl: 3, hammer_curl: 3, preacher_curl: 3,
  cable_curl: 3, concentration_curl: 3,
  // 肱三头肌
  close_grip_bench: 3, bench_dip: 3, tricep_pushdown: 3, rope_pushdown: 3, overhead_extension: 3,
  skullcrusher: 3, db_kickback: 3,
  // 前臂
  reverse_curl: 3, wrist_curl: 3, reverse_wrist_curl: 3, farmer_walk: 3,
  // 股四头肌
  squat: 3, front_squat: 3, hack_squat: 3, smith_squat: 3, leg_press: 3, goblet_squat: 3,
  bulgarian_split_squat: 3, lunge: 3, walking_lunge: 3, step_up: 3, leg_ext: 3,
  // 腘绳肌
  rdl: 3, stiff_leg_deadlift: 3, good_morning: 3, glute_ham_raise: 3, leg_curl: 3, seated_leg_curl: 3, nordic_curl: 3,
  // 臀
  hip_thrust: 3, sumo_deadlift: 3, glute_bridge: 3, cable_pull_through: 3, cable_kickback: 3, hip_abduction: 3,
  // 小腿
  calf_raise: 3, seated_calf_raise: 3, leg_press_calf_raise: 3,
  // 核心
  hanging_leg_raise: 3, ab_wheel: 3, cable_crunch: 3, crunch: 3, leg_raise: 3, russian_twist: 3, plank: 3, side_plank: 3,
  // 有氧
  run_outdoor: 3, run_indoor: 3, walk_outdoor: 3, walk_indoor: 3, elliptical: 3, cycling: 3, stairs: 3
};

module.exports = { PREFIX, MEDIA };

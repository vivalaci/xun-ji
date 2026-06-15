// pages/workout/edit.js —— 新建 / 编辑训练
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const { EXERCISES, CATEGORIES, getExercise } = require('../../config/exercises.js');
const lib = require('../../utils/exerciseLib.js');
const templateLib = require('../../utils/templateLib.js');

Page({
  data: {
    id: '',                  // 有值=编辑
    date: util.formatDate(),
    templateId: '',
    name: '',
    note: '',
    exercises: [],           // [{ exerciseId, name, sets:[{weight, reps}] }]，weight/reps 为显示单位

    // 模板选择
    stage: 'pickTemplate',   // pickTemplate | editing
    templates: [],           // 平铺列表（按 _id 查）
    templateGroups: [],      // 按组分节：[{ name, items }]

    // 动作选择面板
    pickerVisible: false,
    categories: CATEGORIES,
    activeCategory: 0,
    libByCategory: {},       // category -> [{id,name}]
    customName: '',

    // 每个动作各自的输入单位（默认主单位，可逐动作切换；存库仍恒 kg）
    unitOptions: ['kg', 'lb'],
    saving: false
  },

  async onLoad(options) {
    // 预处理动作库分类
    const libByCategory = {};
    CATEGORIES.forEach((c) => { libByCategory[c] = EXERCISES.filter((e) => e.category === c); });
    this.setData({ libByCategory });

    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑训练' });
      this.loadExisting(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新建训练' });
      try {
        const templates = await db.ensureTemplatesSeeded();
        this.setData({ templates, templateGroups: templateLib.groupTemplates(templates) });
      } catch (e) {
        // 云环境未就绪时也能用空白模板
        this.setData({ templates: [], templateGroups: [] });
      }
    }
  },

  loadExisting(id) {
    const w = db.getCache(db.COLL.WORKOUTS).find((r) => r._id === id);
    if (!w) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      return;
    }
    const mainUnit = unit.currentUnit();
    const exercises = (w.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      unit: mainUnit,
      sets: (ex.sets || []).map((s) => ({
        weight: unit.toDisplayIn(s.weight, mainUnit),
        reps: s.reps
      }))
    }));
    this.setData({
      id,
      date: w.date,
      templateId: w.templateId || '',
      name: w.name || '',
      note: w.note || '',
      exercises,
      stage: 'editing'
    });
  },

  // ---- 选模板 ----
  pickTemplate(e) {
    const tpl = this.data.templates.find((t) => t._id === e.currentTarget.dataset.id);
    if (!tpl) return;
    const exercises = this.buildFromTemplate(tpl);
    this.setData({
      templateId: tpl._id,
      name: tpl.name,
      exercises,
      stage: 'editing'
    });
  },
  pickBlank() {
    this.setData({ templateId: '', name: '训练', exercises: [], stage: 'editing' });
  },

  // 按模板生成动作，并用「上一次同类训练」预填重量/次数
  buildFromTemplate(tpl) {
    const workouts = db.getCache(db.COLL.WORKOUTS); // 已按 date desc
    const lastSame = workouts.find((w) => w.templateId === tpl._id);
    const mainUnit = unit.currentUnit();
    return (tpl.exercises || []).map((te) => {
      const ex = getExercise(te.exerciseId);
      const name = ex ? ex.name : te.exerciseId;
      let sets = [{ weight: '', reps: '' }];
      if (lastSame) {
        const prev = (lastSame.exercises || []).find((x) => x.exerciseId === te.exerciseId);
        if (prev && prev.sets && prev.sets.length) {
          sets = prev.sets.map((s) => ({ weight: unit.toDisplayIn(s.weight, mainUnit), reps: s.reps }));
        }
      }
      return { exerciseId: te.exerciseId, name, unit: mainUnit, sets };
    });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  // 切换某个动作的输入单位：就地把该动作各组重量从原单位换算到新单位（保持实际重量不变）
  onSwitchExerciseUnit(e) {
    const { i, unit: newUnit } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    const ex = exercises[i];
    if (!ex || ex.unit === newUnit) return;
    const old = ex.unit;
    ex.sets = ex.sets.map((s) => {
      if (s.weight === '' || s.weight == null) return { weight: s.weight, reps: s.reps };
      return { weight: unit.toDisplayIn(unit.toStoreFrom(s.weight, old), newUnit), reps: s.reps };
    });
    ex.unit = newUnit;
    this.setData({ exercises });
  },

  // ---- 组编辑 ----
  addSet(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    const last = exercises[i].sets[exercises[i].sets.length - 1] || { weight: '', reps: '' };
    exercises[i].sets.push({ weight: last.weight, reps: last.reps }); // 沿用上一组
    this.setData({ exercises });
  },
  removeSet(e) {
    const { i, j } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    exercises[i].sets.splice(j, 1);
    if (exercises[i].sets.length === 0) exercises[i].sets.push({ weight: '', reps: '' });
    this.setData({ exercises });
  },
  onSetInput(e) {
    const { i, j, field } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    exercises[i].sets[j][field] = e.detail.value;
    this.setData({ exercises });
  },
  // 步进按钮：field=weight 步进 unit.step()，field=reps 步进 1
  stepValue(e) {
    const { i, j, field, dir } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    const cur = Number(exercises[i].sets[j][field]) || 0;
    const delta = field === 'weight' ? unit.stepFor(exercises[i].unit) : 1;
    let next = cur + delta * (dir === 'up' ? 1 : -1);
    if (next < 0) next = 0;
    exercises[i].sets[j][field] = next;
    this.setData({ exercises });
  },
  removeExercise(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    exercises.splice(i, 1);
    this.setData({ exercises });
  },

  // ---- 动作选择 ----
  openPicker() { this.setData({ pickerVisible: true }); },
  closePicker() { this.setData({ pickerVisible: false, customName: '' }); },
  switchCategory(e) { this.setData({ activeCategory: e.currentTarget.dataset.index }); },
  onCustomInput(e) { this.setData({ customName: e.detail.value }); },
  pickFromLib(e) {
    const { id, name } = e.currentTarget.dataset;
    this.addExercise(id, name);
  },
  addCustom() {
    const name = this.data.customName.trim();
    if (!name) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return; }
    // 迭代二：自建动作持久化到动作库，使其在动作库/详情页可解析名称
    const id = lib.genCustomId();
    db.saveLocalFirst(lib.CUSTOM_COLL, { id, name, category: '其他' });
    this.addExercise(id, name);
  },
  addExercise(exerciseId, name) {
    const exercises = this.data.exercises.concat({
      exerciseId, name, unit: unit.currentUnit(), sets: [{ weight: '', reps: '' }]
    });
    this.setData({ exercises, pickerVisible: false, customName: '' });
  },

  // ---- 保存 ----
  onSave() {
    if (this.data.exercises.length === 0) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });

    const exercises = this.data.exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets
          .filter((s) => s.weight !== '' || s.reps !== '')
          .map((s) => ({ weight: unit.toStoreFrom(s.weight, ex.unit), reps: Number(s.reps) || 0 }))
      }))
      .filter((ex) => ex.sets.length > 0);

    if (exercises.length === 0) {
      this.setData({ saving: false });
      wx.showToast({ title: '请填写组数据', icon: 'none' });
      return;
    }

    const payload = {
      date: this.data.date,
      templateId: this.data.templateId || null,
      name: (this.data.name || '训练').trim(),
      note: (this.data.note || '').trim(),
      exercises
    };

    try {
      if (this.data.id) db.updateLocalFirst(db.COLL.WORKOUTS, this.data.id, payload);
      else db.saveLocalFirst(db.COLL.WORKOUTS, payload);
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error(e);
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});

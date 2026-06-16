// pages/workout/edit.js —— 新建 / 编辑训练（力量 strength / 有氧 cardio 双路径）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const lib = require('../../utils/exerciseLib.js');
const templateLib = require('../../utils/templateLib.js');

Page({
  data: {
    id: '',                  // 有值=编辑
    date: util.formatDate(),
    templateId: '',
    name: '',
    note: '',
    workoutType: 'strength', // strength | cardio
    exercises: [],           // strength: {exerciseId,name,loadType,unit,sets[]}；cardio: {exerciseId,name,kind,metric2,label2,duration,secondVal}

    // 模板选择
    stage: 'pickTemplate',
    templates: [],
    templateGroups: [],

    // 动作选择面板
    pickerVisible: false,
    categories: [],
    activeCategory: 0,
    libByCategory: {},
    customName: '',
    searchKw: '',
    searchResults: [],
    searching: false,

    unitOptions: ['kg', 'lb'],
    saving: false
  },

  async onLoad(options) {
    this.refreshLib();
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑训练' });
      this.loadExisting(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新建训练' });
      try {
        const templates = await db.ensureTemplatesSeeded();
        this.setData({ templates, templateGroups: templateLib.groupTemplates(templates) });
      } catch (e) {
        this.setData({ templates: [], templateGroups: [] });
      }
    }
  },

  loadExisting(id) {
    const w = db.getCache(db.COLL.WORKOUTS).find((r) => r._id === id);
    if (!w) { wx.showToast({ title: '记录不存在', icon: 'none' }); return; }

    if (w.type === 'cardio') {
      this.data.workoutType = 'cardio';
      const exercises = (w.exercises || []).map((ex) => this.buildCardioItem(ex.exerciseId, ex));
      this.setData({
        id, date: w.date, templateId: w.templateId || '', name: w.name || '', note: w.note || '',
        workoutType: 'cardio', exercises, stage: 'editing'
      });
      this.refreshLib();
      return;
    }

    const mainUnit = unit.currentUnit();
    const exercises = (w.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      loadType: (lib.getExercise(ex.exerciseId) || {}).loadType || 'weighted',
      unit: mainUnit,
      sets: (ex.sets || []).map((s) => ({ weight: unit.toDisplayIn(s.weight, mainUnit), reps: s.reps }))
    }));
    this.setData({
      id, date: w.date, templateId: w.templateId || '', name: w.name || '', note: w.note || '',
      workoutType: 'strength', exercises, stage: 'editing'
    });
  },

  // ---- 选模板 ----
  pickTemplate(e) {
    const tpl = this.data.templates.find((t) => t._id === e.currentTarget.dataset.id);
    if (!tpl) return;
    this.data.workoutType = tpl.type === 'cardio' ? 'cardio' : 'strength';
    const exercises = this.buildFromTemplate(tpl);
    this.setData({ templateId: tpl._id, name: tpl.name, workoutType: this.data.workoutType, exercises, stage: 'editing' });
    this.refreshLib();
  },
  pickBlank() {
    this.data.workoutType = 'strength';
    this.setData({ templateId: '', name: '训练', workoutType: 'strength', exercises: [], stage: 'editing' });
    this.refreshLib();
  },

  buildFromTemplate(tpl) {
    const workouts = db.getCache(db.COLL.WORKOUTS);
    if (tpl.type === 'cardio') {
      const lastSame = workouts.find((w) => w.templateId === tpl._id && w.type === 'cardio');
      return (tpl.exercises || []).map((te) => {
        const prev = lastSame ? (lastSame.exercises || []).find((x) => x.exerciseId === te.exerciseId) : null;
        return this.buildCardioItem(te.exerciseId, prev);
      });
    }
    const lastSame = workouts.find((w) => w.templateId === tpl._id && w.type !== 'cardio');
    const mainUnit = unit.currentUnit();
    return (tpl.exercises || []).map((te) => {
      const ex = lib.getExercise(te.exerciseId);
      const name = ex ? ex.name : te.exerciseId;
      // 目标定组数（无历史）、历史定重量（有历史优先复用，渐进超负荷）
      let sets = null;
      if (lastSame) {
        const prev = (lastSame.exercises || []).find((x) => x.exerciseId === te.exerciseId);
        if (prev && prev.sets && prev.sets.length) {
          sets = prev.sets.map((s) => ({ weight: unit.toDisplayIn(s.weight, mainUnit), reps: s.reps }));
        }
      }
      if (!sets) {
        const n = te.targetSets || 1;
        sets = [];
        for (let k = 0; k < n; k++) sets.push({ weight: '', reps: '' });
      }
      return {
        exerciseId: te.exerciseId, name,
        loadType: (ex && ex.loadType) || 'weighted', unit: mainUnit,
        repLow: te.repLow, repHigh: te.repHigh, // 次数区间提示（可缺省）
        sets
      };
    });
  },

  // 构造有氧项；prev 为上次同活动数据（含 duration + distance/floors）
  buildCardioItem(exerciseId, prev) {
    const meta = lib.getExercise(exerciseId) || {};
    const metrics = meta.metrics || ['duration', 'distance'];
    const metric2 = metrics[1] || 'distance';
    return {
      exerciseId,
      name: meta.name || exerciseId,
      kind: 'cardio',
      metric2,
      label2: metric2 === 'floors' ? '层数' : '距离(km)',
      duration: prev && prev.duration != null ? prev.duration : '',
      secondVal: prev && prev[metric2] != null ? prev[metric2] : ''
    };
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  // ---- 有氧录入 ----
  onCardioInput(e) {
    const { i, field } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    exercises[i][field] = e.detail.value;
    this.setData({ exercises });
  },

  // ---- 力量：单位 / 组编辑 ----
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
  addSet(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    const last = exercises[i].sets[exercises[i].sets.length - 1] || { weight: '', reps: '' };
    exercises[i].sets.push({ weight: last.weight, reps: last.reps });
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
  // 按 workoutType 过滤分类：cardio 仅「有氧」；strength 排除「有氧」
  refreshLib() {
    const byCat = lib.byCategory();
    let categories;
    if (this.data.workoutType === 'cardio') {
      categories = byCat['有氧'] ? ['有氧'] : [];
    } else {
      categories = Object.keys(byCat).filter((c) => c !== '有氧');
    }
    this.setData({ libByCategory: byCat, categories, activeCategory: 0 });
  },
  openPicker() { this.refreshLib(); this.setData({ pickerVisible: true, searchKw: '', searchResults: [], searching: false }); },
  closePicker() { this.setData({ pickerVisible: false, customName: '', searchKw: '', searchResults: [], searching: false }); },
  switchCategory(e) { this.setData({ activeCategory: e.currentTarget.dataset.index }); },
  onSearchInput(e) {
    const kw = e.detail.value;
    let res = lib.searchExercises(kw); // null=不过滤
    if (res) {
      res = this.data.workoutType === 'cardio'
        ? res.filter((x) => x.category === '有氧')
        : res.filter((x) => x.category !== '有氧');
    }
    this.setData({ searchKw: kw, searchResults: res || [], searching: res !== null });
  },
  clearSearch() { this.setData({ searchKw: '', searchResults: [], searching: false }); },
  onCustomInput(e) { this.setData({ customName: e.detail.value }); },
  pickFromLib(e) {
    const { id, name } = e.currentTarget.dataset;
    this.addExercise(id, name);
  },
  addCustom() {
    const name = this.data.customName.trim();
    if (!name) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return; }
    const id = lib.genCustomId();
    db.saveLocalFirst(lib.CUSTOM_COLL, { id, name, category: '其他' });
    this.addExercise(id, name);
  },
  addExercise(exerciseId) {
    if (this.data.workoutType === 'cardio') {
      const item = this.buildCardioItem(exerciseId, null);
      this.setData({ exercises: this.data.exercises.concat(item), pickerVisible: false, searchKw: '', searchResults: [], searching: false });
      return;
    }
    const meta = lib.getExercise(exerciseId) || {};
    const exercises = this.data.exercises.concat({
      exerciseId, name: meta.name || exerciseId, loadType: meta.loadType || 'weighted',
      unit: unit.currentUnit(), sets: [{ weight: '', reps: '' }]
    });
    this.setData({ exercises, pickerVisible: false, customName: '', searchKw: '', searchResults: [], searching: false });
  },

  // ---- 保存 ----
  onSave() {
    if (this.data.exercises.length === 0) {
      wx.showToast({ title: this.data.workoutType === 'cardio' ? '请至少添加一个活动' : '请至少添加一个动作', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });

    let exercises;
    if (this.data.workoutType === 'cardio') {
      exercises = this.data.exercises
        .map((ex) => {
          const o = { exerciseId: ex.exerciseId, name: ex.name, duration: Number(ex.duration) || 0 };
          o[ex.metric2] = Number(ex.secondVal) || 0;
          return o;
        })
        .filter((o) => o.duration > 0 || o.distance > 0 || o.floors > 0);
    } else {
      exercises = this.data.exercises
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets
            .filter((s) => s.weight !== '' || s.reps !== '')
            .map((s) => ({ weight: unit.toStoreFrom(s.weight, ex.unit), reps: Number(s.reps) || 0 }))
        }))
        .filter((ex) => ex.sets.length > 0);
    }

    if (exercises.length === 0) {
      this.setData({ saving: false });
      wx.showToast({ title: this.data.workoutType === 'cardio' ? '请填写时长或距离' : '请填写组数据', icon: 'none' });
      return;
    }

    const payload = {
      date: this.data.date,
      templateId: this.data.templateId || null,
      type: this.data.workoutType,
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

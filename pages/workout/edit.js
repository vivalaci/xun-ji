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

  // 三路分派：id=编辑既有；templateId=按模板新建；blank/其他=空白力量训练。
  // 选模板由独立页 pages/workout/pick 承担，本页不再有选模板阶段。
  async onLoad(options) {
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑训练' });
      this.loadExisting(options.id);
      this.refreshLib();
      return;
    }
    wx.setNavigationBarTitle({ title: '新建训练' });
    if (options.templateId) {
      let tpl = db.getCache(db.COLL.TEMPLATES).find((t) => t._id === options.templateId);
      if (!tpl) { // 缓存未就绪兜底
        try { await db.ensureTemplatesSeeded(); } catch (e) {}
        tpl = db.getCache(db.COLL.TEMPLATES).find((t) => t._id === options.templateId);
      }
      if (tpl) {
        this.data.workoutType = tpl.type === 'cardio' ? 'cardio' : 'strength';
        this.setData({
          templateId: tpl._id, name: tpl.name,
          workoutType: this.data.workoutType, exercises: this.buildFromTemplate(tpl)
        });
        this.refreshLib();
        return;
      }
      // 找不到模板 → 回退空白，不抛错
    }
    this.data.workoutType = 'strength';
    this.setData({ name: '训练', workoutType: 'strength', exercises: [] });
    this.refreshLib();
  },

  loadExisting(id) {
    const w = db.getCache(db.COLL.WORKOUTS).find((r) => r._id === id);
    if (!w) { wx.showToast({ title: '记录不存在', icon: 'none' }); return; }

    if (w.type === 'cardio') {
      this.data.workoutType = 'cardio';
      const exercises = (w.exercises || []).map((ex) => this.buildCardioItem(ex.exerciseId, ex));
      this.setData({
        id, date: w.date, templateId: w.templateId || '', name: w.name || '', note: w.note || '',
        workoutType: 'cardio', exercises
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
      sets: (ex.sets || []).map((s) => ({ weight: unit.toDisplayWeight(s.weight, mainUnit), reps: s.reps }))
    }));
    this.setData({
      id, date: w.date, templateId: w.templateId || '', name: w.name || '', note: w.note || '',
      workoutType: 'strength', exercises
    });
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
          sets = prev.sets.map((s) => ({ weight: unit.toDisplayWeight(s.weight, mainUnit), reps: s.reps }));
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

  // 把当前（已有）记录的动作组合一键存为「我的模板」——仅编辑态入口
  onSaveAsTemplate() {
    wx.showModal({
      title: '保存为我的模板？',
      content: '把当前动作组合存为「我的模板」，只留动作与组数，不含重量/次数。',
      success: (res) => {
        if (!res.confirm) return;
        const payload = templateLib.recordToTemplatePayload({
          name: this.data.name,
          type: this.data.workoutType,
          exercises: this.data.exercises
        });
        const templates = db.getCache(db.COLL.TEMPLATES);
        payload.order = templates.reduce((m, t) => Math.max(m, t.order || 0), 0) + 1;
        try {
          db.saveLocalFirst(db.COLL.TEMPLATES, payload);
          wx.showToast({ title: '已存为我的模板', icon: 'success' });
        } catch (e) {
          console.error(e);
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
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
      return { weight: unit.toDisplayWeight(unit.toStoreFrom(s.weight, old), newUnit), reps: s.reps };
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
  // 动作/活动调序（力量与有氧共用同一 exercises 数组；组/时长数据随动作整体移动）
  moveUp(e) {
    const i = e.currentTarget.dataset.i;
    if (i <= 0) return;
    const exercises = this.data.exercises.slice();
    [exercises[i - 1], exercises[i]] = [exercises[i], exercises[i - 1]];
    this.setData({ exercises });
  },
  moveDown(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    if (i >= exercises.length - 1) return;
    [exercises[i + 1], exercises[i]] = [exercises[i], exercises[i + 1]];
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
      // 保留页面铺出的全部动作与组，未填的重量/次数落 0（0 重量天然不入主力组/PR/容量）
      exercises = this.data.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets.map((s) => ({
          weight: (s.weight === '' || s.weight == null) ? 0 : unit.toStoreFrom(s.weight, ex.unit),
          reps: Number(s.reps) || 0
        }))
      }));
    }

    if (this.data.workoutType === 'cardio') {
      if (exercises.length === 0) {
        this.setData({ saving: false });
        wx.showToast({ title: '请填写时长或距离', icon: 'none' });
        return;
      }
    } else {
      // 整训练至少一组填了重量或次数，否则拦截（防误存全 0 空训练）
      const anyFilled = exercises.some((ex) => ex.sets.some((s) => s.weight > 0 || s.reps > 0));
      if (!anyFilled) {
        this.setData({ saving: false });
        wx.showToast({ title: '请填写组数据', icon: 'none' });
        return;
      }
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

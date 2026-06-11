// pages/workout/edit.js —— 新建/编辑训练
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const EXERCISE_LIB = require('../../config/exercises.js');

Page({
  data: {
    id: '',                 // 有值=编辑，无值=新建
    date: util.formatDate(),
    name: '',
    note: '',
    exercises: [],          // [{ name, sets: [{weight, reps}] }]
    // 动作选择面板
    pickerVisible: false,
    lib: EXERCISE_LIB,
    activeCategory: 0,
    customName: '',
    saving: false
  },

  onLoad(options) {
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑训练' });
      this.loadWorkout(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新建训练' });
    }
  },

  async loadWorkout(id) {
    try {
      const w = await db.get(db.COLL.WORKOUTS, id);
      this.setData({
        id,
        date: w.date,
        name: w.name || '',
        note: w.note || '',
        exercises: w.exercises || []
      });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // ---- 动作选择面板 ----
  openPicker() {
    this.setData({ pickerVisible: true });
  },
  closePicker() {
    this.setData({ pickerVisible: false, customName: '' });
  },
  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.index });
  },
  onCustomInput(e) {
    this.setData({ customName: e.detail.value });
  },
  pickExercise(e) {
    const name = e.currentTarget.dataset.name;
    this.addExercise(name);
  },
  addCustom() {
    const name = this.data.customName.trim();
    if (!name) {
      wx.showToast({ title: '请输入动作名称', icon: 'none' });
      return;
    }
    this.addExercise(name);
  },
  addExercise(name) {
    const exercises = this.data.exercises.concat({
      name,
      sets: [{ weight: '', reps: '' }]
    });
    this.setData({ exercises, pickerVisible: false, customName: '' });
  },

  // ---- 动作 / 组 编辑 ----
  removeExercise(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    exercises.splice(i, 1);
    this.setData({ exercises });
  },
  addSet(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    const lastSet = exercises[i].sets[exercises[i].sets.length - 1] || { weight: '', reps: '' };
    // 新组默认沿用上一组的重量/次数，少打几个字
    exercises[i].sets.push({ weight: lastSet.weight, reps: lastSet.reps });
    this.setData({ exercises });
  },
  removeSet(e) {
    const { i, j } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    exercises[i].sets.splice(j, 1);
    if (exercises[i].sets.length === 0) {
      exercises[i].sets.push({ weight: '', reps: '' });
    }
    this.setData({ exercises });
  },
  onSetInput(e) {
    const { i, j, field } = e.currentTarget.dataset;
    const exercises = this.data.exercises.slice();
    exercises[i].sets[j][field] = e.detail.value;
    this.setData({ exercises });
  },

  // ---- 保存 ----
  async onSave() {
    if (this.data.exercises.length === 0) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });

    // 清洗数据：去掉空组，数字化
    const exercises = this.data.exercises
      .map((ex) => ({
        name: ex.name,
        sets: ex.sets
          .filter((s) => s.weight !== '' || s.reps !== '')
          .map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 }))
      }))
      .filter((ex) => ex.sets.length > 0);

    if (exercises.length === 0) {
      this.setData({ saving: false });
      wx.showToast({ title: '请填写组数据', icon: 'none' });
      return;
    }

    const payload = {
      date: this.data.date,
      name: this.data.name.trim() || '训练',
      note: this.data.note.trim(),
      exercises
    };

    try {
      if (this.data.id) {
        await db.update(db.COLL.WORKOUTS, this.data.id, payload);
      } else {
        await db.add(db.COLL.WORKOUTS, payload);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (e) {
      console.error(e);
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});

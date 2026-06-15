// pages/template/edit.js —— 模板编辑（重命名 / 增删动作 / 调序）
const db = require('../../utils/db.js');
const lib = require('../../utils/exerciseLib.js');

Page({
  data: {
    id: '',
    name: '',
    exercises: [],          // [{ exerciseId, name }]
    // 动作选择面板
    pickerVisible: false,
    categories: [],
    activeCategory: 0,
    libByCategory: {},
    // 动作搜索
    searchKw: '',
    searchResults: [],
    searching: false,
    saving: false
  },

  onLoad(options) {
    this.id = options.id;
    const t = db.getCache(db.COLL.TEMPLATES).find((x) => x._id === this.id);
    if (!t) { wx.showToast({ title: '模板不存在', icon: 'none' }); return; }

    const byCat = lib.byCategory();
    const categories = Object.keys(byCat);
    this.setData({
      id: t._id,
      name: t.name || '',
      exercises: (t.exercises || []).map((e) => ({ exerciseId: e.exerciseId, name: lib.getName(e.exerciseId) })),
      libByCategory: byCat,
      categories
    });
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },

  removeExercise(e) {
    const i = e.currentTarget.dataset.i;
    const exercises = this.data.exercises.slice();
    exercises.splice(i, 1);
    this.setData({ exercises });
  },
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

  // 动作选择面板
  openPicker() {
    const byCat = lib.byCategory(); // 刷新（含会话内新增的自建动作）
    this.setData({ pickerVisible: true, libByCategory: byCat, categories: Object.keys(byCat), searchKw: '', searchResults: [], searching: false });
  },
  closePicker() { this.setData({ pickerVisible: false, searchKw: '', searchResults: [], searching: false }); },
  switchCategory(e) { this.setData({ activeCategory: e.currentTarget.dataset.index }); },
  onSearchInput(e) {
    const kw = e.detail.value;
    const res = lib.searchExercises(kw); // null=不过滤
    this.setData({ searchKw: kw, searchResults: res || [], searching: res !== null });
  },
  clearSearch() { this.setData({ searchKw: '', searchResults: [], searching: false }); },
  pickFromLib(e) {
    const { id, name } = e.currentTarget.dataset;
    if (this.data.exercises.some((x) => x.exerciseId === id)) {
      wx.showToast({ title: '已在模板中', icon: 'none' });
      return;
    }
    this.setData({
      exercises: this.data.exercises.concat({ exerciseId: id, name }),
      pickerVisible: false, searchKw: '', searchResults: [], searching: false
    });
  },

  onSave() {
    if (this.data.saving) return;
    const name = (this.data.name || '').trim();
    if (!name) { wx.showToast({ title: '请输入模板名称', icon: 'none' }); return; }
    this.setData({ saving: true });
    db.updateLocalFirst(db.COLL.TEMPLATES, this.id, {
      name,
      exercises: this.data.exercises.map((e) => ({ exerciseId: e.exerciseId }))
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  }
});

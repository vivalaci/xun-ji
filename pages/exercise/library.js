// pages/exercise/library.js —— 动作库管理（查看内置 + 增删自建 + 管理员内容管理）
// 管理模式（仅 App 所有者）：底部计数文字连点 5 次触发云函数验证（不在进页时自动调用，
// 普通用户零云函数调用，见 design D3）；入口只是 UI 便利，安全边界在云函数（design D2）。
const db = require('../../utils/db.js');
const lib = require('../../utils/exerciseLib.js');
const adminApi = require('../../utils/adminApi.js');

// 别名分隔：中英逗号/顿号/分号（不按空格拆，别名本身可含空格，如 "bench press"）
function parseAliases(str) {
  return String(str || '').split(/[,，、;；]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

Page({
  data: {
    groups: [],            // [{ category, items:[{id,name,isMainLift,custom,global,hidden,_id}] }]
    total: 0,              // 可见动作数（底部计数，兼作管理入口手势区）
    // 搜索
    searchKw: '',
    searchResults: [],
    searching: false,
    // 新建面板（普通=自建 cus_，管理模式=全局 gbl_）
    addVisible: false,
    newName: '',
    newAliases: '',
    categories: [],
    catIndex: 0,
    // 管理模式
    adminMode: false,
    // 编辑面板（管理模式：改内置/全局动作）
    editVisible: false,
    editTarget: null,      // { id, name, category, aliases, hidden, isMainLift, cardio }
    editName: '',
    editAliases: '',
    editHidden: false,
    editCats: [],
    editCatIndex: 0,
    // 类别编排面板（管理模式）
    catPanelVisible: false,
    catList: [],
    newCatName: ''
  },

  onShow() {
    this.render();
    this.refresh();
  },

  async refresh() {
    try {
      await db.refresh(lib.CUSTOM_COLL);
      await db.refreshOverrides();
      this.render();
    } catch (e) { /* 离线保留缓存，回退基线 */ }
  },

  render() {
    const byCat = lib.byCategory({ includeHidden: this.data.adminMode });
    const groups = Object.keys(byCat).map((c) => ({ category: c, items: byCat[c] }));
    this.setData({
      groups,
      total: lib.allExercises().length,
      categories: lib.listCategories()
    });
    // 搜索态下同步刷新结果（如删除后）
    if (this.data.searching) this.applySearch(this.data.searchKw);
  },

  onSearchInput(e) { this.applySearch(e.detail.value); },
  applySearch(kw) {
    const res = lib.searchExercises(kw); // null=不过滤
    this.setData({ searchKw: kw, searchResults: res || [], searching: res !== null });
  },
  clearSearch() { this.setData({ searchKw: '', searchResults: [], searching: false }); },

  // ---------- 新建（普通：自建；管理模式：全局） ----------

  openAdd() { this.setData({ addVisible: true, newName: '', newAliases: '', catIndex: 0 }); },
  closeAdd() { this.setData({ addVisible: false }); },
  onNameInput(e) { this.setData({ newName: e.detail.value }); },
  onNewAliasesInput(e) { this.setData({ newAliases: e.detail.value }); },
  onCatChange(e) { this.setData({ catIndex: Number(e.detail.value) }); },

  async onAdd() {
    const name = (this.data.newName || '').trim();
    if (!name) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return; }
    const category = this.data.categories[this.data.catIndex];
    if (this.data.adminMode) {
      // 全局动作：走云函数（铁律 1 例外），真实 loading / 失败态
      await this.adminCall(() => adminApi.addGlobalExercise({
        id: lib.genGlobalId(),
        name,
        category,
        aliases: parseAliases(this.data.newAliases)
      }), '已新增全局动作');
      this.setData({ addVisible: false });
      return;
    }
    db.saveLocalFirst(lib.CUSTOM_COLL, { id: lib.genCustomId(), name, category });
    this.setData({ addVisible: false });
    this.render();
  },

  async onDelete(e) {
    const _id = e.currentTarget.dataset.docid;
    const res = await wx.showModal({ title: '删除动作', content: '确定删除该自定义动作吗？历史记录仍按原样保留。' });
    if (!res.confirm) return;
    db.removeLocalFirst(lib.CUSTOM_COLL, _id);
    this.render();
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/exercise/detail?id=${e.currentTarget.dataset.id}` });
  },

  // ---------- 管理入口（隐藏手势：计数文字 1.5s 内连点 5 次） ----------

  onSecretTap() {
    const now = Date.now();
    if (!this._secretAt || now - this._secretAt > 1500) this._secretN = 0;
    this._secretAt = now;
    this._secretN = (this._secretN || 0) + 1;
    if (this._secretN >= 5) {
      this._secretN = 0;
      this.verifyAdmin();
    }
  },

  async verifyAdmin() {
    if (this.data.adminMode) return;
    try {
      await adminApi.ping();
      this.setData({ adminMode: true });
      this.render();
      wx.showToast({ title: '已进入管理模式', icon: 'none' });
    } catch (e) {
      // 非管理员/网络失败：静默——不暴露任何管理痕迹（安全边界在云函数，见 design D2/D3）
    }
  },

  exitAdmin() {
    this.setData({ adminMode: false, editVisible: false, catPanelVisible: false });
    this.render();
  },

  // 管理写入统一通道：真实 loading，成功后刷新 overrides 再渲染，失败明确提示不静默
  async adminCall(fn, okTitle) {
    wx.showLoading({ title: '保存中', mask: true });
    try {
      await fn();
      try { await db.refreshOverrides(); } catch (e) { /* 写已成功，下次刷新会到 */ }
      this.render();
      wx.hideLoading();
      wx.showToast({ title: okTitle || '已保存', icon: 'none' });
      return true;
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
      return false;
    }
  },

  // ---------- 编辑动作（管理模式专属；普通用户对自建仅删除） ----------
  // 内置/全局：编辑写走云函数 patch（铁律 1 例外），对所有用户生效。
  // 自建（cus_）：「编辑」即「升格」——保存时经云函数新建 gbl_ 全局动作（所有用户可见），
  // 原 cus_ 动作本地标记 hidden 作历史锚点（引用它的历史记录名称照常解析，见 design D8）。

  openEdit(e) {
    if (!this.data.adminMode) return;
    const id = e.currentTarget.dataset.id;
    const ex = lib.getExercise(id);
    if (!ex) return;
    const cats = lib.listCategories();
    const cardio = ex.category === '有氧';
    let catIndex = cats.indexOf(ex.category);
    if (catIndex < 0) catIndex = 0;
    this.setData({
      editVisible: true,
      editTarget: {
        id: ex.id,
        docId: ex._id || '', // 自建动作文档 id（本地写用）
        custom: !!ex.custom,
        name: ex.name,
        category: ex.category,
        aliases: ex.aliases || [],
        hidden: !!ex.hidden,
        isMainLift: !!ex.isMainLift,
        cardio
      },
      editName: ex.name,
      editAliases: (ex.aliases || []).join('、'),
      editHidden: !!ex.hidden,
      editCats: cats,
      editCatIndex: catIndex
    });
  },
  closeEdit() { this.setData({ editVisible: false }); },
  onEditNameInput(e) { this.setData({ editName: e.detail.value }); },
  onEditAliasesInput(e) { this.setData({ editAliases: e.detail.value }); },
  onEditCatChange(e) { this.setData({ editCatIndex: Number(e.detail.value) }); },
  onEditHiddenChange(e) { this.setData({ editHidden: !!e.detail.value }); },

  async onEditSave() {
    const t = this.data.editTarget;
    if (!t) return;

    // 自建动作：保存 = 升格为全局动作（云写成功后才隐藏原自建，失败不动本地）
    if (t.custom) {
      const gname = (this.data.editName || '').trim();
      if (!gname) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return; }
      const gcat = this.data.editCats[this.data.editCatIndex];
      const galiases = parseAliases(this.data.editAliases);
      const docId = t.docId;
      const ok = await this.adminCall(async () => {
        await adminApi.addGlobalExercise({ id: lib.genGlobalId(), name: gname, category: gcat, aliases: galiases });
        db.updateLocalFirst(lib.CUSTOM_COLL, docId, { hidden: true }); // 原 cus_ 转为历史锚点
      }, '已升格为全局动作');
      if (ok) this.setData({ editVisible: false });
      return;
    }

    const patch = {};
    const name = (this.data.editName || '').trim();
    if (name && name !== t.name) patch.name = name;
    // 有氧动作分类固定（cardio 语义与指标绑定），不提供改类
    if (!t.cardio) {
      const cat = this.data.editCats[this.data.editCatIndex];
      if (cat && cat !== t.category) patch.category = cat;
    }
    const aliases = parseAliases(this.data.editAliases);
    if (aliases.join('') !== (t.aliases || []).join('')) patch.aliases = aliases;
    if (this.data.editHidden !== t.hidden) patch.hidden = this.data.editHidden;
    if (!Object.keys(patch).length) { this.setData({ editVisible: false }); return; }
    const ok = await this.adminCall(() => adminApi.savePatch(t.id, patch));
    if (ok) this.setData({ editVisible: false });
  },

  // 升格后的自建动作（已隐藏）可恢复展示（如需撤销升格：先隐藏 gbl_ 版本）
  onUnhideCustom(e) {
    const docId = e.currentTarget.dataset.docid;
    db.updateLocalFirst(lib.CUSTOM_COLL, docId, { hidden: false });
    this.render();
    wx.showToast({ title: '已恢复展示', icon: 'none' });
  },

  // ---------- 类别编排（管理模式；有氧固定末位，不参与排序） ----------

  openCatPanel() {
    this.setData({ catPanelVisible: true, catList: lib.listCategories(), newCatName: '' });
  },
  closeCatPanel() { this.setData({ catPanelVisible: false }); },
  onNewCatInput(e) { this.setData({ newCatName: e.detail.value }); },

  addCat() {
    const name = (this.data.newCatName || '').trim();
    if (!name) { wx.showToast({ title: '请输入类别名称', icon: 'none' }); return; }
    if (name === '有氧' || this.data.catList.indexOf(name) >= 0) {
      wx.showToast({ title: '类别已存在', icon: 'none' });
      return;
    }
    this.setData({ catList: this.data.catList.concat(name), newCatName: '' });
  },

  moveCat(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const dir = Number(e.currentTarget.dataset.dir); // -1 上移 / 1 下移
    const list = this.data.catList.slice();
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    const tmp = list[idx];
    list[idx] = list[to];
    list[to] = tmp;
    this.setData({ catList: list });
  },

  async onCatSave() {
    const ok = await this.adminCall(() => adminApi.setCategoryOrder(this.data.catList), '类别顺序已保存');
    if (ok) this.setData({ catPanelVisible: false });
  }
});

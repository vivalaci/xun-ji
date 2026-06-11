// pages/body/body.js —— 身体数据
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

// 表单字段定义（label 用于展示，key 用于存储，unit 单位）
const FIELDS = [
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'bodyFat', label: '体脂率', unit: '%' },
  { key: 'chest', label: '胸围', unit: 'cm' },
  { key: 'waist', label: '腰围', unit: 'cm' },
  { key: 'hip', label: '臀围', unit: 'cm' },
  { key: 'arm', label: '手臂', unit: 'cm' },
  { key: 'thigh', label: '大腿', unit: 'cm' }
];

Page({
  data: {
    loading: true,
    records: [],
    latest: null,
    fields: FIELDS,
    // 新增面板
    formVisible: false,
    form: { date: util.formatDate() },
    saving: false
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const raw = await db.list(db.COLL.BODY, { limit: 100 });
      const records = raw.map((r) => ({
        _id: r._id,
        date: r.date,
        dateLabel: `${util.formatMonthDay(r.date)} ${util.weekDay(r.date)}`,
        weight: r.weight,
        bodyFat: r.bodyFat,
        chest: r.chest,
        waist: r.waist,
        hip: r.hip,
        arm: r.arm,
        thigh: r.thigh
      }));
      this.setData({
        records,
        latest: records[0] || null,
        loading: false
      });
      this.drawChart(records);
    } catch (e) {
      console.error(e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请检查云环境', icon: 'none' });
    }
  },

  // 绘制体重趋势折线图（Canvas 2D）
  drawChart(records) {
    const points = records
      .filter((r) => typeof r.weight === 'number')
      .slice(0, 30)
      .reverse()
      .map((r) => ({ x: r.date, y: r.weight }));

    wx.createSelectorQuery()
      .in(this)
      .select('#weightChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2;
        const W = res[0].width;
        const H = res[0].height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, W, H);

        if (points.length < 2) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('记录两条以上体重即可看到趋势', W / 2, H / 2);
          return;
        }

        const pad = { l: 36, r: 16, t: 16, b: 24 };
        const ys = points.map((p) => p.y);
        let min = Math.min(...ys);
        let max = Math.max(...ys);
        if (min === max) { min -= 1; max += 1; }
        const range = max - min;
        min -= range * 0.15;
        max += range * 0.15;

        const px = (i) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r);
        const py = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);

        // 网格线 + Y 轴刻度
        ctx.strokeStyle = '#f0f0f0';
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        for (let g = 0; g <= 3; g++) {
          const v = min + (range + range * 0.3) * (g / 3);
          const y = py(v);
          ctx.beginPath();
          ctx.moveTo(pad.l, y);
          ctx.lineTo(W - pad.r, y);
          ctx.stroke();
          ctx.fillText(v.toFixed(1), pad.l - 6, y + 4);
        }

        // 折线
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = px(i);
          const y = py(p.y);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 数据点
        ctx.fillStyle = '#2563eb';
        points.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(px(i), py(p.y), 3, 0, Math.PI * 2);
          ctx.fill();
        });
      });
  },

  // ---- 新增面板 ----
  openForm() {
    this.setData({ formVisible: true, form: { date: util.formatDate() } });
  },
  closeForm() {
    this.setData({ formVisible: false });
  },
  onFormDate(e) {
    this.setData({ 'form.date': e.detail.value });
  },
  onFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  async onSave() {
    const form = this.data.form;
    const hasValue = FIELDS.some((f) => form[f.key] !== undefined && form[f.key] !== '');
    if (!hasValue) {
      wx.showToast({ title: '请至少填写一项数据', icon: 'none' });
      return;
    }
    if (this.data.saving) return;
    this.setData({ saving: true });

    const payload = { date: form.date };
    FIELDS.forEach((f) => {
      if (form[f.key] !== undefined && form[f.key] !== '') {
        payload[f.key] = Number(form[f.key]);
      }
    });

    try {
      await db.add(db.COLL.BODY, payload);
      this.setData({ formVisible: false, saving: false });
      wx.showToast({ title: '已保存', icon: 'success' });
      this.loadData();
    } catch (e) {
      console.error(e);
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除记录', content: '确定删除这条身体数据吗？' });
    if (!res.confirm) return;
    try {
      await db.remove(db.COLL.BODY, id);
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});

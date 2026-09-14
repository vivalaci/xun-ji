// components/exercise-thumb —— 列表行右端的静态示意图缩略图
// 无图 / 加载失败 → 不渲染（行点击照常）；点击缩略图 catchtap 触发 enlarge，不冒泡到行点击。
const media = require('../../utils/exerciseMedia.js');

Component({
  properties: {
    exerciseId: { type: String, value: '' },
    size: { type: Number, value: 88 } // 边长 rpx
  },

  data: { src: '', failed: false },

  lifetimes: {
    attached() { this.load(this.data.exerciseId); }
  },

  observers: {
    // 父页面重绘时即使 id 未变也会触发，只在 id 变化时重置
    exerciseId(id) { if (id !== this._id) this.load(id); }
  },

  methods: {
    load(id) {
      this._id = id;
      this.setData({ src: media.thumbFor(id), failed: false });
    },
    onTap() { this.triggerEvent('enlarge', { id: this.data.exerciseId }); },
    onError() { this.setData({ failed: true }); }
  }
});

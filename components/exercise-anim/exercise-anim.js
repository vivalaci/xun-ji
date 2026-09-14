// components/exercise-anim —— 3 帧示意图循环播放
// 三张 image 叠放、各只加载一次，CSS keyframes 切 opacity 乒乓 0→1→2→1（每步 450ms，见 wxss）；
// 不用 setInterval 换 src（云端图换 src 会重新加载闪白，且每步一次 setData）。
// 三帧 bindload 齐后才加 playing 开始播放，之前静显第 0 帧；任一帧加载失败 → 整块隐藏。
const media = require('../../utils/exerciseMedia.js');

Component({
  properties: {
    exerciseId: { type: String, value: '' },
    size: { type: String, value: 'md' },      // md：详情页；lg：放大层
    tappable: { type: Boolean, value: true } // 放大层内置为 false，不再触发放大
  },

  data: { frames: [], playing: false, failed: false },

  lifetimes: {
    attached() { this.reset(this.data.exerciseId); }
  },

  observers: {
    // 父页面重绘时即使 id 未变也会触发；若此时重置，已加载的图不会再触发 bindload，会卡在第 0 帧
    exerciseId(id) { if (id !== this._id) this.reset(id); }
  },

  methods: {
    reset(id) {
      this._id = id;
      this._loaded = {};
      this.setData({ frames: media.framesFor(id), playing: false, failed: false });
    },
    onFrameLoad(e) {
      this._loaded[e.currentTarget.dataset.i] = true;
      const n = this.data.frames.length;
      if (n === 3 && !this.data.playing && Object.keys(this._loaded).length === n) {
        this.setData({ playing: true });
      }
    },
    onFrameError() { this.setData({ failed: true }); },
    onTap() {
      if (this.data.tappable) this.triggerEvent('enlarge', { id: this.data.exerciseId });
    }
  }
});

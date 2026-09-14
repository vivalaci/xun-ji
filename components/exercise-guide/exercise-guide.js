// components/exercise-guide —— 动作要领（步骤 + 要点）；无要领（有氧/自建/全局）不渲染
// 详情页与放大层复用，数据取自 utils/exerciseMedia.instructionsFor。
const media = require('../../utils/exerciseMedia.js');

Component({
  properties: {
    exerciseId: { type: String, value: '' }
  },

  data: { guide: null },

  lifetimes: {
    attached() { this.load(this.data.exerciseId); }
  },

  observers: {
    exerciseId(id) { if (id !== this._id) this.load(id); }
  },

  methods: {
    load(id) {
      this._id = id;
      this.setData({ guide: media.instructionsFor(id) });
    }
  }
});

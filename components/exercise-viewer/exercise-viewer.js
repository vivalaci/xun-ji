// components/exercise-viewer —— 示意图放大层（大图循环 + 动作名 + 要领）
// 由页面在根部放一个：「添加动作」面板带 transform，嵌在面板里的 position:fixed 会被裁切，盖不住全屏。
// exerciseId 为空时不渲染；点遮罩或「关闭」触发 close，由页面清空 exerciseId（面板状态不受影响）。
const lib = require('../../utils/exerciseLib.js');

Component({
  properties: {
    exerciseId: { type: String, value: '' }
  },

  data: { name: '' },

  observers: {
    exerciseId(id) { this.setData({ name: id ? lib.getName(id) : '' }); }
  },

  methods: {
    onClose() { this.triggerEvent('close'); },
    noop() {}
  }
});

// pages/manual/manual.js —— 使用说明（内容同源 config/manual.js / docs/usermanual.md）
const manual = require('../../config/manual.js');

Page({
  data: {
    intro: manual.intro,
    sections: manual.sections,
  },
});

// utils/exerciseMedia.js —— 动作示意图与要领取数（纯函数，页面与组件只经这里取）
// 示意图：<PREFIX>/<id>/0.png|1.png|2.png（循环帧）+ thumb.png（列表缩略图），PREFIX/清单见 config/exerciseMedia.js。
// 无图（PREFIX 未配置、id 不在清单：自建 cus_/全局 gbl_/seal_row 等）→ 空结果，页面不渲染、不报错。
// 要领：config/exerciseInstructions.js；无条目（有氧/自建/全局）→ null，页面不显示要领区。

const INSTRUCTIONS = require('../config/exerciseInstructions.js');

const has = (obj, key) => !!key && Object.prototype.hasOwnProperty.call(obj, key);

// 按配置生成取图函数（单测传入假配置，与线上 PREFIX 是否已填解耦）
function create(cfg) {
  const prefix = (cfg && cfg.PREFIX) || '';
  const media = (cfg && cfg.MEDIA) || {};

  function hasMedia(id) {
    return !!prefix && has(media, id) && media[id] > 0;
  }
  // 循环帧图源（按帧序）；无图返回 []
  function framesFor(id) {
    if (!hasMedia(id)) return [];
    const out = [];
    for (let i = 0; i < media[id]; i++) out.push(`${prefix}/${id}/${i}.png`);
    return out;
  }
  // 列表缩略图图源；无图返回 ''
  function thumbFor(id) {
    return hasMedia(id) ? `${prefix}/${id}/thumb.png` : '';
  }
  return { hasMedia, framesFor, thumbFor };
}

// 要领（返回拷贝，防调用方误改配置）；无要领返回 null
function instructionsFor(id) {
  if (!has(INSTRUCTIONS, id)) return null;
  const it = INSTRUCTIONS[id];
  return { steps: (it.steps || []).slice(), tips: (it.tips || []).slice() };
}

const media = create(require('../config/exerciseMedia.js'));

module.exports = {
  create,
  hasMedia: media.hasMedia,
  framesFor: media.framesFor,
  thumbFor: media.thumbFor,
  instructionsFor
};

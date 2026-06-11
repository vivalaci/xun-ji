// utils/store.js —— 本地存储底层封装（缓存 + 待同步写入队列）

const QUEUE_KEY = 'pending_writes';
const SETTINGS_KEY = 'settings';

// 默认设置（迭代二：仅重量单位；体脂单位留位）
const DEFAULT_SETTINGS = { weightUnit: 'kg' };

function cacheKey(coll) {
  return 'cache_' + coll;
}

// 读缓存（同步，离线可用）
function getCache(coll) {
  return wx.getStorageSync(cacheKey(coll)) || [];
}

// 写缓存
function setCache(coll, list) {
  wx.setStorageSync(cacheKey(coll), list);
}

// 待同步队列
function getQueue() {
  return wx.getStorageSync(QUEUE_KEY) || [];
}
function setQueue(q) {
  wx.setStorageSync(QUEUE_KEY, q);
}

// 设置：本地偏好（不上云），缺省回退 DEFAULT_SETTINGS
function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, wx.getStorageSync(SETTINGS_KEY) || {});
}
function setSettings(patch) {
  const next = Object.assign(getSettings(), patch);
  wx.setStorageSync(SETTINGS_KEY, next);
  return next;
}

module.exports = { getCache, setCache, getQueue, setQueue, getSettings, setSettings };

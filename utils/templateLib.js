// utils/templateLib.js —— 模板分组与迁移的纯函数（可在 node 单测）
// 分组约定：group 为字符串标签；空串/缺失 = 用户自建，展示为"我的模板"。

const PRESET_GROUPS = ['三分化', '二分化', '有氧'];
const MY_GROUP_LABEL = '我的模板';

// 旧预设名 → 迁移目标（腿日同时改名蹲日）
const LEGACY_PRESET = {
  '推日': { group: '三分化' },
  '拉日': { group: '三分化' },
  '腿日': { group: '三分化', name: '蹲日' }
};

// 按组分桶：预设组在前（三分化 → 二分化），其余具名组随后，空组名归"我的模板"垫底。
// 空桶不输出；桶内按 order 升序。返回 [{ name, items }]
function groupTemplates(templates) {
  const buckets = {};
  const otherOrder = [];
  (templates || []).forEach((t) => {
    const g = t.group || '';
    const key = g === '' ? MY_GROUP_LABEL : g;
    if (!buckets[key]) {
      buckets[key] = [];
      if (g !== '' && PRESET_GROUPS.indexOf(g) < 0) otherOrder.push(key);
    }
    buckets[key].push(t);
  });
  const orderedNames = PRESET_GROUPS.filter((g) => buckets[g])
    .concat(otherOrder)
    .concat(buckets[MY_GROUP_LABEL] ? [MY_GROUP_LABEL] : []);
  return orderedNames.map((name) => ({
    name,
    items: buckets[name].slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  }));
}

// 迁移计划：找出缺 group 字段的存量模板，给出更新与补种清单。
// templates: 现有模板（presets 参数保留兼容，现不再用于补种）
// 返回 { needed, updates: [{ id, data }] }
// 职责仅「给 legacy 缺 group 的模板补 group + 腿日→蹲日」；预设的播种/补齐统一由
// db.ensurePresetVersion（版本重刷）负责，故此处不再产出 additions（见 change preset-program-upgrade D3）。
// 幂等：迁移后所有模板都有 group（含显式空串），needed 永久为 false。
function planTemplateMigration(templates) {
  const missing = (templates || []).filter((t) => t.group === undefined || t.group === null);
  if (missing.length === 0) return { needed: false, updates: [] };

  const updates = missing.map((t) => {
    const legacy = LEGACY_PRESET[t.name];
    const data = legacy
      ? (legacy.name ? { group: legacy.group, name: legacy.name } : { group: legacy.group })
      : { group: '' };
    return { id: t._id, data };
  });

  return { needed: true, updates };
}

module.exports = { groupTemplates, planTemplateMigration, MY_GROUP_LABEL };

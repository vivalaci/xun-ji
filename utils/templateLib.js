// utils/templateLib.js —— 模板分组与迁移的纯函数（可在 node 单测）
// 分组约定：group 为字符串标签；空串/缺失 = 用户自建，展示为"我的模板"。

const PRESET_GROUPS = ['三分化', '二分化', '有氧'];
const MY_GROUP_LABEL = '我的模板';

// 分组的循证说明（选模板界面展示，让用户理解设计逻辑；来源 docs/09）
const GROUP_NOTES = {
  '二分化': '上/下分化，4 练/周。多数中级训练者最优——天然每肌群 2×/周、容量好分摊。A 日偏力量·横向推拉，B 日偏肥大·垂直推拉，错开重复疲劳。',
  '三分化': 'PPL 推/拉/腿。6 练/周最佳（每肌群 2×）；3 练版每肌群仅 1×、单日容量被迫堆高，适合时间紧或进阶者。'
};

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
  // 「我的模板」置顶（若存在）→ 预设组（三分化/二分化/有氧）→ 其余具名组
  const orderedNames = (buckets[MY_GROUP_LABEL] ? [MY_GROUP_LABEL] : [])
    .concat(PRESET_GROUPS.filter((g) => buckets[g]))
    .concat(otherOrder);
  return orderedNames.map((name) => ({
    name,
    items: buckets[name].slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  }));
}

// 训练记录 → 「我的模板」payload（纯函数，供 edit.saveAsTemplate 与单测用）。
// 力量：每动作 { exerciseId, targetSets: 组数 }；有氧：{ exerciseId } 且模板 type:'cardio'。
// 名称加「（我的）」后缀、group 空；order 由调用方补末位（依赖现有模板，不在纯函数内）。
function recordToTemplatePayload(record) {
  const isCardio = (record && record.type) === 'cardio';
  const exercises = ((record && record.exercises) || []).map((ex) => (
    isCardio ? { exerciseId: ex.exerciseId }
             : { exerciseId: ex.exerciseId, targetSets: (ex.sets || []).length }
  ));
  const payload = {
    name: ((record && record.name) || '训练') + '（我的）',
    group: '',
    exercises
  };
  if (isCardio) payload.type = 'cardio';
  return payload;
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

module.exports = { groupTemplates, planTemplateMigration, recordToTemplatePayload, MY_GROUP_LABEL, GROUP_NOTES };

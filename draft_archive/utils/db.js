// utils/db.js —— 云数据库操作封装
// 集合（数据表）：
//   workouts     力量训练记录
//   body_records 身体数据记录
// 写入时云开发会自动注入 _openid，配合「仅创建者可读写」安全规则即可做到每个用户只看到自己的数据。

const COLL = {
  WORKOUTS: 'workouts',
  BODY: 'body_records'
};

function db() {
  return wx.cloud.database();
}

// 新增一条记录，返回新文档 _id
async function add(coll, data) {
  const res = await db().collection(coll).add({
    data: Object.assign({ createTime: db().serverDate() }, data)
  });
  return res._id;
}

// 更新一条记录
async function update(coll, id, data) {
  return db().collection(coll).doc(id).update({ data });
}

// 删除一条记录
async function remove(coll, id) {
  return db().collection(coll).doc(id).remove();
}

// 按时间倒序查询；可传 limit（默认 50）
async function list(coll, { limit = 50, orderBy = 'date', order = 'desc' } = {}) {
  const res = await db()
    .collection(coll)
    .orderBy(orderBy, order)
    .limit(limit)
    .get();
  return res.data;
}

// 查询单条
async function get(coll, id) {
  const res = await db().collection(coll).doc(id).get();
  return res.data;
}

module.exports = { COLL, db, add, update, remove, list, get };

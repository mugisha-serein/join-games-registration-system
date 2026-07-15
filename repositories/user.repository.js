const { runAsync, getAsync, allAsync } = require('../database/connection');
const { normalizePhoneNumber } = require('../utils/phone');

async function createUser(userData) {
  const {
    fullName,
    phoneNumber,
    shortComment,
    joinType,
    termsAccepted,
    termsVersion,
    termsAcceptedAt,
  } = userData;

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const sql = `
    INSERT INTO users (
      full_name,
      phone_number,
      short_comment,
      join_type,
      terms_accepted,
      terms_version,
      terms_accepted_at,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const result = await runAsync(sql, [
    fullName,
    normalizedPhone,
    shortComment || null,
    joinType,
    termsAccepted ? 1 : 0,
    termsVersion,
    termsAcceptedAt,
  ]);

  return result.lastID;
}

async function getUserById(id) {
  const sql = 'SELECT * FROM users WHERE id = ?';
  return getAsync(sql, [id]);
}

async function getUserByPhoneNumber(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const sql = 'SELECT * FROM users WHERE phone_number = ?';
  return getAsync(sql, [normalizedPhone]);
}

async function getUsersWithPagination(options = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    joinType = '',
    sort = 'created_at',
    order = 'desc',
  } = options;

  const offset = (page - 1) * limit;
  const validSorts = [
    'id',
    'full_name',
    'created_at',
    'updated_at',
    'status',
  ];
  const validOrders = ['asc', 'desc'];
  const sortField = validSorts.includes(sort) ? sort : 'created_at';
  const orderDir = validOrders.includes(order) ? order : 'desc';

  let whereConditions = [];
  let params = [];

  if (search) {
    whereConditions.push(
      '(full_name LIKE ? OR phone_number LIKE ?)'
    );
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  if (joinType) {
    whereConditions.push('join_type = ?');
    params.push(joinType);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM users ${whereClause}`;
  const countResult = await getAsync(countSql, params);
  const total = countResult.count;

  // Get paginated results
  const sql = `
    SELECT * FROM users
    ${whereClause}
    ORDER BY ${sortField} ${orderDir}
    LIMIT ? OFFSET ?
  `;
  const rows = await allAsync(sql, [...params, limit, offset]);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function updateUserStatus(userId, status) {
  const sql = `
    UPDATE users
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runAsync(sql, [status, userId]);
}

async function approveUser(userId) {
  const sql = `
    UPDATE users
    SET status = 'approved', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runAsync(sql, [userId]);
}

async function banUser(userId) {
  const sql = `
    UPDATE users
    SET status = 'banned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runAsync(sql, [userId]);
}

async function removeUser(userId) {
  const sql = `
    UPDATE users
    SET status = 'removed', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await runAsync(sql, [userId]);
}

async function restoreUser(userId) {
  const sql = `
    UPDATE users
    SET status = 'pending', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'removed'
  `;
  const result = await runAsync(sql, [userId]);
  return result.changes > 0;
}

async function getStatistics() {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned,
      SUM(CASE WHEN status = 'removed' THEN 1 ELSE 0 END) as removed,
      SUM(CASE WHEN join_type = 'ninja_region_family' THEN 1 ELSE 0 END) as ninja_region_family_count,
      SUM(CASE WHEN join_type = 'tiktok_game' THEN 1 ELSE 0 END) as tiktok_game_count
    FROM users
  `;
  return getAsync(sql, []);
}

module.exports = {
  createUser,
  getUserById,
  getUserByPhoneNumber,
  getUsersWithPagination,
  updateUserStatus,
  approveUser,
  banUser,
  removeUser,
  restoreUser,
  getStatistics,
};

const { query, queryOne } = require('../config/database');
const { generateId } = require('../utils/helpers');

const findById = (id) =>
  queryOne('SELECT * FROM users WHERE id = ?', [id]);

const findByEmail = (email) =>
  queryOne('SELECT * FROM users WHERE email = ?', [email]);

const findByUsername = (username) =>
  queryOne('SELECT * FROM users WHERE username = ?', [username]);

const findByEmailOrUsername = (identifier) =>
  queryOne('SELECT * FROM users WHERE email = ? OR username = ?', [identifier, identifier]);

const create = async ({ email, username, passwordHash, fullName, role = 'user' }) => {
  const id = generateId();
  await query(
    `INSERT INTO users (id, email, username, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, username, passwordHash, fullName, role]
  );
  return findById(id);
};

const updateLastLogin = (id) =>
  query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);

const updateProfile = (id, { fullName }) =>
  query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, id]);

const deactivate = (id) =>
  query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);

const saveRefreshToken = async (userId, tokenHash, expiresAt) => {
  const id = generateId();
  await query(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, tokenHash, expiresAt]
  );
};

const findRefreshToken = (tokenHash) =>
  queryOne(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()',
    [tokenHash]
  );

const revokeRefreshToken = (tokenHash) =>
  query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);

const revokeAllUserRefreshTokens = (userId) =>
  query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [userId]);

module.exports = {
  findById,
  findByEmail,
  findByUsername,
  findByEmailOrUsername,
  create,
  updateLastLogin,
  updateProfile,
  deactivate,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};

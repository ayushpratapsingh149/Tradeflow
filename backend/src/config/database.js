const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');

let pool = null;

const createPool = () => {
  if (pool) return pool;

  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    connectionLimit: config.db.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+00:00',
    dateStrings: false,
  });

  logger.info('MySQL connection pool created');
  return pool;
};

const getPool = () => {
  if (!pool) createPool();
  return pool;
};

const query = async (sql, params = []) => {
  const db = getPool();
  const [rows] = await db.execute(sql, params);
  return rows;
};

const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const transaction = async (callback) => {
  const db = getPool();
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const testConnection = async () => {
  try {
    const db = getPool();
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    logger.info('MySQL connection verified');
    return true;
  } catch (err) {
    logger.error('MySQL connection failed:', err.message);
    throw err;
  }
};

module.exports = { getPool, query, queryOne, transaction, testConnection, createPool };

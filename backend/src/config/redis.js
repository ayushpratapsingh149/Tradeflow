const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let client = null;

const createClient = () => {
  if (client) return client;

  const options = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  if (config.redis.password) {
    options.password = config.redis.password;
  }

  client = new Redis(options);

  client.on('connect', () => logger.info('Redis client connected'));
  client.on('ready', () => logger.info('Redis client ready'));
  client.on('error', (err) => logger.error('Redis client error:', err.message));
  client.on('close', () => logger.warn('Redis connection closed'));
  client.on('reconnecting', () => logger.info('Redis reconnecting...'));

  return client;
};

const getClient = () => {
  if (!client) createClient();
  return client;
};

const set = async (key, value, ttl = config.redis.ttl.medium) => {
  const c = getClient();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttl) {
    await c.setex(key, ttl, serialized);
  } else {
    await c.set(key, serialized);
  }
};

const get = async (key) => {
  const c = getClient();
  const val = await c.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

const del = async (...keys) => {
  const c = getClient();
  if (keys.length === 0) return;
  await c.del(...keys);
};

const delPattern = async (pattern) => {
  const c = getClient();
  const keys = await c.keys(pattern);
  if (keys.length > 0) {
    await c.del(...keys);
  }
  return keys.length;
};

const exists = async (key) => {
  const c = getClient();
  return (await c.exists(key)) === 1;
};

const expire = async (key, ttl) => {
  const c = getClient();
  await c.expire(key, ttl);
};

const incr = async (key) => {
  const c = getClient();
  return c.incr(key);
};

const testConnection = async () => {
  try {
    const c = getClient();
    await c.ping();
    logger.info('Redis connection verified');
    return true;
  } catch (err) {
    logger.error('Redis connection failed:', err.message);
    throw err;
  }
};

module.exports = {
  getClient,
  createClient,
  set,
  get,
  del,
  delPattern,
  exists,
  expire,
  incr,
  testConnection,
};

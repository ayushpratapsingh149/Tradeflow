const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'tradeflow',
    audience: 'tradeflow-client',
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'tradeflow',
    audience: 'tradeflow-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'tradeflow',
    audience: 'tradeflow-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'tradeflow',
    audience: 'tradeflow-client',
  });
};

const decodeToken = (token) => jwt.decode(token);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};

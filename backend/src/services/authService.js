const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepo = require('../repositories/userRepository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');
const { omit } = require('../utils/helpers');
const config = require('../config');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const register = async ({ email, username, password, fullName }) => {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw new ConflictError('Email already registered');

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) throw new ConflictError('Username already taken');

  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
  const user = await userRepo.create({ email, username, passwordHash, fullName });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await userRepo.saveRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user: omit(user, ['password_hash']),
    accessToken,
    refreshToken,
  };
};

const login = async ({ identifier, password }) => {
  const user = await userRepo.findByEmailOrUsername(identifier);
  if (!user) throw new UnauthorizedError('Invalid credentials');
  if (!user.is_active) throw new UnauthorizedError('Account deactivated');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  await userRepo.updateLastLogin(user.id);

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await userRepo.saveRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user: omit(user, ['password_hash']),
    accessToken,
    refreshToken,
  };
};

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await userRepo.findRefreshToken(tokenHash);
  if (!stored) throw new UnauthorizedError('Refresh token revoked or not found');

  await userRepo.revokeRefreshToken(tokenHash);

  const user = await userRepo.findById(decoded.sub);
  if (!user || !user.is_active) throw new UnauthorizedError('User not found or deactivated');

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ sub: user.id });

  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await userRepo.saveRefreshToken(user.id, newTokenHash, expiresAt);

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await userRepo.revokeRefreshToken(tokenHash);
};

const getMe = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return omit(user, ['password_hash']);
};

module.exports = { register, login, refresh, logout, getMe };

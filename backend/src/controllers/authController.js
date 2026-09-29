const authService = require('../services/authService');
const response = require('../utils/response');
const { asyncHandler } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } = req.body;
  const result = await authService.register({ email, username, password, fullName });
  return response.created(res, result, 'Registration successful');
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login({ identifier, password });
  return response.success(res, result, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  return response.success(res, result, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return response.success(res, null, 'Logged out successfully');
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return response.success(res, { user });
});

module.exports = { register, login, refresh, logout, me };

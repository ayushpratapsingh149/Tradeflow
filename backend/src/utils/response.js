const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const paginated = (res, items, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination,
  });
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const conflict = (res, message = 'Conflict') => {
  return error(res, message, 409);
};

module.exports = {
  success,
  created,
  paginated,
  error,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  conflict,
};

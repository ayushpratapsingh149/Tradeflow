const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry — resource already exists';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if (!err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  // Log non-operational (unexpected) errors
  if (!err.isOperational) {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
    });
  }

  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  // In development, expose stack trace
  if (config.env === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };

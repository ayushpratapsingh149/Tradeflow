const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

const stream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  config.env === 'production'
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
    : 'dev',
  { stream: config.env === 'production' ? stream : undefined }
);

module.exports = { requestLogger };

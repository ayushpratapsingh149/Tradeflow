const winston = require('winston');
const config = require('../config');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;

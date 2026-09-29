const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { testConnection: testDB } = require('./config/database');
const { testConnection: testRedis, createClient } = require('./config/redis');

const start = async () => {
  try {
    // Initialize connections
    createClient();
    await testDB();
    await testRedis();

    const server = app.listen(config.port, () => {
      logger.info(`TradeFlow API running on port ${config.port} [${config.env}]`);
      logger.info(`Base URL: http://localhost:${config.port}${config.apiPrefix}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

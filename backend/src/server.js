const { app, config } = require('./app');
const database = require('./config/database');
const { ensureSchema } = require('./database/schema');

let server;
let isShuttingDown = false;

async function bootstrap() {
  await database.waitForAvailability();
  await ensureSchema();

  server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });
}

async function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`Received ${signal}. Commencing graceful shutdown.`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await database.end();
  process.exit(exitCode);
}

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      console.error('Graceful shutdown failed:', error);
      process.exit(1);
    });
  });
});

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown('unhandledRejection', 1).catch((shutdownError) => {
    console.error('Forced shutdown after unhandled rejection:', shutdownError);
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException', 1).catch((shutdownError) => {
    console.error('Forced shutdown after uncaught exception:', shutdownError);
    process.exit(1);
  });
});

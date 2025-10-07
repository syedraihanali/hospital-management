const { app, config } = require('./app');
const database = require('./config/database');
const { ensureSchema } = require('./database/schema');

async function bootstrap() {
  await database.waitForAvailability();
  await ensureSchema();

  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

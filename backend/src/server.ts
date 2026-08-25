import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

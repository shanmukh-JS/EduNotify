import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDb } from './config/db.js';
import { startQueueWorker } from './services/queueProcessor.js';
import { startCronScheduler } from './scheduler/attendanceScheduler.js';

// Load configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for the React Frontend
app.use(cors());

// Configure Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets or visual health check
app.get('/', (req, res) => {
  res.json({
    name: 'EduNotify API Server',
    description: 'Intelligent Parent Communication & Attendance Management System Core',
    version: '1.0.0',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

// Mount Routing Tree
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[ExpressErrorHandler]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'A critical server error occurred.'
  });
});

// Bootstrapping function
const bootstrap = async () => {
  try {
    // 1. Initialize SQLite schema tables (if configured for SQLite dialect)
    await initDb();

    // 2. Launch background asynchronous queue worker (processes SMS/Email/Calls)
    startQueueWorker(5000); // Polls every 5s

    // 3. Launch Daily Cron Scheduler (12:00 PM auto-runs)
    startCronScheduler();

    // 4. Start HTTP Server listening on port
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` EduNotify Express server running on port: ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Environment: ${process.env.NODE_ENV}`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Critical failure during application startup:', err);
    process.exit(1);
  }
};

bootstrap();

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/db';
import { RecurringService } from './services/recurring.service';

const PORT = process.env.PORT || 5000;
const recurringService = new RecurringService();

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` MoneyMate API Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV}`);
  console.log(`===============================================`);

  // Process due recurring transactions on startup
  recurringService.processDueTransactions()
    .then((count) => console.log(`Processed ${count} due recurring transaction(s) on startup`))
    .catch((err) => console.error('Recurring transaction startup check failed:', err));
});

// Daily cron: check recurring transactions every 24 hours
const CRON_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(() => {
  recurringService.processDueTransactions()
    .then((count) => { if (count > 0) console.log(`Cron: processed ${count} recurring transaction(s)`); })
    .catch((err) => console.error('Recurring cron failed:', err));
}, CRON_INTERVAL);

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down server gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database client disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/error';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import categoryRoutes from './routes/category.routes';
import transactionRoutes from './routes/transaction.routes';
import budgetRoutes from './routes/budget.routes';
import savingGoalRoutes from './routes/saving-goal.routes';
import recurringRoutes from './routes/recurring.routes';
import notificationRoutes from './routes/notification.routes';
import attachmentRoutes from './routes/attachment.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import { requestId } from './middlewares/request-id';
import { getCopilotKitConfig } from './config/copilotkit';
import { getConfiguredFrontendOrigins, isAllowedCorsOrigin } from './config/cors';
import { createCopilotKitRouter } from './copilotkit/runtime';
import { COPILOT_REQUEST_BODY_LIMIT, copilotBodyParserErrorHandler } from './copilotkit/security';

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const copilotKitConfig = getCopilotKitConfig();

const configuredOrigins = getConfiguredFrontendOrigins();

// Middlewares
app.use(requestId);
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedCorsOrigin(origin, configuredOrigins)),
  credentials: true
}));
app.use('/api/copilotkit', express.json({ limit: COPILOT_REQUEST_BODY_LIMIT }));
app.use('/api/copilotkit', copilotBodyParserErrorHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MoneyMate API Docs',
}));

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/saving-goals', savingGoalRoutes);
app.use('/api/recurring-transactions', recurringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

if (copilotKitConfig.enabled) {
  app.use(createCopilotKitRouter(copilotKitConfig));
}

// Global Error Handler Middleware
app.use(errorHandler);

export default app;

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import { getPool } from './config/database.js';
import { checkMaintenanceMode } from './middleware/maintenance.middleware.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import contentRoutes from './routes/content.routes.js';
import sharingRoutes from './routes/sharing.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import templateRoutes from './routes/template.routes.js';
import contactRoutes from './routes/contact.routes.js';
import contactGroupRoutes from './routes/contact-group.routes.js';
import followupRoutes from './routes/followup.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
dotenv.config();

const logger = createLogger('Server');
const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Maintenance mode check (before routes, but after health check)
app.use(checkMaintenanceMode);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await getPool(); // Test DB connection
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// API version endpoint
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'UnFranchise Marketing App API',
    version: '1.0.0',
    description: 'Content sharing and engagement platform for UFOs'
  });
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// User self-service routes
app.use('/api/v1/users', usersRoutes);

// Content routes
app.use('/api/v1/content', contentRoutes);

// Sharing routes
app.use('/api/v1/share', sharingRoutes);

// Analytics routes
app.use('/api/v1/analytics', analyticsRoutes);

// Template routes
app.use('/api/v1/templates', templateRoutes);

// Contact routes
app.use('/api/v1/contacts', contactRoutes);

// Contact group routes
app.use('/api/v1/contact-groups', contactGroupRoutes);

// Follow-up routes
app.use('/api/v1/followups', followupRoutes);

// Admin routes
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API: http://localhost:${port}/api/v1`);
});

export default app;

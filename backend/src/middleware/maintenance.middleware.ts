import { Request, Response, NextFunction } from 'express';
import maintenanceService from '../services/maintenance.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('MaintenanceMiddleware');

/**
 * Check if system is in maintenance mode
 * Allow admin routes to bypass maintenance mode
 */
export async function checkMaintenanceMode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Allow health check and status endpoints
    if (req.path === '/health' || req.path === '/api/v1/status') {
      next();
      return;
    }

    // Allow admin routes to bypass maintenance mode
    if (req.path.startsWith('/api/v1/admin')) {
      next();
      return;
    }

    // Check maintenance mode
    const isMaintenanceMode = await maintenanceService.isMaintenanceMode();

    if (isMaintenanceMode) {
      const message = await maintenanceService.getMaintenanceMessage();

      logger.warn(`Request blocked due to maintenance mode: ${req.method} ${req.path}`);

      res.status(503).json({
        error: 'Service Unavailable',
        message,
        maintenanceMode: true
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    // Don't block request if we can't check maintenance mode
    next();
  }
}

/**
 * Optional middleware to add maintenance status to response headers
 */
export async function addMaintenanceHeader(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isMaintenanceMode = await maintenanceService.isMaintenanceMode();
    res.setHeader('X-Maintenance-Mode', isMaintenanceMode ? 'true' : 'false');
    next();
  } catch (error) {
    logger.error('Error adding maintenance header:', error);
    next();
  }
}

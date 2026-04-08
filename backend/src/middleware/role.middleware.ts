/**
 * Role-based authorization middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('RoleMiddleware');

/**
 * Middleware to require specific roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // User should be attached by authenticateToken middleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.roleName || req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn(`User ${req.user.userId} with role ${userRole} attempted to access restricted resource`);
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in role middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Middleware to check if user is an admin (CorporateAdmin or SuperAdmin)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(['CorporateAdmin', 'SuperAdmin'])(req, res, next);
}

/**
 * Middleware to check if user is a super admin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(['SuperAdmin'])(req, res, next);
}

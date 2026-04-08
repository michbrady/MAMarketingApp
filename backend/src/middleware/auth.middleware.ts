import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AuthMiddleware');

/**
 * Authenticate JWT token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Get user details
    const users = await query(`
      SELECT
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        u.RoleID,
        r.RoleName,
        u.Status,
        m.MarketCode as Market
      FROM [User] u
      LEFT JOIN [Role] r ON u.RoleID = r.RoleID
      LEFT JOIN Market m ON u.MarketID = m.MarketID
      WHERE u.UserID = @userId AND u.Status = 'Active'
    `, { userId: payload.userId });

    if (users.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive'
      });
      return;
    }

    const user = users[0];

    // Attach user to request
    (req as any).user = {
      userId: user.UserID,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      roleId: user.RoleID,
      roleName: user.RoleName,
      market: user.Market
    };

    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Authorize user role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
      return;
    }

    const userRole = user.roleName;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (payload) {
      const users = await query(`
        SELECT UserID, Email, FirstName, LastName, RoleID
        FROM [User]
        WHERE UserID = @userId AND Status = 'Active'
      `, { userId: payload.userId });

      if (users.length > 0) {
        (req as any).user = users[0];
      }
    }

    next();

  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
}

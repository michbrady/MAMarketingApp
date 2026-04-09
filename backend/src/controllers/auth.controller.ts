import { Request, Response } from 'express';
import authService from '../services/auth.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AuthController');

export class AuthController {
  /**
   * Login endpoint
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, countryCode, languageCode } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password are required'
        });
        return;
      }

      // Authenticate with optional locale parameters
      const result = await authService.login(email, password, countryCode, languageCode);

      if (!result.success) {
        res.status(401).json({
          error: 'Unauthorized',
          message: result.message || 'Authentication failed'
        });
        return;
      }

      // Success
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authentication'
      });
    }
  }

  /**
   * Refresh token endpoint
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Refresh token is required'
        });
        return;
      }

      const result = await authService.refreshAccessToken(refreshToken);

      if (!result.success) {
        res.status(401).json({
          error: 'Unauthorized',
          message: result.message || 'Invalid refresh token'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          token: result.token
        }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while refreshing token'
      });
    }
  }

  /**
   * Logout endpoint
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        });
        return;
      }

      await authService.logout(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during logout'
      });
    }
  }

  /**
   * Get current user endpoint
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        });
        return;
      }

      // Log for debugging auth issues
      logger.info('Auth /me endpoint called:', {
        userId: user.userId,
        email: user.email,
        roleName: user.roleName,
        timestamp: new Date().toISOString()
      });

      // Map backend user format to frontend expected format
      const frontendUser = {
        id: user.userId?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.roleName,
        locale: user.locale || 'en-US',
        market: user.market,
        timezone: user.timezone,
        dateFormat: user.dateFormat,
        createdAt: new Date().toISOString() // Default to current time
      };

      res.status(200).json({
        success: true,
        user: frontendUser  // Return user directly, not nested in data
      });

    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching user data'
      });
    }
  }
}

export default new AuthController();

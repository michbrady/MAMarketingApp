import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import localeService from './locale.service.js';

const logger = createLogger('AuthService');

interface User {
  UserID: number;
  Email: string;
  PasswordHash: string;
  FirstName: string;
  LastName: string;
  RoleID: number;
  RoleName?: string;
  Status: string;
  TimeZone?: string;
  Market?: string;
  PreferredLocale?: string;
  MarketID?: number;
}

interface LoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    locale?: string;
    market?: string;
  };
  message?: string;
}

export class AuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || 'dev_secret_key';
  private readonly JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Authenticate user with email and password
   */
  async login(
    email: string,
    password: string,
    countryCode?: string,
    languageCode?: string
  ): Promise<LoginResult> {
    try {
      logger.info(`Login attempt for: ${email}`);

      // Get user from database
      const users = await query<User>(`
        SELECT
          u.UserID,
          u.Email,
          u.PasswordHash,
          u.FirstName,
          u.LastName,
          u.RoleID,
          u.MarketID,
          r.RoleName,
          u.Status,
          u.TimeZone,
          u.PreferredLocale,
          m.MarketCode as Market
        FROM [User] u
        LEFT JOIN [Role] r ON u.RoleID = r.RoleID
        LEFT JOIN Market m ON u.MarketID = m.MarketID
        WHERE u.Email = @email
      `, { email });

      if (users.length === 0) {
        logger.warn(`Login failed: User not found - ${email}`);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      const user = users[0];

      // Check if user is active
      if (user.Status !== 'Active') {
        logger.warn(`Login failed: User not active - ${email}, Status: ${user.Status}`);
        return {
          success: false,
          message: 'Account is disabled'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.PasswordHash);

      if (!isValidPassword) {
        logger.warn(`Login failed: Invalid password - ${email}`);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Determine user's locale
      let locale = user.PreferredLocale;

      // If no preferred locale set, determine from service codes or market default
      if (!locale) {
        if (countryCode && languageCode) {
          // Map service codes to BCP 47 locale
          locale = localeService.mapServiceCodeToLocale(countryCode, languageCode);

          // Update user's preferred locale in database
          try {
            await query(`
              UPDATE [User]
              SET PreferredLocale = @locale
              WHERE UserID = @userId
            `, { locale, userId: user.UserID });
            logger.info(`Updated preferred locale for user ${email} to ${locale}`);
          } catch (error) {
            logger.error(`Failed to update preferred locale for user ${email}:`, error);
          }
        } else if (user.Market) {
          // Get default locale for user's market
          locale = await localeService.getDefaultLocale(user.Market);
        } else {
          // Fallback to en-US
          locale = 'en-US';
        }
      }

      // Generate tokens with locale
      const token = this.generateToken(user, locale);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`Login successful for: ${email} with locale: ${locale}`);

      return {
        success: true,
        token,
        refreshToken,
        user: {
          id: user.UserID,
          email: user.Email,
          firstName: user.FirstName,
          lastName: user.LastName,
          role: user.RoleName || 'UFO',
          locale,
          market: user.Market
        }
      };

    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access token
   */
  private generateToken(user: User, locale?: string): string {
    const payload = {
      userId: user.UserID,
      email: user.Email,
      role: user.RoleID,
      locale: locale || user.PreferredLocale || 'en-US',
      type: 'access'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.UserID,
      email: user.Email,
      type: 'refresh'
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.warn('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      if (!payload) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      // Get user
      const users = await query<User>(`
        SELECT UserID, Email, RoleID, Status, PreferredLocale
        FROM [User]
        WHERE UserID = @userId AND Status = 'Active'
      `, { userId: payload.userId });

      if (users.length === 0) {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      const user = users[0];
      const newToken = this.generateToken(user);

      return {
        success: true,
        token: newToken
      };

    } catch (error) {
      logger.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(userId: number): Promise<boolean> {
    try {
      logger.info(`User logged out: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      return false;
    }
  }
}

export default new AuthService();

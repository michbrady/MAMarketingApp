import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import * as database from '../../config/database';
import { createMockUser } from '../../__tests__/helpers/test-utils';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockUser = createMockUser({
        Email: 'test@example.com',
        PasswordHash: await bcrypt.hash('password123', 10),
        Status: 'Active'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should fail with invalid email', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await authService.login('nonexistent@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
    });

    it('should fail with invalid password', async () => {
      // Arrange
      const mockUser = createMockUser({
        Email: 'test@example.com',
        PasswordHash: await bcrypt.hash('correctpassword', 10),
        Status: 'Active'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.login('test@example.com', 'wrongpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
      expect(result.token).toBeUndefined();
    });

    it('should fail with inactive user', async () => {
      // Arrange
      const mockUser = createMockUser({
        Email: 'test@example.com',
        PasswordHash: await bcrypt.hash('password123', 10),
        Status: 'Inactive'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('disabled');
      expect(result.token).toBeUndefined();
    });

    it('should fail with suspended user', async () => {
      // Arrange
      const mockUser = createMockUser({
        Email: 'test@example.com',
        PasswordHash: await bcrypt.hash('password123', 10),
        Status: 'Suspended'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('disabled');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      vi.mocked(database.query).mockRejectedValueOnce(new Error('Database connection error'));

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Database connection error');
    });

    it('should include user role in response', async () => {
      // Arrange
      const mockUser = createMockUser({
        Email: 'admin@example.com',
        PasswordHash: await bcrypt.hash('password123', 10),
        Status: 'Active',
        RoleName: 'Admin'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.login('admin@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('Admin');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 2,
        type: 'access'
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret_key_for_testing');

      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.type).toBe('access');
    });

    it('should reject expired token', () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 2,
        type: 'access'
      };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'test_secret_key_for_testing',
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure expiration
      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject invalid signature', () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 2,
        type: 'access'
      };
      const token = jwt.sign(payload, 'wrong_secret');

      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should reject malformed token', () => {
      // Act
      const result = authService.verifyToken('not.a.valid.token');

      // Assert
      expect(result).toBeNull();
    });

    it('should reject empty token', () => {
      // Act
      const result = authService.verifyToken('');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        type: 'refresh'
      };
      const token = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key'
      );

      // Act
      const result = authService.verifyRefreshToken(token);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.type).toBe('refresh');
    });

    it('should reject invalid refresh token', () => {
      // Arrange
      const token = jwt.sign(
        { userId: 1 },
        'wrong_secret'
      );

      // Act
      const result = authService.verifyRefreshToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        type: 'refresh'
      };
      const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key'
      );

      const mockUser = createMockUser({
        UserID: 1,
        Email: 'test@example.com',
        Status: 'Active'
      });

      vi.mocked(database.query).mockResolvedValueOnce([mockUser]);

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should fail with invalid refresh token', async () => {
      // Act
      const result = await authService.refreshAccessToken('invalid_token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
      expect(result.token).toBeUndefined();
    });

    it('should fail with inactive user', async () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        type: 'refresh'
      };
      const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key'
      );

      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found or inactive');
    });

    it('should handle database errors', async () => {
      // Arrange
      const payload = {
        userId: 1,
        email: 'test@example.com',
        type: 'refresh'
      };
      const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key'
      );

      vi.mocked(database.query).mockRejectedValueOnce(new Error('Database error'));

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to refresh');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Act
      const result = await authService.logout(1);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle logout errors gracefully', async () => {
      // This is a simple method, but we ensure it doesn't throw
      // Act
      const result = await authService.logout(999);

      // Assert
      expect(result).toBe(true);
    });
  });
});

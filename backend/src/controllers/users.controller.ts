/**
 * Users Controller
 * Handles user self-service operations (profile, settings, preferences)
 */

import { Request, Response } from 'express';
import { UsersService } from '../services/users.service.js';
import { createLogger } from '../utils/logger.js';
import { z } from 'zod';

const logger = createLogger('UsersController');
const usersService = new UsersService();

// Validation schemas
const profileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phoneNumber: z.string().max(20).optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean().optional().default(true),
  engagementAlerts: z.boolean(),
  contentUpdates: z.boolean(),
});

const preferencesSchema = z.object({
  language: z.enum(['en', 'es', 'fr', 'de']),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  defaultView: z.enum(['grid', 'list']),
});

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors,
      });
      return;
    }

    const updatedUser = await usersService.updateProfile(userId, validation.data);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update user password
 */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validation = passwordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors,
      });
      return;
    }

    await usersService.updatePassword(
      userId,
      validation.data.currentPassword,
      validation.data.newPassword
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error('Error updating password:', error);
    if (error instanceof Error && error.message === 'Invalid current password') {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update notification preferences
 */
export const updateNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validation = notificationsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors,
      });
      return;
    }

    await usersService.updateNotifications(userId, validation.data);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    logger.error('Error updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update user preferences
 */
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validation = preferencesSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors,
      });
      return;
    }

    await usersService.updatePreferences(userId, validation.data);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * User Self-Service Routes
 * Routes for authenticated users to manage their own profile and settings
 */

import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication (user updating their own profile)
router.use(authenticate);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Authenticated user
 * @body    { firstName, lastName, email, phoneNumber? }
 */
router.put('/profile', usersController.updateProfile);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change current user's password
 * @access  Authenticated user
 * @body    { currentPassword, newPassword }
 */
router.put('/password', usersController.updatePassword);

/**
 * @route   PUT /api/v1/users/notifications
 * @desc    Update notification preferences
 * @access  Authenticated user
 * @body    { emailNotifications, smsNotifications, pushNotifications, weeklyDigest, engagementAlerts, contentUpdates }
 */
router.put('/notifications', usersController.updateNotifications);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Authenticated user
 * @body    { language, timezone, dateFormat, defaultView }
 */
router.put('/preferences', usersController.updatePreferences);

export default router;

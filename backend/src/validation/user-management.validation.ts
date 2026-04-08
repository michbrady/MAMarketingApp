/**
 * User Management Validation Schemas
 * Zod schemas for validating user management requests
 */

import { z } from 'zod';

/**
 * Password validation schema
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 */
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters');

/**
 * Create User Request Schema
 */
export const createUserSchema = z.object({
  memberId: z.string()
    .min(1, 'Member ID is required')
    .max(50, 'Member ID must not exceed 50 characters'),
  email: emailSchema,
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  mobile: z.string()
    .max(20, 'Mobile must not exceed 20 characters')
    .optional(),
  password: passwordSchema,
  roleId: z.number()
    .int('Role ID must be an integer')
    .positive('Role ID must be positive'),
  marketId: z.number()
    .int('Market ID must be an integer')
    .positive('Market ID must be positive'),
  preferredLanguageId: z.number()
    .int('Language ID must be an integer')
    .positive('Language ID must be positive'),
  timeZone: z.string()
    .max(50, 'Time zone must not exceed 50 characters')
    .optional()
});

/**
 * Update User Request Schema
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must not exceed 100 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must not exceed 100 characters')
    .optional(),
  mobile: z.string()
    .max(20, 'Mobile must not exceed 20 characters')
    .optional(),
  roleId: z.number()
    .int('Role ID must be an integer')
    .positive('Role ID must be positive')
    .optional(),
  marketId: z.number()
    .int('Market ID must be an integer')
    .positive('Market ID must be positive')
    .optional(),
  preferredLanguageId: z.number()
    .int('Language ID must be an integer')
    .positive('Language ID must be positive')
    .optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'PendingVerification'])
    .optional(),
  timeZone: z.string()
    .max(50, 'Time zone must not exceed 50 characters')
    .optional(),
  profileImageURL: z.string()
    .url('Invalid URL format')
    .max(500, 'URL must not exceed 500 characters')
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

/**
 * User Filters Schema
 */
export const userFiltersSchema = z.object({
  roleId: z.number().int().positive().optional(),
  role: z.string().max(100).optional(),
  marketId: z.number().int().positive().optional(),
  market: z.string().max(50).optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'PendingVerification']).optional(),
  search: z.string().max(255).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['name', 'email', 'createdDate', 'lastLoginDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

/**
 * Assign Role Schema
 */
export const assignRoleSchema = z.object({
  roleId: z.number()
    .int('Role ID must be an integer')
    .positive('Role ID must be positive')
});

/**
 * Assign Market Schema
 */
export const assignMarketSchema = z.object({
  marketId: z.number()
    .int('Market ID must be an integer')
    .positive('Market ID must be positive')
});

/**
 * Bulk Update Status Schema
 */
export const bulkUpdateStatusSchema = z.object({
  userIds: z.array(z.number().int().positive())
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot update more than 100 users at once'),
  status: z.enum(['Active', 'Inactive'])
});

/**
 * Bulk Assign Role Schema
 */
export const bulkAssignRoleSchema = z.object({
  userIds: z.array(z.number().int().positive())
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot update more than 100 users at once'),
  roleId: z.number()
    .int('Role ID must be an integer')
    .positive('Role ID must be positive')
});

/**
 * Bulk Delete Schema
 */
export const bulkDeleteSchema = z.object({
  userIds: z.array(z.number().int().positive())
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot delete more than 100 users at once')
});

/**
 * Create Role Schema
 */
export const createRoleSchema = z.object({
  roleName: z.string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must not exceed 50 characters'),
  roleDescription: z.string()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  permissionLevel: z.number()
    .int('Permission level must be an integer')
    .min(1, 'Permission level must be at least 1')
    .max(999, 'Permission level must not exceed 999')
});

/**
 * Update Role Schema
 */
export const updateRoleSchema = z.object({
  roleName: z.string()
    .min(1, 'Role name cannot be empty')
    .max(50, 'Role name must not exceed 50 characters')
    .optional(),
  roleDescription: z.string()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  permissionLevel: z.number()
    .int('Permission level must be an integer')
    .min(1, 'Permission level must be at least 1')
    .max(999, 'Permission level must not exceed 999')
    .optional(),
  isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

/**
 * Audit Log Filters Schema
 */
export const auditLogFiltersSchema = z.object({
  userId: z.number().int().positive().optional(),
  entityType: z.string().max(100).optional(),
  action: z.string().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  securityFlag: z.boolean().optional(),
  complianceFlag: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

/**
 * User Activity Query Schema
 */
export const userActivitySchema = z.object({
  days: z.number()
    .int('Days must be an integer')
    .positive('Days must be positive')
    .max(365, 'Cannot query more than 365 days')
    .optional()
    .default(30)
});

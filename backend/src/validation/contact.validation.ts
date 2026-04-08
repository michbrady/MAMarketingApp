/**
 * Contact Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from 'zod';

// Contact status enum
const contactStatusEnum = z.enum(['Active', 'Inactive', 'DoNotContact', 'Bounced']);

// Phone number regex (flexible format - accepts various formats)
const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;

/**
 * Create Contact Schema
 */
export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  mobile: z.string().regex(phoneRegex, 'Invalid phone number format').max(20).optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  relationshipType: z.string().max(50).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  status: contactStatusEnum.optional()
}).refine((data) => {
  // Either email or mobile must be provided
  return data.email || data.mobile;
}, {
  message: 'Either email or mobile is required'
});

/**
 * Update Contact Schema
 */
export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  mobile: z.string().regex(phoneRegex, 'Invalid phone number format').max(20).optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  relationshipType: z.string().max(50).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  status: contactStatusEnum.optional(),
  lastContactDate: z.string().datetime().or(z.date()).optional().nullable(),
  nextFollowUpDate: z.string().datetime().or(z.date()).optional().nullable()
});

/**
 * Contact Filters Query Schema
 */
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  status: contactStatusEnum.optional(),
  relationshipType: z.string().optional(),
  tags: z.string().transform((val) => val.split(',')).optional(),
  hasEmail: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  hasMobile: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  minEngagementScore: z.string().transform(Number).optional(),
  lastEngagementFrom: z.string().datetime().optional(),
  lastEngagementTo: z.string().datetime().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
  sortBy: z.enum(['createdDate', 'updatedDate', 'lastEngagementDate', 'engagementScore', 'lastName']).default('updatedDate'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
});

/**
 * Search Contacts Query Schema
 */
export const searchContactsSchema = z.object({
  q: z.string().min(1, 'Search query is required')
});

/**
 * Add Tag Schema
 */
export const addTagSchema = z.object({
  tag: z.string().min(1).max(100)
});

/**
 * Import Contacts Schema
 */
export const importContactsSchema = z.object({
  contacts: z.array(z.object({
    firstName: z.string().min(1).max(100).optional().nullable(),
    lastName: z.string().min(1).max(100).optional().nullable(),
    email: z.string().email().max(255).optional().nullable(),
    mobile: z.string().regex(phoneRegex, 'Invalid phone number format').max(20).optional().nullable(),
    companyName: z.string().max(200).optional().nullable(),
    jobTitle: z.string().max(100).optional().nullable(),
    relationshipType: z.string().max(50).optional().nullable(),
    tags: z.string().optional(), // Comma-separated tags
    status: contactStatusEnum.optional()
  }).refine((data) => {
    return data.email || data.mobile;
  }, {
    message: 'Either email or mobile is required'
  })).min(1, 'At least one contact is required')
});

/**
 * Export Contacts Query Schema
 */
export const exportContactsSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv')
});

/**
 * Create Contact Group Schema
 */
export const createContactGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(200),
  description: z.string().max(1000).optional().nullable()
});

/**
 * Update Contact Group Schema
 */
export const updateContactGroupSchema = z.object({
  groupName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable()
}).refine((data) => {
  // At least one field must be provided
  return data.groupName !== undefined || data.description !== undefined;
}, {
  message: 'At least one field must be provided for update'
});

/**
 * Add Contacts to Group Schema
 */
export const addContactsToGroupSchema = z.object({
  contactIds: z.array(z.number().int().positive()).min(1, 'At least one contact ID is required')
});

/**
 * Template Validation Schemas
 */

import { z } from 'zod';

export const createTemplateSchema = z.object({
  TemplateName: z.string().min(1).max(100),
  TemplateDescription: z.string().max(500).optional(),
  ShareChannel: z.enum(['SMS', 'Email', 'Social']),
  SocialPlatform: z.enum(['Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp', 'WeChat']).optional(),
  ContentType: z.enum(['Product', 'BusinessOpportunity', 'Event', 'General']).optional(),
  SubjectTemplate: z.string().max(255).optional(),
  MessageTemplate: z.string().min(1),
  HTMLTemplate: z.string().optional(),
  IsDefault: z.boolean().optional(),
  MaxCharacters: z.number().int().positive().optional(),
  MarketID: z.number().int().positive().optional(),
  LanguageID: z.number().int().positive().optional(),
}).refine((data) => {
  // Email templates should have a subject
  if (data.ShareChannel === 'Email' && !data.SubjectTemplate) {
    return false;
  }
  // Social templates should have a platform
  if (data.ShareChannel === 'Social' && !data.SocialPlatform) {
    return false;
  }
  // SMS should have character limit
  if (data.ShareChannel === 'SMS' && data.MessageTemplate.length > 160) {
    return false;
  }
  return true;
}, {
  message: 'Invalid template configuration for the selected channel',
});

export const updateTemplateSchema = z.object({
  TemplateName: z.string().min(1).max(100).optional(),
  TemplateDescription: z.string().max(500).optional(),
  SubjectTemplate: z.string().max(255).optional(),
  MessageTemplate: z.string().min(1).optional(),
  HTMLTemplate: z.string().optional(),
  IsDefault: z.boolean().optional(),
  IsActive: z.boolean().optional(),
  MaxCharacters: z.number().int().positive().optional(),
});

export const templatePreviewSchema = z.object({
  ShareTemplateID: z.number().int().positive().optional(),
  MessageTemplate: z.string().optional(),
  SubjectTemplate: z.string().optional(),
  HTMLTemplate: z.string().optional(),
  Variables: z.record(z.string()).default({}),
});

export const getTemplatesQuerySchema = z.object({
  ShareChannel: z.enum(['SMS', 'Email', 'Social']).optional(),
  ContentType: z.enum(['Product', 'BusinessOpportunity', 'Event', 'General']).optional(),
  SocialPlatform: z.enum(['Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp', 'WeChat']).optional(),
  IsActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  IsDefault: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  MarketID: z.string().transform(Number).optional(),
  LanguageID: z.string().transform(Number).optional(),
});

export const getDefaultTemplateQuerySchema = z.object({
  ShareChannel: z.enum(['SMS', 'Email', 'Social']),
  ContentType: z.enum(['Product', 'BusinessOpportunity', 'Event', 'General']).optional(),
  SocialPlatform: z.enum(['Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp', 'WeChat']).optional(),
  MarketID: z.string().transform(Number).optional(),
  LanguageID: z.string().transform(Number).optional(),
});

/**
 * Audit Log Controller
 * Handles HTTP requests for audit log operations
 */

import { Request, Response } from 'express';
import auditLogService from '../services/audit-log.service.js';
import { createLogger } from '../utils/logger.js';
import { auditLogFiltersSchema } from '../validation/user-management.validation.js';

const logger = createLogger('AuditLogController');

/**
 * Get audit logs
 */
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    // Validate and parse query parameters
    const validatedQuery = auditLogFiltersSchema.parse({
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      entityType: req.query.entityType,
      action: req.query.action,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      securityFlag: req.query.securityFlag ? req.query.securityFlag === 'true' : undefined,
      complianceFlag: req.query.complianceFlag ? req.query.complianceFlag === 'true' : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50
    });

    const { page, limit, dateFrom, dateTo, ...filters } = validatedQuery;

    // Convert date strings to Date objects if provided
    const parsedFilters = {
      ...filters,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    };

    const result = await auditLogService.getAuditLogs(
      parsedFilters,
      { page: page || 1, limit: limit || 50 }
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error getting audit logs:', error);
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to retrieve audit logs'
    });
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    // Validate and parse query parameters
    const validatedQuery = auditLogFiltersSchema.parse({
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      entityType: req.query.entityType,
      action: req.query.action,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      securityFlag: req.query.securityFlag ? req.query.securityFlag === 'true' : undefined,
      complianceFlag: req.query.complianceFlag ? req.query.complianceFlag === 'true' : undefined
    });

    const { page, limit, dateFrom, dateTo, ...filters } = validatedQuery;

    // Convert date strings to Date objects if provided
    const parsedFilters = {
      ...filters,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    };

    const csv = await auditLogService.exportAuditLogs(parsedFilters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Error exporting audit logs:', error);
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to export audit logs'
    });
  }
}

/**
 * Get security logs
 */
export async function getSecurityLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const result = await auditLogService.getSecurityLogs({ page, limit });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error getting security logs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve security logs'
    });
  }
}

/**
 * Get compliance logs
 */
export async function getComplianceLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const result = await auditLogService.getComplianceLogs({ page, limit });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('Error getting compliance logs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve compliance logs'
    });
  }
}

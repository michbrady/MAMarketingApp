/**
 * Audit Log Routes
 * Routes for audit log operations
 */

import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import * as auditLogController from '../controllers/audit-log.controller.js';

const router = Router();

// Note: Authentication is handled by parent admin router

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  CorporateAdmin, SuperAdmin
 * @query   userId?, entityType?, action?, dateFrom?, dateTo?, securityFlag?, complianceFlag?, page?, limit?
 */
router.get('/', auditLogController.getAuditLogs);

/**
 * @route   GET /api/v1/admin/audit-logs/export
 * @desc    Export audit logs to CSV
 * @access  CorporateAdmin, SuperAdmin
 * @query   userId?, entityType?, action?, dateFrom?, dateTo?, securityFlag?, complianceFlag?
 */
router.get('/export', auditLogController.exportAuditLogs);

/**
 * @route   GET /api/v1/admin/audit-logs/security
 * @desc    Get security-flagged audit logs
 * @access  SuperAdmin
 * @query   page?, limit?
 */
router.get('/security', authorize('SuperAdmin'), auditLogController.getSecurityLogs);

/**
 * @route   GET /api/v1/admin/audit-logs/compliance
 * @desc    Get compliance-flagged audit logs
 * @access  CorporateAdmin, SuperAdmin
 * @query   page?, limit?
 */
router.get('/compliance', auditLogController.getComplianceLogs);

export default router;

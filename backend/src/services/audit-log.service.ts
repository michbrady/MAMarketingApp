/**
 * Audit Log Service
 * Service for logging and retrieving audit logs for compliance and security
 */

import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  AuditLog,
  AuditLogFilters,
  CreateAuditLogRequest,
  PaginatedResponse,
  PaginationParams
} from '../types/user-management.types.js';

const logger = createLogger('AuditLogService');

export class AuditLogService {
  /**
   * Log an audit event
   */
  async logAction(
    request: CreateAuditLogRequest
  ): Promise<number> {
    try {
      const oldValuesJson = request.oldValues ? JSON.stringify(request.oldValues) : null;
      const newValuesJson = request.newValues ? JSON.stringify(request.newValues) : null;

      const result = await query<{ AuditLogID: number }>(`
        INSERT INTO dbo.AuditLog (
          UserID,
          UserEmail,
          EntityType,
          EntityID,
          Action,
          Description,
          OldValues,
          NewValues,
          IPAddress,
          UserAgent,
          SessionID,
          ComplianceFlag,
          SecurityFlag
        )
        VALUES (
          @userId,
          @userEmail,
          @entityType,
          @entityId,
          @action,
          @description,
          @oldValues,
          @newValues,
          @ipAddress,
          @userAgent,
          @sessionId,
          @complianceFlag,
          @securityFlag
        );
        SELECT SCOPE_IDENTITY() as AuditLogID;
      `, {
        userId: request.userId || null,
        userEmail: request.userEmail || null,
        entityType: request.entityType,
        entityId: request.entityId || null,
        action: request.action,
        description: request.description || null,
        oldValues: oldValuesJson,
        newValues: newValuesJson,
        ipAddress: request.ipAddress || null,
        userAgent: request.userAgent || null,
        sessionId: request.sessionId || null,
        complianceFlag: request.complianceFlag || false,
        securityFlag: request.securityFlag || false
      });

      const auditLogId = result[0]?.AuditLogID;
      logger.info(`Audit log created: ${auditLogId} - ${request.action} on ${request.entityType}`);

      return auditLogId;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Log user management action
   */
  async logUserAction(
    action: string,
    performedBy: number,
    performedByEmail: string,
    targetUserId?: number,
    details?: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<number> {
    return this.logAction({
      userId: performedBy,
      userEmail: performedByEmail,
      entityType: 'User',
      entityId: targetUserId,
      action,
      description: details,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      complianceFlag: true,
      securityFlag: ['UserDeleted', 'RoleChanged', 'UserDeactivated', 'PasswordReset'].includes(action)
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    filters: AuditLogFilters = {},
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<AuditLog>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ['1=1'];
      const params: any = {
        offset,
        limit
      };

      if (filters.userId) {
        conditions.push('UserID = @userId');
        params.userId = filters.userId;
      }

      if (filters.entityType) {
        conditions.push('EntityType = @entityType');
        params.entityType = filters.entityType;
      }

      if (filters.action) {
        conditions.push('Action = @action');
        params.action = filters.action;
      }

      if (filters.dateFrom) {
        conditions.push('EventDate >= @dateFrom');
        params.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        conditions.push('EventDate <= @dateTo');
        params.dateTo = filters.dateTo;
      }

      if (filters.securityFlag !== undefined) {
        conditions.push('SecurityFlag = @securityFlag');
        params.securityFlag = filters.securityFlag;
      }

      if (filters.complianceFlag !== undefined) {
        conditions.push('ComplianceFlag = @complianceFlag');
        params.complianceFlag = filters.complianceFlag;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countResult = await query<{ Total: number }>(`
        SELECT COUNT(*) as Total
        FROM dbo.AuditLog
        WHERE ${whereClause}
      `, params);

      const total = countResult[0]?.Total || 0;

      // Get paginated data
      const logs = await query<any>(`
        SELECT
          AuditLogID as auditLogId,
          UserID as userId,
          UserEmail as userEmail,
          EntityType as entityType,
          EntityID as entityId,
          Action as action,
          Description as description,
          OldValues as oldValues,
          NewValues as newValues,
          IPAddress as ipAddress,
          UserAgent as userAgent,
          SessionID as sessionId,
          ComplianceFlag as complianceFlag,
          SecurityFlag as securityFlag,
          EventDate as eventDate
        FROM dbo.AuditLog
        WHERE ${whereClause}
        ORDER BY EventDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, params);

      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: number,
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({ userId }, pagination);
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(
    entityType: string,
    entityId: number,
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<AuditLog>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query<{ Total: number }>(`
        SELECT COUNT(*) as Total
        FROM dbo.AuditLog
        WHERE EntityType = @entityType AND EntityID = @entityId
      `, { entityType, entityId });

      const total = countResult[0]?.Total || 0;

      // Get paginated data
      const logs = await query<any>(`
        SELECT
          AuditLogID as auditLogId,
          UserID as userId,
          UserEmail as userEmail,
          EntityType as entityType,
          EntityID as entityId,
          Action as action,
          Description as description,
          OldValues as oldValues,
          NewValues as newValues,
          IPAddress as ipAddress,
          UserAgent as userAgent,
          SessionID as sessionId,
          ComplianceFlag as complianceFlag,
          SecurityFlag as securityFlag,
          EventDate as eventDate
        FROM dbo.AuditLog
        WHERE EntityType = @entityType AND EntityID = @entityId
        ORDER BY EventDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, { entityType, entityId, offset, limit });

      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting entity audit logs:', error);
      throw new Error('Failed to retrieve entity audit logs');
    }
  }

  /**
   * Get security-flagged audit logs
   */
  async getSecurityLogs(
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({ securityFlag: true }, pagination);
  }

  /**
   * Get compliance-flagged audit logs
   */
  async getComplianceLogs(
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<AuditLog>> {
    return this.getAuditLogs({ complianceFlag: true }, pagination);
  }

  /**
   * Export audit logs to CSV format
   */
  async exportAuditLogs(filters: AuditLogFilters = {}): Promise<string> {
    try {
      const { data } = await this.getAuditLogs(filters, { page: 1, limit: 10000 });

      // CSV header
      const headers = [
        'Audit ID',
        'User ID',
        'User Email',
        'Entity Type',
        'Entity ID',
        'Action',
        'Description',
        'IP Address',
        'Event Date',
        'Security Flag',
        'Compliance Flag'
      ];

      // CSV rows
      const rows = data.map(log => [
        log.auditLogId,
        log.userId || '',
        log.userEmail || '',
        log.entityType,
        log.entityId || '',
        log.action,
        (log.description || '').replace(/"/g, '""'),
        log.ipAddress || '',
        new Date(log.eventDate).toISOString(),
        log.securityFlag ? 'Yes' : 'No',
        log.complianceFlag ? 'Yes' : 'No'
      ]);

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csv;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }
}

export default new AuditLogService();

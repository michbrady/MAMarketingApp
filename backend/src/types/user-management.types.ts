/**
 * User Management Types
 * Type definitions for user management, role management, and audit logging
 */

export interface UserDetails {
  userId: number;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  roleId: number;
  roleName: string;
  marketId: number;
  marketName: string;
  marketCode: string;
  preferredLanguageId: number;
  languageName?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'PendingVerification';
  emailVerified: boolean;
  mobileVerified: boolean;
  lastLoginDate?: Date;
  lastActivityDate?: Date;
  profileImageURL?: string;
  timeZone?: string;
  externalAuthProvider?: string;
  failedLoginAttempts: number;
  lockedOutUntil?: Date;
  mfaEnabled: boolean;
  createdDate: Date;
  updatedDate: Date;
  createdBy?: number;
  updatedBy?: number;
  stats?: {
    totalShares: number;
    totalContacts: number;
    totalFollowUps: number;
    engagementRate: number;
  };
}

export interface CreateUserRequest {
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  password: string;
  roleId: number;
  marketId: number;
  preferredLanguageId: number;
  timeZone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  roleId?: number;
  marketId?: number;
  preferredLanguageId?: number;
  status?: 'Active' | 'Inactive' | 'Suspended' | 'PendingVerification';
  timeZone?: string;
  profileImageURL?: string;
}

export interface UserFilters {
  roleId?: number;
  role?: string;
  marketId?: number;
  market?: string;
  status?: 'Active' | 'Inactive' | 'Suspended' | 'PendingVerification';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'name' | 'email' | 'createdDate' | 'lastLoginDate';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleDetails {
  roleId: number;
  roleName: string;
  roleDescription?: string;
  permissionLevel: number;
  isActive: boolean;
  createdDate: Date;
  userCount?: number;
}

export interface CreateRoleRequest {
  roleName: string;
  roleDescription?: string;
  permissionLevel: number;
}

export interface UpdateRoleRequest {
  roleName?: string;
  roleDescription?: string;
  permissionLevel?: number;
  isActive?: boolean;
}

export interface RolePermission {
  roleId: number;
  permission: string;
  granted: boolean;
}

export interface AuditLog {
  auditLogId: number;
  userId?: number;
  userEmail?: string;
  entityType: string;
  entityId?: number;
  action: string;
  description?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  complianceFlag: boolean;
  securityFlag: boolean;
  eventDate: Date;
}

export interface AuditLogFilters {
  userId?: number;
  entityType?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  securityFlag?: boolean;
  complianceFlag?: boolean;
}

export interface CreateAuditLogRequest {
  userId?: number;
  userEmail?: string;
  entityType: string;
  entityId?: number;
  action: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  complianceFlag?: boolean;
  securityFlag?: boolean;
}

export interface UserActivityEvent {
  eventType: string;
  eventDate: Date;
  description: string;
  entityType?: string;
  entityId?: number;
}

export interface BulkUpdateStatusRequest {
  userIds: number[];
  status: 'Active' | 'Inactive';
}

export interface BulkAssignRoleRequest {
  userIds: number[];
  roleId: number;
}

export interface BulkDeleteRequest {
  userIds: number[];
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  resetToken?: string;
  expiresAt?: Date;
}

/**
 * Follow-up Types for UnFranchise Marketing App
 */

export interface FollowUp {
  followUpId: number;
  userId: number;
  contactId: number;
  contactName?: string;
  contactEmail?: string;
  contactMobile?: string;
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Completed' | 'Snoozed' | 'Cancelled';
  type: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  notes?: string;
  completedDate?: Date;
  completedNotes?: string;
  snoozedUntil?: Date;
  snoozedCount?: number;
  reminderSent?: boolean;
  reminderSentDate?: Date;
  createdDate: Date;
  updatedDate: Date;
}

export interface FollowUpTemplate {
  templateId: number;
  templateName: string;
  description: string;
  defaultDays: number;
  defaultPriority: 'Low' | 'Medium' | 'High' | 'Urgent';
  suggestedAction: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  isActive: boolean;
  createdDate: Date;
}

export interface FollowUpReminder {
  reminderId: number;
  followUpId: number;
  reminderDate: Date;
  sent: boolean;
  sentDate?: Date;
  deliveryChannel: 'InApp' | 'Email' | 'SMS' | 'Push';
  createdDate: Date;
}

export interface CreateFollowUpRequest {
  contactId: number;
  dueDate: Date | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  notes?: string;
}

export interface UpdateFollowUpRequest {
  dueDate?: Date | string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'Pending' | 'Completed' | 'Snoozed' | 'Cancelled';
  type?: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  notes?: string;
}

export interface CompleteFollowUpRequest {
  notes?: string;
}

export interface SnoozeFollowUpRequest {
  newDueDate: Date | string;
}

export interface FollowUpFilters {
  userId?: number;
  contactId?: number;
  status?: 'Pending' | 'Completed' | 'Snoozed' | 'Cancelled' | 'All';
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  type?: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  startDate?: Date | string;
  endDate?: Date | string;
  overdue?: boolean;
  upcoming?: boolean;
  limit?: number;
  offset?: number;
}

export interface FollowUpStats {
  totalPending: number;
  totalOverdue: number;
  totalCompleted: number;
  completedToday: number;
  totalCancelled: number;
  upcomingToday: number;
  upcomingThisWeek: number;
  completionRate: number;
  averageCompletionTime: number;
  byPriority: {
    priority: string;
    count: number;
  }[];
  byType: {
    type: string;
    count: number;
  }[];
}

export interface AutomatedFollowUpConfig {
  enabled: boolean;
  defaultDays: number;
  defaultPriority: 'Low' | 'Medium' | 'High' | 'Urgent';
  defaultType: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Other';
  createOnShare: boolean;
  createOnEngagement: boolean;
  createOnNoResponse: boolean;
  noResponseDays: number;
}

export interface CreateFollowUpResponse {
  success: boolean;
  data: FollowUp;
  message?: string;
}

export interface FollowUpListResponse {
  success: boolean;
  data: {
    followUps: FollowUp[];
    total: number;
    stats?: FollowUpStats;
  };
  message?: string;
}

export interface ApplyTemplateRequest {
  templateId: number;
  contactId: number;
  customDays?: number;
  customNotes?: string;
}

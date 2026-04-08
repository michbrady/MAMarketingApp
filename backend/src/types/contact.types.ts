export interface Contact {
  contactId: number;
  ownerUserId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  companyName: string | null;
  jobTitle: string | null;
  relationshipType: string | null;
  source: string | null;
  tags: string | null;
  notes: string | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  marketingConsentDate: Date | null;
  totalSharesReceived: number;
  totalEngagements: number;
  lastEngagementDate: Date | null;
  lastContactDate: Date | null;
  engagementScore: number;
  status: ContactStatus;
  contactHash: string | null;
  duplicateOfContactId: number | null;
  createdDate: Date;
  updatedDate: Date;
}

export type ContactStatus = 'Active' | 'Inactive' | 'DoNotContact' | 'Bounced';

export interface CreateContactRequest {
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
  mobile?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  relationshipType?: string | null;
  source?: string | null;
  tags?: string[];
  notes?: string | null;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  status?: ContactStatus;
}

export interface UpdateContactRequest {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  mobile?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  relationshipType?: string | null;
  source?: string | null;
  tags?: string[];
  notes?: string | null;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  status?: ContactStatus;
  lastContactDate?: Date | null;
  nextFollowUpDate?: Date | null;
}

export interface ContactFilters {
  search?: string;
  status?: ContactStatus;
  relationshipType?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasMobile?: boolean;
  minEngagementScore?: number;
  lastEngagementFrom?: Date;
  lastEngagementTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdDate' | 'updatedDate' | 'lastEngagementDate' | 'engagementScore' | 'lastName';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ContactGroup {
  groupId: number;
  userId: number;
  groupName: string;
  description: string | null;
  contactCount?: number;
  createdDate: Date;
  updatedDate: Date;
}

export interface CreateContactGroupRequest {
  groupName: string;
  description?: string | null;
}

export interface UpdateContactGroupRequest {
  groupName?: string;
  description?: string | null;
}

export interface ContactActivity {
  activityId: number;
  contactId: number;
  activityType: string;
  activityDate: Date;
  contentTitle?: string | null;
  shareChannel?: string | null;
  eventType?: string | null;
  description?: string | null;
}

export interface ImportContactRow {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  relationshipType?: string | null;
  tags?: string;
  status?: ContactStatus;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duplicateCount?: number;
}

export interface ContactWithGroups extends Contact {
  groups?: ContactGroup[];
}

export interface ContactGroupWithCount extends ContactGroup {
  contactCount: number;
}

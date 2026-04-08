import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  ContactActivity,
  ImportContactRow,
  ImportResult,
  ContactWithGroups
} from '../types/contact.types.js';
import crypto from 'crypto';

const logger = createLogger('ContactService');

export class ContactService {
  /**
   * Create a new contact
   */
  async createContact(contactData: CreateContactRequest, userId: number): Promise<Contact> {
    try {
      logger.info(`Creating contact for user ${userId}`);

      // Validate that at least email or mobile is provided
      if (!contactData.email && !contactData.mobile) {
        throw new Error('Either email or mobile is required');
      }

      // Generate contact hash for deduplication
      const contactHash = this.generateContactHash(contactData.email || null, contactData.mobile || null);

      // Check for duplicates
      const duplicates = await query<Contact>(`
        SELECT TOP 1 ContactID
        FROM Contact
        WHERE OwnerUserID = @userId
          AND ContactHash = @contactHash
          AND Status != 'Bounced'
      `, { userId, contactHash });

      if (duplicates.length > 0) {
        throw new Error('Contact with this email or mobile already exists');
      }

      // Convert tags array to comma-separated string
      const tagsString = contactData.tags?.join(',') || null;

      // Insert contact
      const result = await query<Contact>(`
        INSERT INTO Contact (
          OwnerUserID,
          FirstName,
          LastName,
          Email,
          Mobile,
          CompanyName,
          JobTitle,
          RelationshipType,
          Source,
          Tags,
          Notes,
          EmailOptIn,
          SMSOptIn,
          Status,
          ContactHash,
          CreatedDate,
          UpdatedDate
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId,
          @firstName,
          @lastName,
          @email,
          @mobile,
          @companyName,
          @jobTitle,
          @relationshipType,
          @source,
          @tags,
          @notes,
          @emailOptIn,
          @smsOptIn,
          @status,
          @contactHash,
          SYSDATETIME(),
          SYSDATETIME()
        )
      `, {
        userId,
        firstName: contactData.firstName || null,
        lastName: contactData.lastName || null,
        email: contactData.email || null,
        mobile: contactData.mobile || null,
        companyName: contactData.companyName || null,
        jobTitle: contactData.jobTitle || null,
        relationshipType: contactData.relationshipType || null,
        source: contactData.source || 'Manual',
        tags: tagsString,
        notes: contactData.notes || null,
        emailOptIn: contactData.emailOptIn ? 1 : 0,
        smsOptIn: contactData.smsOptIn ? 1 : 0,
        status: contactData.status || 'Active',
        contactHash
      });

      logger.info(`Contact created successfully: ${(result[0] as any).ContactID}`);
      return result[0];

    } catch (error) {
      logger.error('Create contact error:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId: number, updates: UpdateContactRequest, userId: number): Promise<Contact> {
    try {
      logger.info(`Updating contact ${contactId} for user ${userId}`);

      // Verify ownership
      const existing = await this.getContact(contactId, userId);
      if (!existing) {
        throw new Error('Contact not found or access denied');
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any = { contactId, userId };

      if (updates.firstName !== undefined) {
        updateFields.push('FirstName = @firstName');
        params.firstName = updates.firstName;
      }
      if (updates.lastName !== undefined) {
        updateFields.push('LastName = @lastName');
        params.lastName = updates.lastName;
      }
      if (updates.email !== undefined) {
        updateFields.push('Email = @email');
        params.email = updates.email;
      }
      if (updates.mobile !== undefined) {
        updateFields.push('Mobile = @mobile');
        params.mobile = updates.mobile;
      }
      if (updates.companyName !== undefined) {
        updateFields.push('CompanyName = @companyName');
        params.companyName = updates.companyName;
      }
      if (updates.jobTitle !== undefined) {
        updateFields.push('JobTitle = @jobTitle');
        params.jobTitle = updates.jobTitle;
      }
      if (updates.relationshipType !== undefined) {
        updateFields.push('RelationshipType = @relationshipType');
        params.relationshipType = updates.relationshipType;
      }
      if (updates.source !== undefined) {
        updateFields.push('Source = @source');
        params.source = updates.source;
      }
      if (updates.tags !== undefined) {
        updateFields.push('Tags = @tags');
        params.tags = updates.tags.join(',');
      }
      if (updates.notes !== undefined) {
        updateFields.push('Notes = @notes');
        params.notes = updates.notes;
      }
      if (updates.emailOptIn !== undefined) {
        updateFields.push('EmailOptIn = @emailOptIn');
        params.emailOptIn = updates.emailOptIn ? 1 : 0;
      }
      if (updates.smsOptIn !== undefined) {
        updateFields.push('SMSOptIn = @smsOptIn');
        params.smsOptIn = updates.smsOptIn ? 1 : 0;
      }
      if (updates.status !== undefined) {
        updateFields.push('Status = @status');
        params.status = updates.status;
      }
      if (updates.lastContactDate !== undefined) {
        updateFields.push('LastContactDate = @lastContactDate');
        params.lastContactDate = updates.lastContactDate;
      }

      // Update contact hash if email or mobile changed
      if (updates.email !== undefined || updates.mobile !== undefined) {
        const newEmail = updates.email !== undefined ? updates.email : existing.email;
        const newMobile = updates.mobile !== undefined ? updates.mobile : existing.mobile;
        const newHash = this.generateContactHash(newEmail, newMobile);
        updateFields.push('ContactHash = @contactHash');
        params.contactHash = newHash;
      }

      // Always update UpdatedDate
      updateFields.push('UpdatedDate = SYSDATETIME()');

      if (updateFields.length === 1) { // Only UpdatedDate
        throw new Error('No fields to update');
      }

      const updateQuery = `
        UPDATE Contact
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE ContactID = @contactId AND OwnerUserID = @userId
      `;

      const result = await query<Contact>(updateQuery, params);

      if (result.length === 0) {
        throw new Error('Contact not found or access denied');
      }

      logger.info(`Contact updated successfully: ${contactId}`);
      return result[0];

    } catch (error) {
      logger.error('Update contact error:', error);
      throw error;
    }
  }

  /**
   * Delete a contact (soft delete - sets status to Inactive)
   */
  async deleteContact(contactId: number, userId: number): Promise<boolean> {
    try {
      logger.info(`Deleting contact ${contactId} for user ${userId}`);

      const result = await query(`
        UPDATE Contact
        SET Status = 'Inactive',
            UpdatedDate = SYSDATETIME()
        WHERE ContactID = @contactId AND OwnerUserID = @userId
      `, { contactId, userId });

      const rowsAffected = (result as any).rowsAffected[0];
      logger.info(`Delete contact result: ${rowsAffected} rows affected`);

      if (rowsAffected === 0) {
        logger.warn(`Failed to delete contact ${contactId} - contact not found or access denied for user ${userId}`);
      }

      return rowsAffected > 0;

    } catch (error) {
      logger.error('Delete contact error:', error);
      throw error;
    }
  }

  /**
   * Bulk delete contacts (soft delete - sets status to Inactive)
   */
  async bulkDeleteContacts(contactIds: number[], userId: number): Promise<{ deleted: number }> {
    try {
      logger.info(`Bulk deleting ${contactIds.length} contacts for user ${userId}`);

      if (contactIds.length === 0) {
        return { deleted: 0 };
      }

      // Create parameter placeholders for IN clause
      const placeholders = contactIds.map((_, i) => `@id${i}`).join(', ');
      const params: any = { userId };
      contactIds.forEach((id, i) => {
        params[`id${i}`] = id;
      });

      const result = await query(`
        UPDATE Contact
        SET Status = 'Inactive',
            UpdatedDate = SYSDATETIME()
        WHERE ContactID IN (${placeholders}) AND OwnerUserID = @userId
      `, params);

      const deleted = (result as any).rowsAffected[0] || 0;
      logger.info(`Bulk deleted ${deleted} contacts`);

      return { deleted };

    } catch (error) {
      logger.error('Bulk delete contacts error:', error);
      throw error;
    }
  }

  /**
   * Get a single contact
   */
  async getContact(contactId: number, userId: number): Promise<Contact | null> {
    try {
      const result = await query<Contact>(`
        SELECT *
        FROM Contact
        WHERE ContactID = @contactId AND OwnerUserID = @userId AND Status != 'Inactive'
      `, { contactId, userId });

      return result[0] || null;

    } catch (error) {
      logger.error('Get contact error:', error);
      throw error;
    }
  }

  /**
   * Get contacts with filters and pagination
   */
  async getContacts(
    userId: number,
    filters: ContactFilters = {}
  ): Promise<{ contacts: Contact[]; total: number }> {
    try {
      const {
        search,
        status,
        relationshipType,
        tags,
        hasEmail,
        hasMobile,
        minEngagementScore,
        lastEngagementFrom,
        lastEngagementTo,
        limit = 50,
        offset = 0,
        sortBy = 'updatedDate',
        sortOrder = 'DESC'
      } = filters;

      let whereClause = "WHERE OwnerUserID = @userId AND Status != 'Inactive'";
      const params: any = { userId };

      if (status) {
        whereClause += ' AND Status = @status';
        params.status = status;
      }

      if (search) {
        whereClause += ` AND (
          FirstName LIKE @search OR
          LastName LIKE @search OR
          Email LIKE @search OR
          Mobile LIKE @search OR
          CompanyName LIKE @search OR
          JobTitle LIKE @search OR
          Notes LIKE @search
        )`;
        params.search = `%${search}%`;
      }

      if (relationshipType) {
        whereClause += ' AND RelationshipType = @relationshipType';
        params.relationshipType = relationshipType;
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map((_, idx) => `Tags LIKE @tag${idx}`).join(' OR ');
        whereClause += ` AND (${tagConditions})`;
        tags.forEach((tag, idx) => {
          params[`tag${idx}`] = `%${tag}%`;
        });
      }

      if (hasEmail !== undefined) {
        whereClause += hasEmail ? ' AND Email IS NOT NULL' : ' AND Email IS NULL';
      }

      if (hasMobile !== undefined) {
        whereClause += hasMobile ? ' AND Mobile IS NOT NULL' : ' AND Mobile IS NULL';
      }

      if (minEngagementScore !== undefined) {
        whereClause += ' AND EngagementScore >= @minEngagementScore';
        params.minEngagementScore = minEngagementScore;
      }

      if (lastEngagementFrom) {
        whereClause += ' AND LastEngagementDate >= @lastEngagementFrom';
        params.lastEngagementFrom = lastEngagementFrom;
      }

      if (lastEngagementTo) {
        whereClause += ' AND LastEngagementDate <= @lastEngagementTo';
        params.lastEngagementTo = lastEngagementTo;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) AS Total FROM Contact ${whereClause}`;
      const countResult = await query<{ Total: number }>(countQuery, params);
      const total = countResult[0]?.Total || 0;

      // Get contacts
      const sortColumn = this.mapSortColumn(sortBy);
      params.limit = limit;
      params.offset = offset;

      const contactsQuery = `
        SELECT *
        FROM Contact
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const contacts = await query<Contact>(contactsQuery, params);

      return { contacts, total };

    } catch (error) {
      logger.error('Get contacts error:', error);
      throw error;
    }
  }

  /**
   * Search contacts with full-text search
   */
  async searchContacts(userId: number, searchQuery: string): Promise<Contact[]> {
    try {
      logger.info(`Searching contacts for user ${userId}: ${searchQuery}`);

      const result = await query<Contact>(`
        SELECT *
        FROM Contact
        WHERE OwnerUserID = @userId
          AND Status != 'Inactive'
          AND (
            FirstName LIKE @search OR
            LastName LIKE @search OR
            Email LIKE @search OR
            Mobile LIKE @search OR
            CompanyName LIKE @search OR
            JobTitle LIKE @search OR
            Notes LIKE @search OR
            Tags LIKE @search
          )
        ORDER BY
          CASE
            WHEN Email = @exactSearch OR Mobile = @exactSearch THEN 0
            WHEN FirstName = @exactSearch OR LastName = @exactSearch THEN 1
            ELSE 2
          END,
          EngagementScore DESC,
          LastEngagementDate DESC
        OFFSET 0 ROWS
        FETCH NEXT 50 ROWS ONLY
      `, {
        userId,
        search: `%${searchQuery}%`,
        exactSearch: searchQuery
      });

      return result;

    } catch (error) {
      logger.error('Search contacts error:', error);
      throw error;
    }
  }

  /**
   * Import contacts from CSV data
   */
  async importContacts(csvData: ImportContactRow[], userId: number): Promise<ImportResult> {
    try {
      logger.info(`Importing ${csvData.length} contacts for user ${userId}`);

      const result: ImportResult = {
        success: true,
        totalRows: csvData.length,
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        errors: []
      };

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Validate row
          if (!row.email && !row.mobile) {
            result.errors.push({
              row: i + 1,
              data: row,
              error: 'Either email or mobile is required'
            });
            result.errorCount++;
            continue;
          }

          // Check for duplicate
          const contactHash = this.generateContactHash(row.email, row.mobile);
          const existing = await query<Contact>(`
            SELECT ContactID FROM Contact
            WHERE OwnerUserID = @userId AND ContactHash = @contactHash AND Status != 'Inactive'
          `, { userId, contactHash });

          if (existing.length > 0) {
            result.duplicateCount = (result.duplicateCount || 0) + 1;
            continue;
          }

          // Parse tags
          const tags = row.tags ? row.tags.split(',').map(t => t.trim()) : [];

          // Create contact
          await this.createContact({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            mobile: row.mobile,
            companyName: row.companyName,
            jobTitle: row.jobTitle,
            relationshipType: row.relationshipType,
            tags,
            status: row.status || 'Active',
            source: 'Import'
          }, userId);

          result.successCount++;

        } catch (error: any) {
          result.errors.push({
            row: i + 1,
            data: row,
            error: error.message
          });
          result.errorCount++;
        }
      }

      logger.info(`Import complete: ${result.successCount} success, ${result.errorCount} errors, ${result.duplicateCount} duplicates`);
      return result;

    } catch (error) {
      logger.error('Import contacts error:', error);
      throw error;
    }
  }

  /**
   * Export contacts to CSV format
   */
  async exportContacts(userId: number, format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      logger.info(`Exporting contacts for user ${userId} in ${format} format`);

      const contacts = await query<Contact>(`
        SELECT
          FirstName,
          LastName,
          Email,
          Mobile,
          CompanyName,
          JobTitle,
          RelationshipType,
          Tags,
          Status,
          EngagementScore,
          TotalSharesReceived,
          TotalEngagements,
          LastEngagementDate,
          LastContactDate,
          CreatedDate
        FROM Contact
        WHERE OwnerUserID = @userId
        ORDER BY LastName, FirstName
      `, { userId });

      if (format === 'json') {
        return JSON.stringify(contacts, null, 2);
      }

      // CSV format
      const headers = [
        'FirstName', 'LastName', 'Email', 'Mobile', 'CompanyName', 'JobTitle',
        'RelationshipType', 'Tags', 'Status', 'EngagementScore', 'TotalSharesReceived',
        'TotalEngagements', 'LastEngagementDate', 'LastContactDate', 'CreatedDate'
      ];

      const csvRows = [headers.join(',')];

      for (const contact of contacts) {
        const row = headers.map(header => {
          const value = (contact as any)[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');

    } catch (error) {
      logger.error('Export contacts error:', error);
      throw error;
    }
  }

  /**
   * Add contact to group
   */
  async addContactToGroup(contactId: number, groupId: number, userId: number): Promise<boolean> {
    try {
      // Verify contact ownership
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('Contact not found or access denied');
      }

      // Check if already in group
      const existing = await query(`
        SELECT * FROM ContactGroupMember
        WHERE ContactID = @contactId AND GroupID = @groupId
      `, { contactId, groupId });

      if (existing.length > 0) {
        return true; // Already in group
      }

      // Add to group
      await query(`
        INSERT INTO ContactGroupMember (ContactID, GroupID, AddedDate)
        VALUES (@contactId, @groupId, SYSDATETIME())
      `, { contactId, groupId });

      logger.info(`Contact ${contactId} added to group ${groupId}`);
      return true;

    } catch (error) {
      logger.error('Add contact to group error:', error);
      throw error;
    }
  }

  /**
   * Remove contact from group
   */
  async removeContactFromGroup(contactId: number, groupId: number, userId: number): Promise<boolean> {
    try {
      // Verify contact ownership
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('Contact not found or access denied');
      }

      const result = await query(`
        DELETE FROM ContactGroupMember
        WHERE ContactID = @contactId AND GroupID = @groupId
      `, { contactId, groupId });

      logger.info(`Contact ${contactId} removed from group ${groupId}`);
      return (result as any).rowsAffected[0] > 0;

    } catch (error) {
      logger.error('Remove contact from group error:', error);
      throw error;
    }
  }

  /**
   * Add tag to contact
   */
  async addContactTag(contactId: number, tag: string, userId: number): Promise<Contact> {
    try {
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('Contact not found or access denied');
      }

      const currentTags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];

      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
      }

      return this.updateContact(contactId, { tags: currentTags }, userId);

    } catch (error) {
      logger.error('Add contact tag error:', error);
      throw error;
    }
  }

  /**
   * Remove tag from contact
   */
  async removeContactTag(contactId: number, tag: string, userId: number): Promise<Contact> {
    try {
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('Contact not found or access denied');
      }

      const currentTags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
      const newTags = currentTags.filter(t => t !== tag);

      return this.updateContact(contactId, { tags: newTags }, userId);

    } catch (error) {
      logger.error('Remove contact tag error:', error);
      throw error;
    }
  }

  /**
   * Get contact activity history
   */
  async getContactActivity(contactId: number, userId: number): Promise<ContactActivity[]> {
    try {
      // Verify contact ownership
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('Contact not found or access denied');
      }

      const activities = await query<ContactActivity>(`
        SELECT
          'Share' AS activityType,
          se.ShareEventID AS activityId,
          se.ShareDate AS activityDate,
          ci.Title AS contentTitle,
          se.ShareChannel AS shareChannel,
          NULL AS eventType,
          'Content shared with contact' AS description
        FROM ShareEvent se
        INNER JOIN ShareRecipient sr ON se.ShareEventID = sr.ShareEventID
        INNER JOIN ContentItem ci ON se.ContentItemID = ci.ContentItemID
        WHERE sr.ContactID = @contactId

        UNION ALL

        SELECT
          'Engagement' AS activityType,
          ee.EngagementEventID AS activityId,
          ee.EventDate AS activityDate,
          ci.Title AS contentTitle,
          NULL AS shareChannel,
          ee.EventType AS eventType,
          'Contact engaged with content' AS description
        FROM EngagementEvent ee
        INNER JOIN ContentItem ci ON ee.ContentItemID = ci.ContentItemID
        WHERE ee.ContactID = @contactId

        UNION ALL

        SELECT
          ct.TimelineEventType AS activityType,
          ct.ContactTimelineID AS activityId,
          ct.EventDate AS activityDate,
          ct.EventTitle AS contentTitle,
          NULL AS shareChannel,
          NULL AS eventType,
          ct.EventDescription AS description
        FROM ContactTimeline ct
        WHERE ct.ContactID = @contactId

        ORDER BY activityDate DESC
        OFFSET 0 ROWS
        FETCH NEXT 100 ROWS ONLY
      `, { contactId });

      return activities;

    } catch (error) {
      logger.error('Get contact activity error:', error);
      throw error;
    }
  }

  /**
   * Get contact with groups
   */
  async getContactWithGroups(contactId: number, userId: number): Promise<ContactWithGroups | null> {
    try {
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        return null;
      }

      const groups = await query(`
        SELECT
          cg.GroupID AS groupId,
          cg.UserID AS userId,
          cg.GroupName AS groupName,
          cg.Description AS description,
          cg.CreatedDate AS createdDate,
          cg.UpdatedDate AS updatedDate
        FROM ContactGroup cg
        INNER JOIN ContactGroupMember cgm ON cg.GroupID = cgm.GroupID
        WHERE cgm.ContactID = @contactId
      `, { contactId });

      return {
        ...contact,
        groups
      };

    } catch (error) {
      logger.error('Get contact with groups error:', error);
      throw error;
    }
  }

  /**
   * Update engagement score based on activity
   */
  async updateEngagementScore(contactId: number): Promise<number> {
    try {
      // Calculate engagement score (0-100)
      // Based on: shares received, engagements, recency
      const result = await query<{ Score: number }>(`
        DECLARE @score INT = 0;
        DECLARE @sharesReceived INT;
        DECLARE @engagements INT;
        DECLARE @daysSinceLastEngagement INT;

        SELECT
          @sharesReceived = TotalSharesReceived,
          @engagements = TotalEngagements,
          @daysSinceLastEngagement = DATEDIFF(DAY, LastEngagementDate, GETDATE())
        FROM Contact
        WHERE ContactID = @contactId;

        -- Base score from shares and engagements
        SET @score = (@sharesReceived * 5) + (@engagements * 10);

        -- Recency bonus/penalty
        IF @daysSinceLastEngagement IS NULL
          SET @score = @score; -- No engagement yet
        ELSE IF @daysSinceLastEngagement <= 7
          SET @score = @score + 20; -- Recent engagement bonus
        ELSE IF @daysSinceLastEngagement <= 30
          SET @score = @score + 10; -- Recent engagement bonus
        ELSE IF @daysSinceLastEngagement > 90
          SET @score = @score - 20; -- Inactive penalty

        -- Cap at 100
        IF @score > 100 SET @score = 100;
        IF @score < 0 SET @score = 0;

        -- Update contact
        UPDATE Contact
        SET EngagementScore = @score
        WHERE ContactID = @contactId;

        SELECT @score AS Score;
      `, { contactId });

      return result[0]?.Score || 0;

    } catch (error) {
      logger.error('Update engagement score error:', error);
      throw error;
    }
  }

  /**
   * Generate contact hash for deduplication
   */
  private generateContactHash(email: string | null, mobile: string | null): string {
    const hashInput = `${email || ''}|${mobile || ''}`.toLowerCase();
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Map sort column name to database column
   */
  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      createdDate: 'CreatedDate',
      updatedDate: 'UpdatedDate',
      lastEngagementDate: 'LastEngagementDate',
      engagementScore: 'EngagementScore',
      lastName: 'LastName'
    };
    return columnMap[sortBy] || 'UpdatedDate';
  }
}

export default new ContactService();

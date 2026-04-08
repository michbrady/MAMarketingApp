import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  ContactGroup,
  CreateContactGroupRequest,
  UpdateContactGroupRequest,
  ContactGroupWithCount,
  Contact
} from '../types/contact.types.js';

const logger = createLogger('ContactGroupService');

export class ContactGroupService {
  /**
   * Create a new contact group
   */
  async createGroup(data: CreateContactGroupRequest, userId: number): Promise<ContactGroup> {
    try {
      logger.info(`Creating contact group for user ${userId}: ${data.groupName}`);

      // Check for duplicate group name
      const existing = await query<ContactGroup>(`
        SELECT GroupID
        FROM ContactGroup
        WHERE UserID = @userId AND GroupName = @groupName
      `, { userId, groupName: data.groupName });

      if (existing.length > 0) {
        throw new Error('A group with this name already exists');
      }

      const result = await query<ContactGroup>(`
        INSERT INTO ContactGroup (
          UserID,
          GroupName,
          Description,
          CreatedDate,
          UpdatedDate
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId,
          @groupName,
          @description,
          SYSDATETIME(),
          SYSDATETIME()
        )
      `, {
        userId,
        groupName: data.groupName,
        description: data.description || null
      });

      logger.info(`Contact group created: ${(result[0] as any).GroupID}`);
      return result[0];

    } catch (error) {
      logger.error('Create contact group error:', error);
      throw error;
    }
  }

  /**
   * Update a contact group
   */
  async updateGroup(
    groupId: number,
    updates: UpdateContactGroupRequest,
    userId: number
  ): Promise<ContactGroup> {
    try {
      logger.info(`Updating contact group ${groupId} for user ${userId}`);

      // Verify ownership
      const existing = await this.getGroup(groupId, userId);
      if (!existing) {
        throw new Error('Group not found or access denied');
      }

      // Build update query
      const updateFields: string[] = [];
      const params: any = { groupId, userId };

      if (updates.groupName !== undefined) {
        updateFields.push('GroupName = @groupName');
        params.groupName = updates.groupName;
      }

      if (updates.description !== undefined) {
        updateFields.push('Description = @description');
        params.description = updates.description;
      }

      // Always update UpdatedDate
      updateFields.push('UpdatedDate = SYSDATETIME()');

      if (updateFields.length === 1) {
        throw new Error('No fields to update');
      }

      const updateQuery = `
        UPDATE ContactGroup
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE GroupID = @groupId AND UserID = @userId
      `;

      const result = await query<ContactGroup>(updateQuery, params);

      if (result.length === 0) {
        throw new Error('Group not found or access denied');
      }

      logger.info(`Contact group updated: ${groupId}`);
      return result[0];

    } catch (error) {
      logger.error('Update contact group error:', error);
      throw error;
    }
  }

  /**
   * Delete a contact group
   */
  async deleteGroup(groupId: number, userId: number): Promise<boolean> {
    try {
      logger.info(`Deleting contact group ${groupId} for user ${userId}`);

      // First delete all group members
      await query(`
        DELETE FROM ContactGroupMember
        WHERE GroupID = @groupId
      `, { groupId });

      // Then delete the group
      const result = await query(`
        DELETE FROM ContactGroup
        WHERE GroupID = @groupId AND UserID = @userId
      `, { groupId, userId });

      logger.info(`Contact group deleted: ${groupId}`);
      return (result as any).rowsAffected[0] > 0;

    } catch (error) {
      logger.error('Delete contact group error:', error);
      throw error;
    }
  }

  /**
   * Get a single group
   */
  async getGroup(groupId: number, userId: number): Promise<ContactGroup | null> {
    try {
      const result = await query<ContactGroup>(`
        SELECT *
        FROM ContactGroup
        WHERE GroupID = @groupId AND UserID = @userId
      `, { groupId, userId });

      return result[0] || null;

    } catch (error) {
      logger.error('Get contact group error:', error);
      throw error;
    }
  }

  /**
   * Get all groups for a user
   */
  async getGroups(userId: number): Promise<ContactGroupWithCount[]> {
    try {
      const groups = await query<ContactGroupWithCount>(`
        SELECT
          cg.GroupID AS groupId,
          cg.UserID AS userId,
          cg.GroupName AS groupName,
          cg.Description AS description,
          cg.CreatedDate AS createdDate,
          cg.UpdatedDate AS updatedDate,
          COUNT(cgm.ContactID) AS contactCount
        FROM ContactGroup cg
        LEFT JOIN ContactGroupMember cgm ON cg.GroupID = cgm.GroupID
        WHERE cg.UserID = @userId
        GROUP BY cg.GroupID, cg.UserID, cg.GroupName, cg.Description, cg.CreatedDate, cg.UpdatedDate
        ORDER BY cg.GroupName
      `, { userId });

      return groups;

    } catch (error) {
      logger.error('Get contact groups error:', error);
      throw error;
    }
  }

  /**
   * Get contacts in a group
   */
  async getGroupContacts(groupId: number, userId: number): Promise<Contact[]> {
    try {
      // Verify group ownership
      const group = await this.getGroup(groupId, userId);
      if (!group) {
        throw new Error('Group not found or access denied');
      }

      const contacts = await query<Contact>(`
        SELECT c.*
        FROM Contact c
        INNER JOIN ContactGroupMember cgm ON c.ContactID = cgm.ContactID
        WHERE cgm.GroupID = @groupId
          AND c.OwnerUserID = @userId
        ORDER BY c.LastName, c.FirstName
      `, { groupId, userId });

      return contacts;

    } catch (error) {
      logger.error('Get group contacts error:', error);
      throw error;
    }
  }

  /**
   * Get groups for a contact
   */
  async getContactGroups(contactId: number, userId: number): Promise<ContactGroup[]> {
    try {
      const groups = await query<ContactGroup>(`
        SELECT cg.*
        FROM ContactGroup cg
        INNER JOIN ContactGroupMember cgm ON cg.GroupID = cgm.GroupID
        INNER JOIN Contact c ON cgm.ContactID = c.ContactID
        WHERE cgm.ContactID = @contactId
          AND c.OwnerUserID = @userId
          AND cg.UserID = @userId
        ORDER BY cg.GroupName
      `, { contactId, userId });

      return groups;

    } catch (error) {
      logger.error('Get contact groups error:', error);
      throw error;
    }
  }

  /**
   * Add multiple contacts to a group
   */
  async addContactsToGroup(groupId: number, contactIds: number[], userId: number): Promise<number> {
    try {
      logger.info(`Adding ${contactIds.length} contacts to group ${groupId}`);

      // Verify group ownership
      const group = await this.getGroup(groupId, userId);
      if (!group) {
        throw new Error('Group not found or access denied');
      }

      let addedCount = 0;

      for (const contactId of contactIds) {
        // Verify contact ownership
        const contact = await query<Contact>(`
          SELECT ContactID FROM Contact
          WHERE ContactID = @contactId AND OwnerUserID = @userId
        `, { contactId, userId });

        if (contact.length === 0) {
          continue; // Skip if contact doesn't exist or doesn't belong to user
        }

        // Check if already in group
        const existing = await query(`
          SELECT * FROM ContactGroupMember
          WHERE ContactID = @contactId AND GroupID = @groupId
        `, { contactId, groupId });

        if (existing.length > 0) {
          continue; // Already in group
        }

        // Add to group
        await query(`
          INSERT INTO ContactGroupMember (ContactID, GroupID, AddedDate)
          VALUES (@contactId, @groupId, SYSDATETIME())
        `, { contactId, groupId });

        addedCount++;
      }

      logger.info(`Added ${addedCount} contacts to group ${groupId}`);
      return addedCount;

    } catch (error) {
      logger.error('Add contacts to group error:', error);
      throw error;
    }
  }

  /**
   * Remove contact from group
   */
  async removeContactFromGroup(groupId: number, contactId: number, userId: number): Promise<boolean> {
    try {
      // Verify group ownership
      const group = await this.getGroup(groupId, userId);
      if (!group) {
        throw new Error('Group not found or access denied');
      }

      const result = await query(`
        DELETE FROM ContactGroupMember
        WHERE GroupID = @groupId AND ContactID = @contactId
      `, { groupId, contactId });

      return (result as any).rowsAffected[0] > 0;

    } catch (error) {
      logger.error('Remove contact from group error:', error);
      throw error;
    }
  }
}

export default new ContactGroupService();

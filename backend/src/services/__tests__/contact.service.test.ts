import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactService } from '../contact.service';
import * as database from '../../config/database';
import { createMockContact } from '../../__tests__/helpers/test-utils';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('ContactService', () => {
  let contactService: ContactService;

  beforeEach(() => {
    vi.clearAllMocks();
    contactService = new ContactService();
  });

  describe('createContact', () => {
    it('should create contact with email', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobile: null
      };

      const mockCreatedContact = createMockContact(contactData);

      vi.mocked(database.query)
        .mockResolvedValueOnce([]) // No duplicates
        .mockResolvedValueOnce([mockCreatedContact]); // Insert result

      // Act
      const result = await contactService.createContact(contactData, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.FirstName).toBe('John');
      expect(result.LastName).toBe('Doe');
      expect(result.Email).toBe('john.doe@example.com');
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should create contact with mobile', async () => {
      // Arrange
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: null,
        mobile: '+15559876543'
      };

      const mockCreatedContact = createMockContact(contactData);

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockCreatedContact]);

      // Act
      const result = await contactService.createContact(contactData, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.Mobile).toBe('+15559876543');
    });

    it('should fail without email or mobile', async () => {
      // Arrange
      const contactData = {
        firstName: 'Test',
        lastName: 'User',
        email: null,
        mobile: null
      };

      // Act & Assert
      await expect(
        contactService.createContact(contactData, 1)
      ).rejects.toThrow('Either email or mobile is required');
    });

    it('should detect duplicate contacts', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobile: null
      };

      vi.mocked(database.query).mockResolvedValueOnce([{ ContactID: 1 }]);

      // Act & Assert
      await expect(
        contactService.createContact(contactData, 1)
      ).rejects.toThrow('already exists');
    });

    it('should handle tags array', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobile: null,
        tags: ['vip', 'prospect', 'hot-lead']
      };

      const mockCreatedContact = createMockContact({
        ...contactData,
        Tags: 'vip,prospect,hot-lead'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockCreatedContact]);

      // Act
      const result = await contactService.createContact(contactData, 1);

      // Assert
      expect(result).toBeDefined();
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should set default values', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        mobile: null
      };

      const mockCreatedContact = createMockContact({
        ...contactData,
        Status: 'Active',
        Source: 'Manual'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockCreatedContact]);

      // Act
      const result = await contactService.createContact(contactData, 1);

      // Assert
      expect(result.Status).toBe('Active');
    });
  });

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      // Arrange
      const existingContact = createMockContact();
      const updates = {
        firstName: 'Jane',
        companyName: 'New Company'
      };

      const updatedContact = createMockContact({
        firstName: 'Jane',
        companyName: 'New Company'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([existingContact]) // getContact
        .mockResolvedValueOnce([updatedContact]); // update

      // Act
      const result = await contactService.updateContact(1, updates, 1);

      // Assert
      expect(result.FirstName).toBe('Jane');
      expect(result.CompanyName).toBe('New Company');
    });

    it('should fail for non-existent contact', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act & Assert
      await expect(
        contactService.updateContact(999, { firstName: 'Test' }, 1)
      ).rejects.toThrow('not found or access denied');
    });

    it('should verify ownership', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act & Assert
      await expect(
        contactService.updateContact(1, { firstName: 'Test' }, 999)
      ).rejects.toThrow('not found or access denied');
    });

    it('should update tags', async () => {
      // Arrange
      const existingContact = createMockContact({ Tags: 'old,tags' });
      const updates = {
        tags: ['new', 'tags']
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([existingContact])
        .mockResolvedValueOnce([{ ...existingContact, Tags: 'new,tags' }]);

      // Act
      const result = await contactService.updateContact(1, updates, 1);

      // Assert
      expect(result.Tags).toBe('new,tags');
    });

    it('should fail with no fields to update', async () => {
      // Arrange
      const existingContact = createMockContact();
      vi.mocked(database.query).mockResolvedValueOnce([existingContact]);

      // Act & Assert
      await expect(
        contactService.updateContact(1, {}, 1)
      ).rejects.toThrow('No fields to update');
    });
  });

  describe('deleteContact', () => {
    it('should soft delete contact', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce({
        rowsAffected: [1]
      } as any);

      // Act
      const result = await contactService.deleteContact(1, 1);

      // Assert
      expect(result).toBe(true);
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should return false for non-existent contact', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce({
        rowsAffected: [0]
      } as any);

      // Act
      const result = await contactService.deleteContact(999, 1);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getContact', () => {
    it('should get contact by ID', async () => {
      // Arrange
      const mockContact = createMockContact();
      vi.mocked(database.query).mockResolvedValueOnce([mockContact]);

      // Act
      const result = await contactService.getContact(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result?.ContactID).toBe(1);
      expect(result?.FirstName).toBe('John');
    });

    it('should return null for non-existent contact', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await contactService.getContact(999, 1);

      // Assert
      expect(result).toBeNull();
    });

    it('should verify ownership', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await contactService.getContact(1, 999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getContacts', () => {
    it('should get contacts with pagination', async () => {
      // Arrange
      const mockContacts = [
        createMockContact({ ContactID: 1 }),
        createMockContact({ ContactID: 2 })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 2 }])
        .mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.getContacts(1, { limit: 10, offset: 0 });

      // Assert
      expect(result.contacts).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      // Arrange
      const mockContacts = [createMockContact({ Status: 'Active' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.getContacts(1, { status: 'Active' });

      // Assert
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].Status).toBe('Active');
    });

    it('should filter by search term', async () => {
      // Arrange
      const mockContacts = [createMockContact({ FirstName: 'John' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.getContacts(1, { search: 'John' });

      // Assert
      expect(result.contacts).toHaveLength(1);
    });

    it('should filter by tags', async () => {
      // Arrange
      const mockContacts = [createMockContact({ Tags: 'vip,prospect' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.getContacts(1, { tags: ['vip'] });

      // Assert
      expect(result.contacts).toHaveLength(1);
    });

    it('should filter by email presence', async () => {
      // Arrange
      const mockContacts = [createMockContact({ Email: 'test@example.com' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.getContacts(1, { hasEmail: true });

      // Assert
      expect(result.contacts).toHaveLength(1);
    });

    it('should apply default pagination', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 0 }])
        .mockResolvedValueOnce([]);

      // Act
      await contactService.getContacts(1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by term', async () => {
      // Arrange
      const mockContacts = [
        createMockContact({ FirstName: 'John', LastName: 'Doe' })
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.searchContacts(1, 'John');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].FirstName).toBe('John');
    });

    it('should limit search results', async () => {
      // Arrange
      const mockContacts = Array.from({ length: 50 }, (_, i) =>
        createMockContact({ ContactID: i + 1 })
      );

      vi.mocked(database.query).mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.searchContacts(1, 'test');

      // Assert
      expect(result).toHaveLength(50);
    });
  });

  describe('importContacts', () => {
    it('should import valid contacts', async () => {
      // Arrange
      const csvData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          mobile: null
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          mobile: null
        }
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([]) // importContacts duplicate check for John
        .mockResolvedValueOnce([]) // createContact duplicate check for John
        .mockResolvedValueOnce([createMockContact()]) // Insert John
        .mockResolvedValueOnce([]) // importContacts duplicate check for Jane
        .mockResolvedValueOnce([]) // createContact duplicate check for Jane
        .mockResolvedValueOnce([createMockContact()]); // Insert Jane

      // Act
      const result = await contactService.importContacts(csvData, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.duplicateCount).toBe(0);
    });

    it('should skip duplicates', async () => {
      // Arrange
      const csvData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          mobile: null
        }
      ];

      vi.mocked(database.query).mockResolvedValueOnce([{ ContactID: 1 }]); // Duplicate

      // Act
      const result = await contactService.importContacts(csvData, 1);

      // Assert
      expect(result.duplicateCount).toBe(1);
      expect(result.successCount).toBe(0);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const csvData = [
        {
          firstName: 'Test',
          lastName: 'User',
          email: null,
          mobile: null
        }
      ];

      // Act
      const result = await contactService.importContacts(csvData, 1);

      // Assert
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('email or mobile');
    });
  });

  describe('exportContacts', () => {
    it('should export contacts as CSV', async () => {
      // Arrange
      const mockContacts = [
        createMockContact({ FirstName: 'John', LastName: 'Doe' })
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.exportContacts(1, 'csv');

      // Assert
      expect(result).toContain('FirstName');
      expect(result).toContain('John');
      expect(result).toContain('Doe');
    });

    it('should export contacts as JSON', async () => {
      // Arrange
      const mockContacts = [
        createMockContact({ FirstName: 'John', LastName: 'Doe' })
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockContacts);

      // Act
      const result = await contactService.exportContacts(1, 'json');

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].FirstName).toBe('John');
    });
  });

  describe('addContactTag', () => {
    it('should add tag to contact', async () => {
      // Arrange
      const mockContact = createMockContact({ Tags: 'existing' });
      const updatedContact = createMockContact({ Tags: 'existing,new' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContact]) // getContact
        .mockResolvedValueOnce([mockContact]) // getContact in update
        .mockResolvedValueOnce([updatedContact]); // update

      // Act
      const result = await contactService.addContactTag(1, 'new', 1);

      // Assert
      expect(result.Tags).toContain('new');
    });

    it('should not duplicate existing tag', async () => {
      // Arrange
      const mockContact = createMockContact({ Tags: 'existing' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContact]) // getContact
        .mockResolvedValueOnce([mockContact]) // getContact in update
        .mockResolvedValueOnce([mockContact]); // update (no change)

      // Act
      const result = await contactService.addContactTag(1, 'existing', 1);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('removeContactTag', () => {
    it('should remove tag from contact', async () => {
      // Arrange
      const mockContact = createMockContact({ Tags: 'tag1,tag2,tag3' });
      const updatedContact = createMockContact({ Tags: 'tag1,tag3' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContact]) // getContact
        .mockResolvedValueOnce([mockContact]) // getContact in update
        .mockResolvedValueOnce([updatedContact]); // update

      // Act
      const result = await contactService.removeContactTag(1, 'tag2', 1);

      // Assert
      expect(result.Tags).not.toContain('tag2');
    });
  });

  describe('updateEngagementScore', () => {
    it('should calculate and update engagement score', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([{ Score: 75 }]);

      // Act
      const result = await contactService.updateEngagementScore(1);

      // Assert
      expect(result).toBe(75);
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should return 0 for contact with no activity', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([{ Score: 0 }]);

      // Act
      const result = await contactService.updateEngagementScore(1);

      // Assert
      expect(result).toBe(0);
    });
  });
});

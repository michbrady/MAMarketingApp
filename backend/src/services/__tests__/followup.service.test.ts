import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FollowUpService } from '../followup.service';
import * as database from '../../config/database';
import { createMockFollowUp, futureDate, pastDate } from '../../__tests__/helpers/test-utils';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn(),
  executeProcedure: vi.fn()
}));

describe('FollowUpService', () => {
  let followUpService: FollowUpService;

  beforeEach(() => {
    vi.clearAllMocks();
    followUpService = new FollowUpService();
  });

  describe('createFollowUp', () => {
    it('should create follow-up task', async () => {
      // Arrange
      const followupData = {
        contactId: 1,
        dueDate: futureDate(3),
        priority: 'High' as const,
        type: 'Follow-up Call' as const,
        notes: 'Discuss proposal'
      };

      const mockFollowUp = createMockFollowUp();

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ FollowUpID: 1 }]) // Insert
        .mockResolvedValueOnce([]) // Create reminder
        .mockResolvedValueOnce([mockFollowUp]); // Get follow-up

      // Act
      const result = await followUpService.createFollowUp(followupData, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.followUpId).toBe(1);
      expect(database.query).toHaveBeenCalledTimes(3);
    });

    it('should set default status to Pending', async () => {
      // Arrange
      const followupData = {
        contactId: 1,
        dueDate: futureDate(1),
        priority: 'Medium' as const,
        type: 'Email' as const
      };

      const mockFollowUp = createMockFollowUp({ Status: 'Pending' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ FollowUpID: 1 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.createFollowUp(followupData, 1);

      // Assert
      expect(result.status).toBe('Pending');
    });

    it('should create reminder 24 hours before due date', async () => {
      // Arrange
      const dueDate = futureDate(3);
      const followupData = {
        contactId: 1,
        dueDate,
        priority: 'High' as const,
        type: 'Follow-up Call' as const
      };

      const mockFollowUp = createMockFollowUp();

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ FollowUpID: 1 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      await followUpService.createFollowUp(followupData, 1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('getFollowUp', () => {
    it('should get follow-up by ID', async () => {
      // Arrange
      const mockFollowUp = createMockFollowUp();
      vi.mocked(database.query).mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.getFollowUp(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.followUpId).toBe(1);
      expect(result.contactName).toBe('John Doe');
    });

    it('should fail for non-existent follow-up', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act & Assert
      await expect(
        followUpService.getFollowUp(999, 1)
      ).rejects.toThrow('not found or access denied');
    });

    it('should verify ownership', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act & Assert
      await expect(
        followUpService.getFollowUp(1, 999)
      ).rejects.toThrow('not found or access denied');
    });
  });

  describe('getFollowUps', () => {
    it('should get follow-ups with pagination', async () => {
      // Arrange
      const mockFollowUps = [
        createMockFollowUp({ FollowUpID: 1 }),
        createMockFollowUp({ FollowUpID: 2 })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 2 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { limit: 10, offset: 0 });

      // Assert
      expect(result.followUps).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      // Arrange
      const mockFollowUps = [createMockFollowUp({ Status: 'Pending' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { status: 'Pending' });

      // Assert
      expect(result.followUps).toHaveLength(1);
      expect(result.followUps[0].status).toBe('Pending');
    });

    it('should filter by priority', async () => {
      // Arrange
      const mockFollowUps = [createMockFollowUp({ Priority: 'High' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { priority: 'High' });

      // Assert
      expect(result.followUps).toHaveLength(1);
      expect(result.followUps[0].priority).toBe('High');
    });

    it('should filter by type', async () => {
      // Arrange
      const mockFollowUps = [createMockFollowUp({ Type: 'Follow-up Call' })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { type: 'Follow-up Call' });

      // Assert
      expect(result.followUps).toHaveLength(1);
    });

    it('should filter by contact', async () => {
      // Arrange
      const mockFollowUps = [createMockFollowUp({ ContactID: 1 })];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { contactId: 1 });

      // Assert
      expect(result.followUps).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      // Arrange
      const mockFollowUps = [createMockFollowUp()];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      // Assert
      expect(result.followUps).toHaveLength(1);
    });

    it('should filter overdue tasks', async () => {
      // Arrange
      const mockFollowUps = [
        createMockFollowUp({
          DueDate: pastDate(1),
          Status: 'Pending',
          IsOverdue: 1
        })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { overdue: true });

      // Assert
      expect(result.followUps).toHaveLength(1);
    });

    it('should filter upcoming tasks', async () => {
      // Arrange
      const mockFollowUps = [
        createMockFollowUp({
          DueDate: futureDate(1),
          Status: 'Pending'
        })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getFollowUps(1, { upcoming: true });

      // Assert
      expect(result.followUps).toHaveLength(1);
    });

    it('should apply default pagination', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 0 }])
        .mockResolvedValueOnce([]);

      // Act
      await followUpService.getFollowUps(1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUpcomingFollowUps', () => {
    it('should get upcoming follow-ups using stored procedure', async () => {
      // Arrange
      const mockFollowUps = [
        createMockFollowUp({ DueDate: futureDate(1) }),
        createMockFollowUp({ DueDate: futureDate(3) })
      ];

      vi.mocked(database.executeProcedure).mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getUpcomingFollowUps(1, 7);

      // Assert
      expect(result).toHaveLength(2);
      expect(database.executeProcedure).toHaveBeenCalledWith(
        'dbo.sp_GetUpcomingFollowUps',
        { UserID: 1, Days: 7 }
      );
    });

    it('should use default 7 days', async () => {
      // Arrange
      vi.mocked(database.executeProcedure).mockResolvedValueOnce([]);

      // Act
      await followUpService.getUpcomingFollowUps(1);

      // Assert
      expect(database.executeProcedure).toHaveBeenCalledWith(
        'dbo.sp_GetUpcomingFollowUps',
        { UserID: 1, Days: 7 }
      );
    });
  });

  describe('getOverdueFollowUps', () => {
    it('should get overdue follow-ups using stored procedure', async () => {
      // Arrange
      const mockFollowUps = [
        createMockFollowUp({ DueDate: pastDate(1), IsOverdue: 1 }),
        createMockFollowUp({ DueDate: pastDate(3), IsOverdue: 1 })
      ];

      vi.mocked(database.executeProcedure).mockResolvedValueOnce(mockFollowUps);

      // Act
      const result = await followUpService.getOverdueFollowUps(1);

      // Assert
      expect(result).toHaveLength(2);
      expect(database.executeProcedure).toHaveBeenCalledWith(
        'dbo.sp_GetOverdueFollowUps',
        { UserID: 1 }
      );
    });
  });

  describe('updateFollowUp', () => {
    it('should update follow-up fields', async () => {
      // Arrange
      const updates = {
        priority: 'Low' as const,
        notes: 'Updated notes'
      };

      const mockFollowUp = createMockFollowUp(updates);

      vi.mocked(database.query)
        .mockResolvedValueOnce([]) // Update
        .mockResolvedValueOnce([mockFollowUp]); // Get updated

      // Act
      const result = await followUpService.updateFollowUp(1, updates, 1);

      // Assert
      expect(result.priority).toBe('Low');
      expect(result.notes).toBe('Updated notes');
    });

    it('should update due date', async () => {
      // Arrange
      const newDate = futureDate(7);
      const updates = { dueDate: newDate };

      const mockFollowUp = createMockFollowUp({ DueDate: newDate });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.updateFollowUp(1, updates, 1);

      // Assert
      expect(result).toBeDefined();
    });

    it('should fail with no fields to update', async () => {
      // Act & Assert
      await expect(
        followUpService.updateFollowUp(1, {}, 1)
      ).rejects.toThrow('No valid fields to update');
    });
  });

  describe('completeFollowUp', () => {
    it('should mark follow-up as completed', async () => {
      // Arrange
      const completionData = {
        notes: 'Successfully contacted'
      };

      const mockFollowUp = createMockFollowUp({
        Status: 'Completed',
        CompletedDate: new Date(),
        CompletedNotes: 'Successfully contacted'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([]) // Update follow-up
        .mockResolvedValueOnce([]) // Update contact
        .mockResolvedValueOnce([mockFollowUp]); // Get follow-up

      // Act
      const result = await followUpService.completeFollowUp(1, 1, completionData);

      // Assert
      expect(result.status).toBe('Completed');
      expect(result.completedNotes).toBe('Successfully contacted');
    });

    it('should update contact last contact date', async () => {
      // Arrange
      const mockFollowUp = createMockFollowUp({ Status: 'Completed' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      await followUpService.completeFollowUp(1, 1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(3);
    });

    it('should work without completion notes', async () => {
      // Arrange
      const mockFollowUp = createMockFollowUp({ Status: 'Completed' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.completeFollowUp(1, 1);

      // Assert
      expect(result.status).toBe('Completed');
    });
  });

  describe('snoozeFollowUp', () => {
    it('should snooze follow-up to new date', async () => {
      // Arrange
      const newDate = futureDate(5);
      const snoozeData = { newDueDate: newDate };

      const mockFollowUp = createMockFollowUp({
        DueDate: newDate,
        Status: 'Snoozed',
        SnoozedUntil: newDate,
        SnoozedCount: 1
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([]) // Update follow-up
        .mockResolvedValueOnce([]) // Update reminder
        .mockResolvedValueOnce([mockFollowUp]); // Get follow-up

      // Act
      const result = await followUpService.snoozeFollowUp(1, snoozeData, 1);

      // Assert
      expect(result.status).toBe('Snoozed');
      expect(result.snoozedCount).toBe(1);
    });

    it('should increment snooze count', async () => {
      // Arrange
      const newDate = futureDate(5);
      const snoozeData = { newDueDate: newDate };

      const mockFollowUp = createMockFollowUp({ SnoozedCount: 2 });

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.snoozeFollowUp(1, snoozeData, 1);

      // Assert
      expect(result.snoozedCount).toBe(2);
    });

    it('should update reminder date', async () => {
      // Arrange
      const newDate = futureDate(5);
      const snoozeData = { newDueDate: newDate };

      const mockFollowUp = createMockFollowUp();

      vi.mocked(database.query)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFollowUp]);

      // Act
      await followUpService.snoozeFollowUp(1, snoozeData, 1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleteFollowUp', () => {
    it('should delete follow-up', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await followUpService.deleteFollowUp(1, 1);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('createAutomatedFollowUp', () => {
    it('should create automated follow-up after share', async () => {
      // Arrange
      const mockFollowUp = createMockFollowUp();

      vi.mocked(database.executeProcedure)
        .mockResolvedValueOnce([{ FollowUpID: 1 }]);

      vi.mocked(database.query).mockResolvedValueOnce([mockFollowUp]);

      // Act
      const result = await followUpService.createAutomatedFollowUp(1, 1, 1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(result.followUpId).toBe(1);
    });

    it('should use default days parameter', async () => {
      // Arrange
      vi.mocked(database.executeProcedure)
        .mockResolvedValueOnce([{ FollowUpID: 1 }]);

      vi.mocked(database.query).mockResolvedValueOnce([createMockFollowUp()]);

      // Act
      await followUpService.createAutomatedFollowUp(1, 1, 1);

      // Assert
      expect(database.executeProcedure).toHaveBeenCalledWith(
        'dbo.sp_CreateAutomatedFollowUp',
        expect.objectContaining({ DefaultDays: 3 })
      );
    });
  });

  describe('getFollowUpStats', () => {
    it('should get follow-up statistics', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalPending: 5,
          TotalOverdue: 2,
          TotalCompleted: 10,
          TotalCancelled: 1,
          UpcomingToday: 3,
          UpcomingThisWeek: 5,
          AvgCompletionTime: 48
        }])
        .mockResolvedValueOnce([
          { Priority: 'High', Count: 3 },
          { Priority: 'Medium', Count: 2 }
        ])
        .mockResolvedValueOnce([
          { Type: 'Follow-up Call', Count: 4 },
          { Type: 'Email', Count: 1 }
        ]);

      // Act
      const result = await followUpService.getFollowUpStats(1);

      // Assert
      expect(result.totalPending).toBe(5);
      expect(result.totalOverdue).toBe(2);
      expect(result.totalCompleted).toBe(10);
      expect(result.upcomingToday).toBe(3);
      expect(result.byPriority).toHaveLength(2);
      expect(result.byType).toHaveLength(2);
    });

    it('should calculate completion rate', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalPending: 5,
          TotalOverdue: 0,
          TotalCompleted: 10,
          TotalCancelled: 0,
          UpcomingToday: 0,
          UpcomingThisWeek: 0,
          AvgCompletionTime: 48
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await followUpService.getFollowUpStats(1);

      // Assert
      expect(result.completionRate).toBe(67); // 10 / (5 + 10) * 100 = 67%
    });

    it('should handle zero tasks', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalPending: 0,
          TotalOverdue: 0,
          TotalCompleted: 0,
          TotalCancelled: 0,
          UpcomingToday: 0,
          UpcomingThisWeek: 0,
          AvgCompletionTime: null
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await followUpService.getFollowUpStats(1);

      // Assert
      expect(result.totalPending).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });
});

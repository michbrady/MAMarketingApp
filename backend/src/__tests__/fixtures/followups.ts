import { addDays, addHours, subDays } from 'date-fns';

const now = new Date();

export const testFollowUps = {
  upcoming: {
    contactId: 1,
    title: 'Follow up on product demo',
    dueDate: addDays(now, 2).toISOString(),
    priority: 'High',
    status: 'Pending'
  },
  overdue: {
    contactId: 1,
    title: 'Overdue follow-up',
    dueDate: subDays(now, 1).toISOString(),
    priority: 'High',
    status: 'Pending'
  },
  completed: {
    contactId: 2,
    title: 'Completed follow-up',
    dueDate: subDays(now, 3).toISOString(),
    priority: 'Medium',
    status: 'Completed'
  }
};

export const newFollowUpData = {
  valid: {
    contactId: 1,
    title: 'Schedule product demo',
    description: 'Contact expressed interest in product features',
    dueDate: addDays(now, 3).toISOString(),
    priority: 'High',
    type: 'Call'
  },
  minimal: {
    contactId: 1,
    title: 'Quick follow-up',
    dueDate: addDays(now, 1).toISOString()
  },
  missingTitle: {
    contactId: 1,
    dueDate: addDays(now, 1).toISOString()
  },
  missingDueDate: {
    contactId: 1,
    title: 'No due date'
  },
  missingContact: {
    title: 'No contact specified',
    dueDate: addDays(now, 1).toISOString()
  },
  invalidContactId: {
    contactId: 9999,
    title: 'Invalid contact',
    dueDate: addDays(now, 1).toISOString()
  },
  pastDueDate: {
    contactId: 1,
    title: 'Past due date',
    dueDate: subDays(now, 5).toISOString()
  },
  invalidPriority: {
    contactId: 1,
    title: 'Invalid priority',
    dueDate: addDays(now, 1).toISOString(),
    priority: 'SuperUrgent' // Invalid priority value
  }
};

export const followUpUpdates = {
  updateTitle: {
    title: 'Updated follow-up title'
  },
  updateDueDate: {
    dueDate: addDays(now, 5).toISOString()
  },
  updatePriority: {
    priority: 'Low'
  },
  updateStatus: {
    status: 'Completed'
  },
  updateAll: {
    title: 'Completely updated',
    description: 'All fields updated',
    dueDate: addDays(now, 7).toISOString(),
    priority: 'Medium',
    status: 'In Progress'
  }
};

export const snoozeOptions = {
  oneHour: {
    duration: 3600, // seconds
    newDueDate: addHours(now, 1).toISOString()
  },
  oneDay: {
    duration: 86400,
    newDueDate: addDays(now, 1).toISOString()
  },
  threeDays: {
    duration: 259200,
    newDueDate: addDays(now, 3).toISOString()
  },
  oneWeek: {
    duration: 604800,
    newDueDate: addDays(now, 7).toISOString()
  }
};

export const followUpFilters = {
  byPriority: {
    high: { priority: 'High' },
    medium: { priority: 'Medium' },
    low: { priority: 'Low' }
  },
  byStatus: {
    pending: { status: 'Pending' },
    inProgress: { status: 'In Progress' },
    completed: { status: 'Completed' },
    cancelled: { status: 'Cancelled' }
  },
  byType: {
    call: { type: 'Call' },
    email: { type: 'Email' },
    meeting: { type: 'Meeting' },
    task: { type: 'Task' }
  },
  byDate: {
    overdue: { overdue: true },
    today: { dueDate: now.toISOString().split('T')[0] },
    thisWeek: {
      dueDateFrom: now.toISOString(),
      dueDateTo: addDays(now, 7).toISOString()
    }
  }
};

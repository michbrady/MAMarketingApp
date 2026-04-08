export const testContacts = {
  contact1: {
    id: 1,
    userId: 2,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobile: '+15551234567',
    status: 'Active'
  },
  contact2: {
    id: 2,
    userId: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    mobile: '+15559876543',
    status: 'Active'
  },
  contact3: {
    id: 3,
    userId: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    mobile: '+15555555555',
    status: 'Active'
  }
};

export const newContactData = {
  valid: {
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
    mobile: '+15551112222',
    notes: 'Met at conference'
  },
  minimal: {
    firstName: 'Bob',
    lastName: 'Brown',
    email: 'bob.brown@example.com'
  },
  invalidEmail: {
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'notanemail'
    // Invalid email format and no mobile
  },
  missingRequired: {
    firstName: 'Test'
    // Missing both email and mobile (violates "email OR mobile" requirement)
  },
  duplicateEmail: {
    firstName: 'Duplicate',
    lastName: 'Contact',
    email: 'john.doe@example.com' // Already exists
  }
};

export const contactImportData = {
  valid: [
    {
      firstName: 'Import',
      lastName: 'One',
      email: 'import1@example.com',
      mobile: '+15551111111'
    },
    {
      firstName: 'Import',
      lastName: 'Two',
      email: 'import2@example.com',
      mobile: '+15552222222'
    },
    {
      firstName: 'Import',
      lastName: 'Three',
      email: 'import3@example.com',
      mobile: '+15553333333'
    }
  ],
  withErrors: [
    {
      firstName: 'Valid',
      lastName: 'Contact',
      email: 'valid@example.com'
    },
    {
      firstName: 'Missing',
      lastName: 'Contact Info'
      // Missing both email and mobile - will fail validation
    },
    {
      firstName: 'Also',
      lastName: 'Missing',
      companyName: 'Test Company'
      // Missing both email and mobile - will fail validation
    }
  ]
};

export const contactTags = {
  valid: ['prospect', 'hot-lead', 'vip', 'event-attendee'],
  invalid: ['', '   ', 'tag-with-@-symbol', 'way-too-long-tag-name-that-exceeds-maximum-length-limit']
};

export const testUsers = {
  admin: {
    id: 1,
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    status: 'Active'
  },
  ufo: {
    id: 2,
    email: 'ufo@test.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'UFO',
    role: 'UFO',
    status: 'Active'
  },
  ufo2: {
    id: 3,
    email: 'ufo2@test.com',
    password: 'password123',
    firstName: 'Another',
    lastName: 'UFO',
    role: 'UFO',
    status: 'Active'
  },
  inactive: {
    id: 4,
    email: 'inactive@test.com',
    password: 'password123',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'UFO',
    status: 'Inactive'
  }
};

export const newUserData = {
  valid: {
    email: 'newuser@test.com',
    password: 'SecurePass123!',
    firstName: 'New',
    lastName: 'User',
    roleId: 2,
    marketId: 1
  },
  invalidEmail: {
    email: 'notanemail',
    password: 'SecurePass123!',
    firstName: 'New',
    lastName: 'User'
  },
  missingPassword: {
    email: 'newuser@test.com',
    firstName: 'New',
    lastName: 'User'
  },
  weakPassword: {
    email: 'newuser@test.com',
    password: '123',
    firstName: 'New',
    lastName: 'User'
  }
};

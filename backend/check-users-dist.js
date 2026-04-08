import { query } from './dist/config/database.js';

async function checkUsers() {
  try {
    const users = await query(`
      SELECT
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        u.Status,
        r.RoleName
      FROM dbo.[User] u
      LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
      ORDER BY u.UserID
    `);

    console.log('Total users in database:', users.length);
    console.log('');

    if (users.length === 0) {
      console.log('No users found in database!');
    } else {
      users.forEach(u => {
        console.log(`ID: ${u.UserID}, Email: ${u.Email}, Name: ${u.FirstName} ${u.LastName}, Role: ${u.RoleName || 'N/A'}, Status: ${u.Status}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkUsers();

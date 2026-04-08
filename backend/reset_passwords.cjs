/**
 * Reset user passwords for testing
 * Sets default passwords for admin and test users
 */

const bcrypt = require('bcryptjs');
const { query } = require('./dist/config/database.js');

// Password: Password123!
const testPassword = 'Password123!';

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

async function resetPasswords() {
  try {
    console.log('Resetting passwords for test users...\n');

    const users = [
      { email: 'admin@unfranchise.com', password: 'Password123!' },
      { email: 'content.manager@unfranchise.com', password: 'Password123!' },
      { email: 'marketing.director@unfranchise.com', password: 'Password123!' },
      { email: 'john.smith@example.com', password: 'Password123!' },
      { email: 'maria.garcia@example.com', password: 'Password123!' },
      { email: 'ufo@unfranchise.com', password: 'Password123!' },
    ];

    for (const user of users) {
      const hash = await hashPassword(user.password);

      await query(`
        UPDATE dbo.[User]
        SET PasswordHash = @hash,
            UpdatedDate = SYSDATETIME()
        WHERE Email = @email
      `, { hash, email: user.email });

      console.log(`✓ Updated password for: ${user.email}`);
    }

    console.log('\n✓ All passwords reset successfully!');
    console.log('\nDefault credentials:');
    console.log('  Email: admin@unfranchise.com');
    console.log('  Password: Password123!');
    console.log('\n  Email: john.smith@example.com (UFO)');
    console.log('  Password: Password123!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
}

resetPasswords();

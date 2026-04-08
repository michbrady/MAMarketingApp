import { query } from './dist/config/database.js';

async function testAPI() {
  try {
    // Simulate what the service does
    const filters = {};
    const page = 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    
    const conditions = ['1=1'];
    const params = { offset, limit };
    const whereClause = conditions.join(' AND ');
    const orderByClause = 'u.CreatedDate DESC';
    
    console.log('WHERE clause:', whereClause);
    console.log('Params:', params);
    console.log('');
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as Total
      FROM dbo.[User] u
      LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
      LEFT JOIN dbo.Market m ON u.MarketID = m.MarketID
      WHERE ${whereClause}
    `, params);
    
    console.log('Total count:', countResult[0]?.Total || 0);
    console.log('');
    
    // Get users
    const users = await query(`
      SELECT
        u.UserID as userId,
        u.Email as email,
        u.FirstName as firstName,
        u.LastName as lastName,
        r.RoleName as roleName,
        m.MarketName as marketName,
        u.Status as status,
        u.LastLoginDate as lastLoginDate,
        u.CreatedDate as createdDate
      FROM dbo.[User] u
      LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
      LEFT JOIN dbo.Market m ON u.MarketID = m.MarketID
      LEFT JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `, params);
    
    console.log('Users returned:', users.length);
    console.log('');
    
    if (users.length > 0) {
      console.log('First user:', JSON.stringify(users[0], null, 2));
      console.log('');
      
      // Map like controller does
      const mapped = users.map(user => ({
        id: user.userId.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.roleName,
        market: user.marketName,
        status: user.status,
        lastLogin: user.lastLoginDate,
        createdDate: user.createdDate
      }));
      
      console.log('Mapped first user:', JSON.stringify(mapped[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
  process.exit(0);
}

testAPI();

"""
Create test users for authentication testing
"""
import pyodbc
import bcrypt

DB_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=UnFranchiseMarketing;'
    r'UID=unfranchise_app;'
    r'PWD=UnFr@nch1se2026!;'
    r'TrustServerCertificate=yes;'
)

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

print("="*70)
print("Creating Test Users")
print("="*70)

try:
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()

    # Get role IDs
    cursor.execute("SELECT RoleID, RoleName FROM [Role]")
    roles = {row.RoleName: row.RoleID for row in cursor.fetchall()}

    # Get first market
    cursor.execute("SELECT TOP 1 MarketID FROM Market")
    market_id = cursor.fetchone()[0]

    # Get first language
    cursor.execute("SELECT TOP 1 LanguageID FROM [Language]")
    language_id = cursor.fetchone()[0]

    # Test users to create
    test_users = [
        {
            'email': 'admin@unfranchise.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'Corporate Admin'
        },
        {
            'email': 'ufo@unfranchise.com',
            'password': 'ufo123',
            'first_name': 'UFO',
            'last_name': 'Demo',
            'role': 'UFO'
        },
        {
            'email': 'super@unfranchise.com',
            'password': 'super123',
            'first_name': 'Super',
            'last_name': 'Admin',
            'role': 'Super Admin'
        }
    ]

    print("\nCreating test users...")
    for user_data in test_users:
        try:
            # Check if user exists
            cursor.execute(
                "SELECT UserID FROM [User] WHERE Email = ?",
                user_data['email']
            )

            if cursor.fetchone():
                print(f"  i User already exists: {user_data['email']}")
                continue

            # Hash password
            password_hash = hash_password(user_data['password'])

            # Insert user
            cursor.execute("""
                INSERT INTO [User] (
                    Email, PasswordHash, FirstName, LastName, RoleID, MarketID,
                    PreferredLanguageID, IsActive, CreatedAt, UpdatedAt
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, GETDATE(), GETDATE())
            """, (
                user_data['email'],
                password_hash,
                user_data['first_name'],
                user_data['last_name'],
                roles[user_data['role']],
                market_id,
                language_id
            ))

            conn.commit()
            print(f"  OK Created: {user_data['email']} (password: {user_data['password']})")

        except Exception as e:
            print(f"  X Error creating {user_data['email']}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()

    print("\n" + "="*70)
    print("Test Users Created Successfully!")
    print("="*70)
    print("\nTest Credentials:")
    print("\n  UFO User:")
    print("    Email: ufo@unfranchise.com")
    print("    Password: ufo123")
    print("\n  Admin User:")
    print("    Email: admin@unfranchise.com")
    print("    Password: admin123")
    print("\n  Super Admin:")
    print("    Email: super@unfranchise.com")
    print("    Password: super123")
    print("\nYou can now test the login API with these credentials.")

except Exception as e:
    print(f"\nX Error: {e}")
    import traceback
    traceback.print_exc()

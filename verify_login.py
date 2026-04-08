"""
Verify SQL Server login was created and check authentication mode
"""
import pyodbc

# Using Windows Auth to check
MASTER_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

print("="*70)
print("Verifying SQL Server Login")
print("="*70)

try:
    conn = pyodbc.connect(MASTER_CONN_STR)
    cursor = conn.cursor()

    # Check if login exists
    print("\n1. Checking if login exists...")
    cursor.execute("""
        SELECT name, type_desc, is_disabled, default_database_name
        FROM sys.server_principals
        WHERE name = 'unfranchise_app'
    """)

    row = cursor.fetchone()
    if row:
        print(f"  OK Login found: {row.name}")
        print(f"     Type: {row.type_desc}")
        print(f"     Disabled: {row.is_disabled}")
        print(f"     Default DB: {row.default_database_name}")
    else:
        print("  X Login NOT found!")

    # Check SQL Server authentication mode
    print("\n2. Checking SQL Server authentication mode...")
    cursor.execute("""
        EXEC xp_instance_regread
        N'HKEY_LOCAL_MACHINE',
        N'Software\\Microsoft\\MSSQLServer\\MSSQLServer',
        N'LoginMode'
    """)

    row = cursor.fetchone()
    if row:
        login_mode = row[1]
        if login_mode == 1:
            print("  ! Authentication Mode: Windows Authentication ONLY")
            print("     SQL Server Authentication is DISABLED")
            print("     This server needs Mixed Mode authentication enabled!")
        elif login_mode == 2:
            print("  OK Authentication Mode: Mixed Mode")
            print("     Both Windows and SQL Server auth enabled")

    # Check database user
    print("\n3. Checking database user...")
    cursor.execute("USE UnFranchiseMarketing")
    cursor.execute("""
        SELECT name, type_desc
        FROM sys.database_principals
        WHERE name = 'unfranchise_app'
    """)

    row = cursor.fetchone()
    if row:
        print(f"  OK Database user found: {row.name}")
        print(f"     Type: {row.type_desc}")
    else:
        print("  X Database user NOT found!")

    # Check permissions
    print("\n4. Checking permissions...")
    cursor.execute("""
        SELECT
            dp.name AS PrincipalName,
            dp.type_desc AS PrincipalType,
            r.name AS RoleName
        FROM sys.database_role_members drm
        INNER JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id
        INNER JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
        WHERE dp.name = 'unfranchise_app'
    """)

    rows = cursor.fetchall()
    if rows:
        print("  Roles assigned:")
        for row in rows:
            print(f"    - {row.RoleName}")
    else:
        print("  No roles assigned")

    cursor.close()
    conn.close()

    print("\n" + "="*70)
    print("Verification Complete")
    print("="*70)

except Exception as e:
    print(f"\nX Error: {e}")
    import traceback
    traceback.print_exc()

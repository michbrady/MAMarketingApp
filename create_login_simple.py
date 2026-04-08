"""
Create SQL Server login - simpler version with direct execution
"""
import pyodbc

MASTER_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

print("="*70)
print("Creating SQL Server Login")
print("="*70)

try:
    print("\nConnecting to SQL Server...")
    conn = pyodbc.connect(MASTER_CONN_STR)
    conn.autocommit = True
    cursor = conn.cursor()
    print("  Connected!")

    # Create login
    print("\n1. Creating server login...")
    try:
        cursor.execute("""
            CREATE LOGIN unfranchise_app
            WITH PASSWORD = 'UnFr@nch1se2026!',
            DEFAULT_DATABASE = UnFranchiseMarketing,
            CHECK_POLICY = OFF,
            CHECK_EXPIRATION = OFF
        """)
        print("  OK Login created: unfranchise_app")
    except pyodbc.Error as e:
        if 'already exists' in str(e).lower():
            print("  i Login already exists")
        else:
            print(f"  X Error creating login: {e}")

    # Switch to application database
    print("\n2. Switching to UnFranchiseMarketing database...")
    cursor.execute("USE UnFranchiseMarketing")
    print("  OK")

    # Create database user
    print("\n3. Creating database user...")
    try:
        cursor.execute("CREATE USER unfranchise_app FOR LOGIN unfranchise_app")
        print("  OK User created: unfranchise_app")
    except pyodbc.Error as e:
        if 'already exists' in str(e).lower():
            print("  i User already exists")
        else:
            print(f"  X Error creating user: {e}")

    # Grant permissions
    print("\n4. Granting permissions...")
    try:
        cursor.execute("ALTER ROLE db_datareader ADD MEMBER unfranchise_app")
        print("  OK Added to db_datareader")
    except Exception as e:
        print(f"  i db_datareader: {e}")

    try:
        cursor.execute("ALTER ROLE db_datawriter ADD MEMBER unfranchise_app")
        print("  OK Added to db_datawriter")
    except Exception as e:
        print(f"  i db_datawriter: {e}")

    try:
        cursor.execute("GRANT EXECUTE TO unfranchise_app")
        print("  OK Granted EXECUTE permission")
    except Exception as e:
        print(f"  i EXECUTE: {e}")

    cursor.close()
    conn.close()

    print("\n" + "="*70)
    print("OK Login Created Successfully!")
    print("="*70)
    print("\nCredentials:")
    print("  Username: unfranchise_app")
    print("  Password: UnFr@nch1se2026!")

except Exception as e:
    print(f"\nX Fatal Error: {e}")
    import traceback
    traceback.print_exc()

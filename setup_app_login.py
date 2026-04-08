"""
Create SQL Server login for UnFranchise Marketing App
"""
import pyodbc
import sys

# Master connection to create login
MASTER_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

def create_app_login():
    print("="*70)
    print("Creating SQL Server Login for UnFranchise Marketing App")
    print("="*70)

    try:
        conn = pyodbc.connect(MASTER_CONN_STR)
        cursor = conn.cursor()

        # Read and execute the SQL script
        with open('create_app_login.sql', 'r') as f:
            sql_script = f.read()

        # Split by GO and execute each batch
        batches = [b.strip() for b in sql_script.split('GO') if b.strip()]

        for batch in batches:
            if batch.strip() and not batch.strip().startswith('--'):
                try:
                    cursor.execute(batch)
                    cursor.commit()

                    # Print any messages
                    while cursor.nextset():
                        pass

                    if cursor.messages:
                        for msg in cursor.messages:
                            if len(msg) > 1:
                                print(f"  {msg[1]}")

                except pyodbc.Error as e:
                    print(f"  Warning: {e}")
                    cursor.rollback()

        cursor.close()
        conn.close()

        print("\n" + "="*70)
        print("OK SQL Server Login Created Successfully!")
        print("="*70)
        print("\nConnection Details:")
        print("  Server:   dbms-dwhs.corp.shop.com\\DWP01")
        print("  Database: UnFranchiseMarketing")
        print("  Username: unfranchise_app")
        print("  Password: UnFr@nch1se2026!")
        print("\nUpdate your backend/.env file with these credentials.")

        return 0

    except Exception as e:
        print(f"\nX Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(create_app_login())

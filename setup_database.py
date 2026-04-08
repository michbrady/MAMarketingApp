"""
Setup UnFranchise Marketing App Database
Creates database and runs all schema scripts
"""
import pyodbc
import sys
import os
from pathlib import Path

# Database connection string - connects to master to create database
MASTER_CONN_STR = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
)

# Database connection string - for running scripts on the new database
DB_CONN_STR = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=UnFranchiseMarketing;'
    r'Trusted_Connection=yes;'
)

DATABASE_NAME = 'UnFranchiseMarketing'

def create_database():
    """Create the UnFranchiseMarketing database if it doesn't exist"""
    print(f"\n{'='*70}")
    print(f"Creating Database: {DATABASE_NAME}")
    print('='*70)

    try:
        conn = pyodbc.connect(MASTER_CONN_STR)
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(f"""
            SELECT database_id
            FROM sys.databases
            WHERE name = '{DATABASE_NAME}'
        """)

        if cursor.fetchone():
            print(f"  ℹ Database '{DATABASE_NAME}' already exists")

            # Ask if they want to drop and recreate
            response = input("\n  Do you want to drop and recreate? (yes/no): ").strip().lower()
            if response == 'yes':
                print(f"\n  Dropping database '{DATABASE_NAME}'...")

                # Set to single user mode to drop
                cursor.execute(f"""
                    ALTER DATABASE [{DATABASE_NAME}]
                    SET SINGLE_USER WITH ROLLBACK IMMEDIATE
                """)
                cursor.execute(f"DROP DATABASE [{DATABASE_NAME}]")
                print(f"  ✓ Database dropped")
            else:
                print(f"  Using existing database")
                cursor.close()
                conn.close()
                return True

        # Create database
        print(f"\n  Creating database '{DATABASE_NAME}'...")
        cursor.execute(f"""
            CREATE DATABASE [{DATABASE_NAME}]
            COLLATE SQL_Latin1_General_CP1_CI_AS
        """)

        print(f"  ✓ Database '{DATABASE_NAME}' created successfully")

        cursor.close()
        conn.close()

        print(f"{'='*70}")
        print(f"✓ Database Creation COMPLETED")
        print('='*70)
        return True

    except pyodbc.Error as e:
        print(f"  ✗ DATABASE ERROR: {e}")
        return False
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        return False

def run_sql_file(filepath, description):
    """Run a SQL script file"""
    print(f"\n{'='*70}")
    print(f"Running: {description}")
    print(f"File: {filepath}")
    print('='*70)

    try:
        # Read the SQL file
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Split by GO statements
        sql_commands = [cmd.strip() for cmd in sql_content.split('GO') if cmd.strip()]

        print(f"  Found {len(sql_commands)} SQL commands to execute")

        # Connect to database
        conn = pyodbc.connect(DB_CONN_STR)
        conn.autocommit = False
        cursor = conn.cursor()

        # Execute each command
        for i, command in enumerate(sql_commands, 1):
            # Skip comments and empty lines
            cleaned_cmd = '\n'.join([line for line in command.split('\n')
                                    if line.strip() and not line.strip().startswith('--')])

            if not cleaned_cmd.strip():
                continue

            try:
                print(f"\n  Executing command {i}/{len(sql_commands)}...")
                cursor.execute(command)

                # Check for messages (PRINT statements)
                while cursor.nextset():
                    pass

                # Get any messages
                if cursor.messages:
                    for msg in cursor.messages:
                        print(f"    {msg[1]}")

                conn.commit()
                print(f"    ✓ Success")

            except pyodbc.Error as e:
                print(f"    ✗ Error: {e}")
                print(f"    Command preview: {command[:100]}...")
                conn.rollback()
                # Continue with next command

        cursor.close()
        conn.close()

        print(f"\n{'='*70}")
        print(f"✓ {description} - COMPLETED")
        print('='*70)
        return True

    except FileNotFoundError:
        print(f"  ✗ ERROR: File not found: {filepath}")
        return False
    except pyodbc.Error as e:
        print(f"  ✗ DATABASE ERROR: {e}")
        return False
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_setup():
    """Verify database setup"""
    print(f"\n{'='*70}")
    print("VERIFICATION")
    print('='*70)

    try:
        conn = pyodbc.connect(DB_CONN_STR)
        cursor = conn.cursor()

        # Check table count
        print("\n1. Checking database objects...")
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS TableCount,
                (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS ProcedureCount,
                (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS ViewCount
        """)
        row = cursor.fetchone()
        if row:
            print(f"  ✓ Tables: {row.TableCount}")
            print(f"  ✓ Stored Procedures: {row.ProcedureCount}")
            print(f"  ✓ Views: {row.ViewCount}")

        # List key tables
        print("\n2. Key tables created:")
        cursor.execute("""
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            AND TABLE_SCHEMA IN ('identity', 'content', 'sharing', 'notifications', 'audit')
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)

        current_schema = None
        for row in cursor.fetchall():
            if current_schema != row.TABLE_SCHEMA:
                current_schema = row.TABLE_SCHEMA
                print(f"\n  Schema: {current_schema}")
            print(f"    - {row.TABLE_NAME}")

        cursor.close()
        conn.close()

        print(f"\n{'='*70}")
        print("✓ VERIFICATION COMPLETE")
        print('='*70)
        return True

    except Exception as e:
        print(f"  ✗ VERIFICATION ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("="*70)
    print("UnFranchise Marketing App - Database Setup")
    print("="*70)
    print(f"\nTarget Server: dbms-dwhs.corp.shop.com\\DWP01")
    print(f"Database Name: {DATABASE_NAME}")
    print("\nThis will:")
    print("  1. Create the database (if needed)")
    print("  2. Create all schemas")
    print("  3. Create all tables")
    print("  4. Create stored procedures")
    print("  5. Create views")
    print("  6. Load seed data")

    response = input("\nContinue? (yes/no): ").strip().lower()
    if response != 'yes':
        print("\nSetup cancelled.")
        return 0

    success = True

    # Step 1: Create database
    if not create_database():
        print("\n✗ Failed to create database")
        return 1

    # Step 2: Run schema scripts in order
    database_dir = Path(__file__).parent / 'database'

    scripts = [
        ('02_Schema_Core_Tables.sql', 'Core Tables (Users, Content, Markets)'),
        ('03_Schema_Sharing_Tracking.sql', 'Sharing & Tracking Tables'),
        ('04_Schema_Notifications_Audit.sql', 'Notifications & Audit Tables'),
        ('05_Stored_Procedures.sql', 'Stored Procedures'),
        ('06_Views.sql', 'Analytical Views'),
        ('07_Seed_Data.sql', 'Seed Data'),
    ]

    for script_file, description in scripts:
        script_path = database_dir / script_file
        if not script_path.exists():
            print(f"\n  ⚠ Warning: {script_file} not found, skipping...")
            continue

        if not run_sql_file(str(script_path), description):
            print(f"\n  ⚠ Warning: {description} failed, continuing...")
            success = False

    # Step 3: Verify
    if not verify_setup():
        success = False

    # Summary
    print("\n" + "="*70)
    if success:
        print("✓ DATABASE SETUP COMPLETE!")
        print("="*70)
        print(f"\nDatabase: {DATABASE_NAME}")
        print(f"Server: dbms-dwhs.corp.shop.com\\DWP01")
        print("\nNext steps:")
        print("  1. Update backend/.env with database connection")
        print("  2. Start backend: cd backend && npm run dev")
        print("  3. Start frontend: cd frontend && npm run dev")
        return 0
    else:
        print("⚠ DATABASE SETUP COMPLETED WITH WARNINGS")
        print("="*70)
        print("\nSome scripts may have failed. Review errors above.")
        print("The database may still be functional for basic operations.")
        return 0

if __name__ == '__main__':
    sys.exit(main())

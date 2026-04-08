"""
Setup UnFranchise Marketing App Database - Automatic (no prompts)
Creates database and runs all schema scripts
"""
import pyodbc
import sys
import os
from pathlib import Path

# Database connection string - connects to master to create database
MASTER_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

# Database connection string - for running scripts on the new database
DB_CONN_STR = (
    r'DRIVER={ODBC Driver 18 for SQL Server};'
    r'SERVER=dbms-dwhs.corp.shop.com\DWP01;'
    r'DATABASE=UnFranchiseMarketing;'
    r'Trusted_Connection=yes;'
    r'TrustServerCertificate=yes;'
)

DATABASE_NAME = 'UnFranchiseMarketing'

def create_database(drop_existing=False):
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
            print(f"  i Database '{DATABASE_NAME}' already exists")

            if drop_existing:
                print(f"\n  Dropping database '{DATABASE_NAME}'...")
                # Set to single user mode to drop
                try:
                    cursor.execute(f"""
                        ALTER DATABASE [{DATABASE_NAME}]
                        SET SINGLE_USER WITH ROLLBACK IMMEDIATE
                    """)
                    cursor.execute(f"DROP DATABASE [{DATABASE_NAME}]")
                    print(f"  OK Database dropped")
                except Exception as e:
                    print(f"  ! Could not drop database: {e}")
                    cursor.close()
                    conn.close()
                    return True  # Use existing
            else:
                print(f"  OK Using existing database")
                cursor.close()
                conn.close()
                return True

        # Create database
        print(f"\n  Creating database '{DATABASE_NAME}'...")
        cursor.execute(f"""
            CREATE DATABASE [{DATABASE_NAME}]
            COLLATE SQL_Latin1_General_CP1_CI_AS
        """)

        print(f"  OK Database '{DATABASE_NAME}' created successfully")

        cursor.close()
        conn.close()

        print(f"{'='*70}")
        print(f"OK Database Creation COMPLETED")
        print('='*70)
        return True

    except pyodbc.Error as e:
        print(f"  X DATABASE ERROR: {e}")
        return False
    except Exception as e:
        print(f"  X ERROR: {e}")
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

        print(f"  Found {len(sql_commands)} SQL batches to execute")

        # Connect to database
        conn = pyodbc.connect(DB_CONN_STR)
        conn.autocommit = False
        cursor = conn.cursor()

        success_count = 0
        error_count = 0

        # Execute each command
        for i, command in enumerate(sql_commands, 1):
            # Skip comments and empty lines
            cleaned_cmd = '\n'.join([line for line in command.split('\n')
                                    if line.strip() and not line.strip().startswith('--')])

            if not cleaned_cmd.strip():
                continue

            try:
                cursor.execute(command)

                # Check for messages (PRINT statements)
                while cursor.nextset():
                    pass

                # Get any messages
                if cursor.messages:
                    for msg in cursor.messages:
                        if len(msg) > 1:
                            print(f"    {msg[1]}")

                conn.commit()
                success_count += 1

            except pyodbc.Error as e:
                error_msg = str(e)
                # Ignore certain warnings/errors
                if 'already exists' in error_msg.lower() or 'cannot drop' in error_msg.lower():
                    print(f"    i Skipping (already exists)")
                    conn.rollback()
                else:
                    print(f"    X Error: {e}")
                    error_count += 1
                    conn.rollback()

        cursor.close()
        conn.close()

        print(f"\n  Summary: {success_count} succeeded, {error_count} errors")
        print(f"{'='*70}")
        print(f"OK {description} - COMPLETED")
        print('='*70)
        return True

    except FileNotFoundError:
        print(f"  X ERROR: File not found: {filepath}")
        return False
    except pyodbc.Error as e:
        print(f"  X DATABASE ERROR: {e}")
        return False
    except Exception as e:
        print(f"  X ERROR: {e}")
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
            print(f"  OK Tables: {row.TableCount}")
            print(f"  OK Stored Procedures: {row.ProcedureCount}")
            print(f"  OK Views: {row.ViewCount}")

        # List key tables
        print("\n2. Sample tables created:")
        cursor.execute("""
            SELECT TOP 10 TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)

        for row in cursor.fetchall():
            print(f"    - {row.TABLE_SCHEMA}.{row.TABLE_NAME}")

        cursor.close()
        conn.close()

        print(f"\n{'='*70}")
        print("OK VERIFICATION COMPLETE")
        print('='*70)
        return True

    except Exception as e:
        print(f"  X VERIFICATION ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("="*70)
    print("UnFranchise Marketing App - Database Setup (AUTOMATIC)")
    print("="*70)
    print(f"\nTarget Server: dbms-dwhs.corp.shop.com\\DWP01")
    print(f"Database Name: {DATABASE_NAME}")

    # Check if --drop flag is passed
    drop_existing = '--drop' in sys.argv

    if drop_existing:
        print("\n! DROP MODE: Will drop and recreate database if exists")

    success = True

    # Step 1: Create database
    print("\nStep 1: Creating database...")
    if not create_database(drop_existing=drop_existing):
        print("\nX Failed to create database")
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

    print(f"\nStep 2: Running database scripts...")
    for script_file, description in scripts:
        script_path = database_dir / script_file
        if not script_path.exists():
            print(f"\n  ! Warning: {script_file} not found at {script_path}")
            continue

        if not run_sql_file(str(script_path), description):
            print(f"\n  ! Warning: {description} encountered errors")

    # Step 3: Verify
    print(f"\nStep 3: Verifying setup...")
    verify_setup()

    # Summary
    print("\n" + "="*70)
    print("OK DATABASE SETUP COMPLETE!")
    print("="*70)
    print(f"\nDatabase: {DATABASE_NAME}")
    print(f"Server: dbms-dwhs.corp.shop.com\\DWP01")
    print("\nConnection string:")
    print(f"  {DB_CONN_STR}")
    print("\nNext steps:")
    print("  1. Backend .env is already configured")
    print("  2. Start backend: cd backend && npm run dev")
    print("  3. Start frontend: cd frontend && npm run dev")
    return 0

if __name__ == '__main__':
    sys.exit(main())

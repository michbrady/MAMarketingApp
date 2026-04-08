"""Check available ODBC drivers"""
import pyodbc

print("Available ODBC Drivers:")
print("="*50)

drivers = pyodbc.drivers()
for i, driver in enumerate(drivers, 1):
    print(f"{i}. {driver}")

if not drivers:
    print("No ODBC drivers found!")
    print("\nYou may need to install:")
    print("  - ODBC Driver 17 for SQL Server")
    print("  - ODBC Driver 18 for SQL Server")
else:
    print("\n" + "="*50)
    print(f"Total: {len(drivers)} driver(s) found")

    # Find SQL Server drivers
    sql_drivers = [d for d in drivers if 'SQL Server' in d]
    if sql_drivers:
        print(f"\nSQL Server drivers:")
        for driver in sql_drivers:
            print(f"  - {driver}")

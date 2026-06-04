import sqlite3

conn = sqlite3.connect("data/college.db")
cursor = conn.cursor()

cursor.execute("""
SELECT name
FROM sqlite_master
WHERE type='table'
ORDER BY name;
""")

tables = [row[0] for row in cursor.fetchall()]

for table in tables:

    print(f"\n\n===== {table} =====")

    cursor.execute(f"PRAGMA table_info({table})")

    print("\nColumns:")

    for col in cursor.fetchall():
        print(col)

    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"\nRows: {count}")
    except:
        pass

conn.close()
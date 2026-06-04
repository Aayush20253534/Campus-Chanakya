import os
import sqlite3
import psycopg
from dotenv import load_dotenv

load_dotenv()

SQLITE_DB = "data/college.db"
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in .env")

TABLES = [
    "students",
    "teachers",
    "timetable",
    "assignments",
    "attendance_logs",
    "posts",
    "post_votes",
    "results",
]

sqlite_conn = sqlite3.connect(SQLITE_DB)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

pg_conn = psycopg.connect(DATABASE_URL)
pg_cur = pg_conn.cursor()

try:
    for table in TABLES:
        print(f"\nMigrating {table}...")

        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = sqlite_cur.fetchall()

        pg_cur.execute(f"DELETE FROM {table}")

        if not rows:
            pg_conn.commit()
            print(f"{table}: 0 rows")
            continue

        columns = rows[0].keys()
        column_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        inserted = 0

        for row in rows:
            values = [row[col] for col in columns]

            pg_cur.execute(
                f"""
                INSERT INTO {table} ({column_names})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
                """,
                values,
            )

            inserted += 1

        pg_conn.commit()
        print(f"{table}: {inserted} rows migrated")

    print("\nMigration completed successfully.")

except Exception as e:
    pg_conn.rollback()
    print("\nMigration failed:")
    print(e)

finally:
    sqlite_conn.close()
    pg_conn.close()
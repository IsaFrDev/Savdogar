import sqlite3
import os

db_path = 'db.sqlite3'
with open('notifications_schema_full.txt', 'w', encoding='utf-8') as f:
    if not os.path.exists(db_path):
        f.write(f"Database not found at {db_path}\n")
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        f.write("--- Schema for 'notifications' table ---\n")
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications'")
        row = cursor.fetchone()
        if row:
            f.write(row[0] + "\n")
        else:
            f.write("Table 'notifications' not found.\n")

        f.write("\n--- Columns for 'notifications' table ---\n")
        cursor.execute("PRAGMA table_info(notifications)")
        columns = cursor.fetchall()
        for col in columns:
            f.write(str(col) + "\n")

        conn.close()
print("Done. Schema written to notifications_schema_full.txt")

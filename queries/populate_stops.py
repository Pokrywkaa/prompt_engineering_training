import sqlite3
import csv

# Connect to SQLite database (creates it if it doesn't exist)
conn = sqlite3.connect('trips.sqlite')
cursor = conn.cursor()

# Create the 'stops' table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS stops (
    stop_id INTEGER,
    stop_code INTEGER,
    stop_name TEXT,
    stop_lat REAL,
    stop_lon REAL
)
''')

# Read the CSV file and insert data
with open('OtwartyWroclaw_rozklad_jazdy_GTFS/stops.txt', 'r', encoding='utf-8') as csvfile:
    csvreader = csv.reader(csvfile)
    next(csvreader)  # Skip header
    for row in csvreader:
        cursor.execute('''
        INSERT INTO stops (
            stop_id, stop_code, stop_name, stop_lat, stop_lon
        ) VALUES (?, ?, ?, ?, ?)
        ''', row)

# Commit and close
conn.commit()
conn.close()

print("✅ Data successfully inserted into 'stops' table in 'trips.sqlite'.")

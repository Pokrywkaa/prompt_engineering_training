import sqlite3
import csv

# Connect to SQLite database (creates it if it doesn't exist)
conn = sqlite3.connect('trips.sqlite')
cursor = conn.cursor()

# Create the 'stop_times' table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS stop_times (
    trip_id TEXT,
    arrival_time TEXT,
    departure_time TEXT,
    stop_id INTEGER,
    stop_sequence INTEGER,
    pickup_type INTEGER,
    drop_off_type INTEGER
)
''')

# Read the CSV file and insert data
with open('OtwartyWroclaw_rozklad_jazdy_GTFS/stop_times.txt', 'r', encoding='utf-8') as csvfile:
    csvreader = csv.reader(csvfile)
    next(csvreader)  # Skip header
    for row in csvreader:
        cursor.execute('''
        INSERT INTO stop_times (
            trip_id, arrival_time, departure_time, stop_id, stop_sequence,
            pickup_type, drop_off_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', row)

# Commit and close
conn.commit()
conn.close()

print("✅ Data successfully inserted into 'stop_times' table in 'trips.sqlite'.")
